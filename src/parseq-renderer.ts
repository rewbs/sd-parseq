import { calculateWeight } from './components/Prompts';
import { defaultFields } from './data/fields';
import { isValidNumber } from "./utils/maths";
//@ts-ignore
import { LTTB } from 'downsample';
import { AdvancedParseqPromptsV2, GraphableData, ParseqKeyframes, ParseqPersistableState, ParseqRenderedFrames, ParseqRenderedFramesMeta, RenderedData, SparklineData } from "./ParseqUI";
import { InvocationContext, ParseqAstNode } from "./parseq-lang/parseq-lang-ast";
import { defaultInterpolation, parse } from './parseq-lang/parseq-lang-parser';

export class ParseqRendererException {
    message: string;
    name = "ParseqRendererException";

    constructor(message: string) {
        this.message = message;
    }
}

export function getDefaultFieldValue(field: string) {
    const candidateDefaultValue = defaultFields.find((df) => df.name === field)?.defaultValue;
    if (candidateDefaultValue === undefined) {
        return 0;
    } else {
        return candidateDefaultValue;
    }
}

export const parseqRender = (input: ParseqPersistableState): { renderedData: RenderedData, graphData: GraphableData, sparklineData: SparklineData } => {
    const stats: { [key: string]: number } = {
        renderStartTime: Date.now(),
        parseEvents: 0,
        invokeEvents: 0
    };

    const keyframes = input.keyframes;
    const timeSeries = input.timeSeries;
    const options = input.options;
    const prompts = input.prompts as AdvancedParseqPromptsV2;

    const managedFields = input.managedFields;

    // Validation
    if (!keyframes) {
        throw new ParseqRendererException("No keyframes found.");
    }
    if (keyframes.length < 2) {
        throw new ParseqRendererException("There must be at least 2 keyframes to render.");
    }
    if (!options || !options.output_fps) {
        throw new ParseqRendererException("No output_fps found.");
    }
    if (!options.bpm) {
        throw new ParseqRendererException("No bpm found.");
    }

    let sortedKeyframes: ParseqKeyframes = keyframes.sort((a, b) => a.frame - b.frame);
    let firstKeyFrame = sortedKeyframes[0];
    let lastKeyFrame = sortedKeyframes[keyframes.length - 1];

    // Create implicit bookend keyframes to use any first or last values are missing.
    const bookendKeyFrames = { first: { frame: firstKeyFrame?.frame }, last: { frame: lastKeyFrame.frame } };
    (managedFields.concat(['frame'])).forEach((field) => {

        if (!isValidNumber(firstKeyFrame[field])) {
            const firstKeyFrameWithValueForField = sortedKeyframes.find((kf) => isValidNumber(kf[field]));

            const substituteValue = firstKeyFrameWithValueForField ? firstKeyFrameWithValueForField[field] : getDefaultFieldValue(field);
            //console.log(`No value found for ${field} on the first keyframe, using: ${substituteValue}`);
            bookendKeyFrames.first = { ...bookendKeyFrames.first, [field]: substituteValue };
        }
        if (!isValidNumber(lastKeyFrame[field])) {
            const lastKeyFrameWithValueForField = sortedKeyframes.findLast((kf) => isValidNumber(kf[field]));
            const substituteValue = lastKeyFrameWithValueForField ? lastKeyFrameWithValueForField[field] : getDefaultFieldValue(field);
            //console.log(`No value found for ${field} on the final keyframe, using: ${substituteValue}`);
            bookendKeyFrames.last = { ...bookendKeyFrames.last, [field]: substituteValue };
        }
    });

    // Calculate actual rendered value for all interpolatable fields
    const mainEvalStart = Date.now();
    let rendered_frames: ParseqRenderedFrames = [];
    var all_frame_numbers = Array.from(Array(lastKeyFrame.frame - firstKeyFrame.frame + 1).keys()).map((i) => i + firstKeyFrame.frame);
    const graphData: GraphableData = {};
    managedFields.forEach((field) => {

        graphData[field] = [];

        // Get all keyframes that have a value for this field
        const filtered = sortedKeyframes.filter(kf => isValidNumber(kf[field]));
        // Add bookend keyframes if they have a value for this field (implying none were present in the original keyframes)
        //@ts-ignore
        if (isValidNumber(bookendKeyFrames.first[field])) {
            filtered.unshift(bookendKeyFrames.first);
        }
        //@ts-ignore
        if (isValidNumber(bookendKeyFrames.last[field])) {
            filtered.push(bookendKeyFrames.last);
        }

        const definedFrames = filtered.map(kf => kf.frame);
        const definedValues = filtered.map(kf => Number(kf[field]));
        let lastInterpolator: ParseqAstNode = defaultInterpolation;

        let parseResult: any;
        let activeKeyframe = 0;
        let prev_computed_values: string[] | number[] = [];
        all_frame_numbers.forEach((frame, i) => {

            //let declaredRow = gridRef.current.api.getRowNode(frameToRowId(frame));
            let declaredRow = keyframes.find(kf => kf.frame === frame);
            let interpolator = lastInterpolator;

            // Is there a new interpolation function to parse?
            var toParse: string | number = '';
            if (declaredRow !== undefined) {
                toParse = declaredRow[field + '_i'];
                if (toParse) {
                    try {
                        parseResult = parse(String(toParse));
                        stats.parseEvents++;
                    } catch (error) {
                        throw new ParseqRendererException(`Error parsing interpolation for ${field} at frame ${frame} (${toParse}): ` + error);
                    }
                }
            }

            if (definedFrames.includes(frame)) {
                activeKeyframe = frame;
            }

            // Use the last successfully parsed result to determine the interpolation function.
            if (parseResult) {
                interpolator = parseResult as ParseqAstNode;
            }

            // invoke the interpolation function
            let computed_value: number | string = 0;
            try {
                const ctx: InvocationContext = {
                    frame,
                    fieldName: field,
                    activeKeyframe: activeKeyframe,
                    definedFrames: definedFrames,
                    definedValues: definedValues,
                    allKeyframes: keyframes,
                    FPS: options.output_fps,
                    BPM: options.bpm,
                    computed_values: prev_computed_values,
                    variableMap: new Map([["prev_computed_value", (frame>0) ? prev_computed_values[frame-1] : 0]]),
                    timeSeries: timeSeries,
                    rendered_frames
                }
                computed_value = interpolator.invoke(ctx);
                stats.invokeEvents++;
            } catch (error) {
                throw new ParseqRendererException(`Error calculating ${field} at frame ${frame} (${toParse}): ` + error);
            }
            rendered_frames[frame] = {
                ...rendered_frames[frame] || {},
                frame: frame,
                [field]: Number(computed_value) // TODO type coersion will need to change when we support string fields
            }
            graphData[field].push({ x: frame, y: Number(computed_value) });
            lastInterpolator = interpolator;
            //@ts-expect-error
            prev_computed_values.push(computed_value);
        });
    });
    stats.mainEvalTime = Date.now() - mainEvalStart;

    // Calculate rendered prompt based on prompts and weights
    const promptStart = Date.now();
    if (typeof (prompts.enabled) === 'undefined' || prompts.enabled) {
        all_frame_numbers.forEach((frame) => {

            // Pipeline for prompts (assuming enabled) at each frame:
            // - Establish which prompts are active at this frame, and with what weight. Append common prompt if necessary
            // - Perform parseq evaluation on both pos & neg
            // - Move terms between pos & neg if required
            // - Stitch active prompts together using composable diffusion
            // - Blend  pos & neg into deforum style single prompt
            const variableMap = managedFields
                .reduce((acc, field) => acc.set(field, rendered_frames[frame][field]), new Map<string, number | string>());

            const ctx: InvocationContext = {
                frame,
                fieldName: "prompt",
                activeKeyframe: frame,
                definedFrames: keyframes.map(kf => kf.frame),
                definedValues: [],
                FPS: options.output_fps,
                BPM: options.bpm,
                allKeyframes: keyframes,
                variableMap: variableMap,
                timeSeries: timeSeries,
                computed_values: []
            };

            try {

                const promptsWithWeights = getPromptsWithWeights(prompts, frame, lastKeyFrame.frame);
                const evaluatedPrompts = promptsWithWeights.map(pww => {
                    let [newPositive, newNegative] = [evaluateParseqExpressions(pww.positive, { ...ctx, promptType: true }), evaluateParseqExpressions(pww.negative, { ...ctx, promptType: false })];
                    [newPositive, newNegative] = moveSubstrings(newPositive, newNegative, 0);
                    [newNegative, newPositive] = moveSubstrings(newNegative, newPositive, 0);
                    return {
                        positive: newPositive,
                        negative: newNegative,
                        weight: evaluateParseqExpressions(pww.weight, ctx)
                    }
                });

                const positive_prompt = evaluatedPrompts.map(ep => ep.positive + (evaluatedPrompts.length > 1 ? `: ${ep.weight}` : '')).join(" AND ");
                const negative_prompt = evaluatedPrompts.map(ep => ep.negative + (evaluatedPrompts.length > 1 ? `: ${ep.weight}` : '')).join(" AND ");

                //@ts-ignore
                rendered_frames[frame] = {
                    ...rendered_frames[frame] || { frame },
                    deforum_prompt: negative_prompt ? `${positive_prompt} --neg ${negative_prompt}` : positive_prompt
                }
            } catch (error) {
                console.error(error);
                throw new ParseqRendererException(`Error parsing prompt on frame ${frame}: ` + error);
            }

        });
    }
    stats.promptCalcTimeMs = Date.now() - promptStart;

    // Calculate subseed & subseed strength based on fractional part of seed.
    const subseedStart = Date.now();
    if (managedFields.includes("seed")) {
        all_frame_numbers.forEach((frame) => {
            let subseed = Math.ceil(rendered_frames[frame]['seed'])
            let subseed_strength = rendered_frames[frame]['seed'] % 1

            //@ts-ignore
            rendered_frames[frame] = {
                ...rendered_frames[frame] || {},
                subseed: subseed,
                subseed_strength: subseed_strength
            }
        });
    }
    stats.subseedCalcTimeMs = Date.now() - subseedStart;

    // Calculate min/max of each field
    const metaStartTime = Date.now();
    var rendered_frames_meta: ParseqRenderedFramesMeta = []
    managedFields.forEach((field: string) => {
        let maxValue = Math.max(...rendered_frames.map(rf => Math.abs(rf[field])))
        let minValue = Math.min(...rendered_frames.map(rf => rf[field]))
        rendered_frames_meta = {
            ...rendered_frames_meta || {},
            [field]: {
                'max': maxValue,
                'min': minValue,
                'isFlat': minValue === maxValue,
            }
        }
    });
    stats.metaCalcTimeMs = Date.now() - metaStartTime;

    // Calculate delta variants
    const deltaStartTime = Date.now();
    all_frame_numbers.forEach((frame) => {
        managedFields.forEach((field: string) => {

            //@ts-ignore
            let maxValue = rendered_frames_meta[field].max;

            if (frame === 0) {
                //@ts-ignore
                const pcValue = (maxValue !== 0) ? rendered_frames[frame][field] / maxValue * 100 : rendered_frames[frame][field];
                //@ts-ignore
                rendered_frames[frame] = {
                    ...rendered_frames[frame] || {},
                    //@ts-ignore
                    [field + '_delta']: rendered_frames[0][field],
                    //@ts-ignore
                    [field + "_pc"]: pcValue,
                }
                graphData[field + '_pc'] = [{ x: 0, y: pcValue }];

            } else {
                //@ts-ignore
                const pcValue = (maxValue !== 0) ? rendered_frames[frame][field] / maxValue * 100 : rendered_frames[frame][field]
                rendered_frames[frame] = {
                    ...rendered_frames[frame] || {},
                    [field + '_delta']: (field === 'zoom') ? 1 + (rendered_frames[frame][field] - rendered_frames[frame - 1][field]) : rendered_frames[frame][field] - rendered_frames[frame - 1][field],
                    //[field + '_delta']: (field === 'zoom') ? rendered_frames[frame][field] / rendered_frames[frame - 1][field] : rendered_frames[frame][field] - rendered_frames[frame - 1][field],
                    [field + "_pc"]: pcValue,
                }
                graphData[field + '_pc'].push({ x: frame, y: pcValue });
            }
        });
    });
    stats.deltaCalcTimeMs = Date.now() - deltaStartTime;

    const decimationStartTime = Date.now();
    const sparklineData: SparklineData = [];
    managedFields.forEach((field: string) => {
        //@ts-ignore
        sparklineData[field] = LTTB(graphData[field], 100).map((point) => point.y);
        //@ts-ignore
        sparklineData[field + '_delta'] = LTTB(rendered_frames.map((frame) => [frame.frame, frame[field + '_delta']]), 100).map((point) => point[1]);
    });
    stats.decimationTimeMs = Date.now() - decimationStartTime;

    const renderedData: RenderedData = {
        ...input,
        "rendered_frames": rendered_frames,
        "rendered_frames_meta": rendered_frames_meta
    }

    stats.keyframes = keyframes.length;
    stats.fields = managedFields.length;
    stats.frames = lastKeyFrame.frame;
    stats.renderTimeMs = Date.now() - stats.renderStartTime;
    console.log("render stats:", stats);

    return { renderedData, graphData, sparklineData };
}


function moveSubstrings(str1: string, str2: string, insertPos: number): [string, string] {
    // find matches
    const matches = Array.from(str1.matchAll(/__PARSEQ_MOVE__(.*?)__PARSEQ_END_MOVE__/g))

    // remove matches from str1
    for (const match of matches) {
        str1 = str1.replace(match[0], '');
        str2 = str2.slice(0, insertPos) + ` ${match[1]} ` + str2.slice(insertPos);
    }

    return [str1, str2];
}

type UnevaluatedPromptsAndWeights = {
    positive: string,
    negative: string,
    weight: string,
}[];


function evaluateParseqExpressions(str: string, ctx: InvocationContext): string {
    return str.replace(/\$\{(.*?)\}/sg, (_, expr) => { const result = parse(expr).invoke(ctx); return typeof result === "number" ? result.toFixed(5) : result; })
        .replace(/(\n)/g, " ");
}

function getPromptsWithWeights(prompts: AdvancedParseqPromptsV2, frame: number, lastFrame: number): UnevaluatedPromptsAndWeights {
    return prompts.promptList
        .map((p, idx) => ({
            ...p,
            name: "prompt" + (idx + 1),
        }))
        .filter(p => p.allFrames || (frame >= p.from && frame <= p.to))
        .map(p => ({
            positive: p.positive + (prompts.commonPrompt.positive ? ` ${prompts.commonPrompt.positive}` : ''),
            negative: p.negative + (prompts.commonPrompt.negative ? ` ${prompts.commonPrompt.negative}` : ''),
            weight: calculateWeight(p, frame, lastFrame)
        }));
}