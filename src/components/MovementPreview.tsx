import { Alert, Stack, Tooltip, Typography } from "@mui/material";
import { P5CanvasInstance, ReactP5Wrapper, SketchProps } from "@p5-wrapper/react";
import _ from "lodash";
import { all, create } from 'mathjs';
import { useMemo, useState } from "react";
import { ParseqRenderedFrames } from "../ParseqUI";
import { SmallTextField } from "./SmallTextField";

const config = {}
const m = create(all, config)

type MySketchProps = SketchProps & {
    renderedData: ParseqRenderedFrames,
    currentFrame: number,
    manualRotation: number[],
    manualTranslation: number[],
    fps: number,
    cadence: number,
    width: number,
    height: number
};

const sketch = (p5: P5CanvasInstance) => {
    //let currentFrame = 0; // not currently used
    let renderedData: ParseqRenderedFrames = [];
    let generationBuffer: any = undefined;
    let inputBuffer: any = undefined;
    let myFont: any = undefined;
    let manualRotation = [0,0,0];
    let manualTranslation = [0,0,0];
    let cam : any = undefined;
    let fps = 20;
    let cadence = 10;
    let height = 512;
    let width = 512;

    p5.updateWithProps = (props: MySketchProps) => {
        if (props.renderedData) {
            renderedData = props.renderedData;
        }
        if (_.isNumber(props.currentFrame)) {
            //currentFrame = props.currentFrame; // Currently unused
        }
        manualRotation = props.manualRotation;
        manualTranslation = props.manualTranslation;
        fps = props.fps;
        cadence = props.cadence;
        height = props.height;
        width = props.height;
    };

    p5.preload = () => {
        //console.log("In preload", p5);
        myFont = p5.loadFont('OpenSans-Light.ttf');
        
    }

    p5.setup = () => {
        //console.log("In setup", p5);

        if (!generationBuffer || !inputBuffer) {
            //perspective(height) // TODO figure out how to convert deforum perspective
            console.log("Creating canvas", width, height);
            p5.createCanvas(width, height, "webgl");
            p5.imageMode("center");
            p5.rectMode("center");
            p5.frameRate(10);
            p5.background(0);
            p5.fill('#ED225D');
            p5.textFont(myFont, 15);    
        }

        if (!generationBuffer) {
            generationBuffer = p5.createGraphics(width, height, "webgl");
            generationBuffer.imageMode("center");
            generationBuffer.rectMode("center");
            generationBuffer.strokeWeight(1)
            generationBuffer.noFill();
        }

        if (!inputBuffer) {
            inputBuffer = p5.createGraphics(width, height, "webgl");
            inputBuffer.imageMode("center");
            inputBuffer.rectMode("center");
            inputBuffer.background(0);
        }
        if (!cam) {
            cam = p5.createCamera();
        }

        //p5.saveGif("test.gif", renderedData.length);

    }


    p5.draw = () => {

        if (!inputBuffer || !generationBuffer || !cam) {
            console.error("P5 draw() called before p5 setup().")
            return;
        }

        const totalFrames = renderedData.length ? renderedData.length-1 : 100;
        const frame = (p5.frameCount-1) % totalFrames;
        if (frame === 0) {
            p5.clear(0);
            p5.background(0);
            inputBuffer.clear(0);
            inputBuffer.background(0);
            generationBuffer.clear(0);
            generationBuffer.background(0);
            p5.frameRate(fps); // TODO this isn't taking hold. Why?
        }
        const frameCountSpan = document.getElementById("frameCount");
        if (frameCountSpan) {
            frameCountSpan.innerText = `${frame}/${totalFrames} (fps:${p5.frameRate().toFixed(2)})`;
        }

        //console.log(`Drawing frame ${frame}/${renderedData.length - 1} (p5 total: ${p5.frameCount}) at ${p5.frameRate().toFixed(2)}fps`);

        // Read transform parameters
        let rotate: number[];
        let translate: number[];
        let prompt = "";
        let fov = 40;
        let near = 200;
        let far = 1000;
        let strength = 1;
        if (renderedData && renderedData.length > frame) {
            rotate = [
                renderedData[frame]['rotation_3d_x_delta'] || 0,
                renderedData[frame]['rotation_3d_y_delta'] || 0,
                renderedData[frame]['rotation_3d_z_delta'] || 0,
            ];

            translate = [
                renderedData[frame]['translation_x_delta'] || 0,
                renderedData[frame]['translation_y_delta'] || 0,
                renderedData[frame]['translation_z_delta'] || 0,
            ];
            prompt = renderedData[frame]['deforum_prompt'];
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            fov = renderedData[frame]['fov'] || 40;
            near = renderedData[frame]['near'] || 200;
            far = renderedData[frame]['far'] || 1000;
            strength = renderedData[frame]['strength'] || 0.7;
        } else {
            prompt = "Manual mode";
            rotate = manualRotation;
            translate = manualTranslation;
        }
        const promptSpan = document.getElementById("prompt");
        if (promptSpan) {
            promptSpan.innerText = prompt;
        }

        // Transform the previous frame
        inputBuffer.reset();
        inputBuffer.resetMatrix();
        cam = inputBuffer.createCamera();

        // CAMERA MOTION
        cam.perspective(p5.radians(60), 1, near, far);
        cam.move(translate[0], -translate[1], -translate[2]);
        cam.tilt(-p5.radians(rotate[0]));
        cam.pan(-p5.radians(rotate[1]));
        //p5 has no roll function for the camera
        inputBuffer.rotateZ(-p5.radians(rotate[2]));

        // Perform "generation"
        generationBuffer.reset();
        generationBuffer.resetMatrix();
        generationBuffer.clear(0); // TODO check alpha behaviour
        if ((frame) % cadence === 0) {
            // High strength preserves more of the previous frame
            generationBuffer.tint(255, (255*strength));
            generationBuffer.image(inputBuffer, 0, 0);

            // generate new content over the top.
            // High strength means new generation is weaker
            const newImageAlpha = frame === 0 ? 255 :  (255 - (255*strength));
            generationBuffer.noFill();
            generationBuffer.strokeWeight(3);
            generationBuffer.stroke(0, Math.random()*255, 255, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height - 10, inputBuffer.width - 10);
            generationBuffer.stroke(Math.random()*255, 200, 200, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height / 1.5, inputBuffer.height / 2)
            generationBuffer.stroke(200, 200, Math.random()*255, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height / 3, inputBuffer.height / 4)
            generationBuffer.fill(0, 255, 255, newImageAlpha);
            generationBuffer.textFont(myFont, 15);
            generationBuffer.fill(255, 255, 255, newImageAlpha);            
            generationBuffer.text(frame, 0, 0);
        } else {
            // simulate high deforum strength: copy previous frame, slightly faded.
            generationBuffer.tint(255, 250 + 5*strength);
            generationBuffer.image(inputBuffer, 0, 0);
        }

        // Display generated image
        p5.image(generationBuffer, 0, 0);
        //p5.text(text, -p5.width / 2 + 20, p5.height / 2 - 20);

        // Copy generated image to input for next loop
        inputBuffer.image(generationBuffer, 0, 0);

    };
};

type MovementPreviewProps = {
    renderedData: ParseqRenderedFrames,
    fps: number,
    width: number,
    height: number
    hideWarning?: boolean
    hidePrompt?: boolean
    hideCadence?: boolean
    hideFrame?: boolean
};

export const MovementPreview = ({renderedData, fps, width, height, hideWarning, hideCadence, hidePrompt, hideFrame} : MovementPreviewProps ) => {

    const [currentFrame, setCurrentFrame] = useState(0);
    const [manualTranslation, setManualTranslation] = useState([0, 0, 0]);
    const [manualRotation, setManualRotation] = useState([0, 0, 0]);
    const [cadence, setCadence] = useState("10");

    onkeydown = (e) => {
        switch (e.key) {
            case 'ArrowRight':
                setManualRotation(r => m.add(r, [0, 1, 0]));
                break;
            case 'ArrowLeft':
                setManualRotation(r => m.add(r, [0, -1, 0]));
                break;
            case 'ArrowUp':
                setManualRotation(r => m.add(r, [1, 0, 0]));
                break;
            case 'ArrowDown':
                setManualRotation(r => m.add(r, [-1, 0, 0]));
                break;
            case 'e':
                setManualRotation(r => m.add(r, [0, 0, 1]));
                break;
            case 'q':
                setManualRotation(r => m.add(r, [0, 0, -1]));
                break;
            case 'w':
                setManualTranslation(t => m.add(t, [0, 0, 1]));
                break;
            case 's':
                setManualTranslation(t => m.add(t, [0, 0, -1]));
                break;
            case 'a':
                setManualTranslation(t => m.add(t, [1, 0, 0]));
                break;
            case 'd':
                setManualTranslation(t => m.add(t, [-1, 0, 0]));
                break;
            case 'r':
                setManualTranslation(t => m.add(t, [0, 1, 0]));
                break;
            case 'f':
                setManualTranslation(t => m.add(t, [1, -1, 0]));
                break;
            case 'Escape':
                setManualTranslation([0, 0, 0]);
                setManualRotation([0, 0, 0]);
                setCurrentFrame(0);
                break;
            default:
                //console.log(e.key)
        }
    }

    const sketchElem = useMemo(() => {
        return <ReactP5Wrapper
            sketch={sketch}
            renderedData={renderedData}
            frame={currentFrame}
            manualTranslation={manualTranslation}
            manualRotation={manualRotation}
            fps={fps}
            cadence={parseInt(cadence)}
            width={width}
            height={height}
        />;
    }, [renderedData, currentFrame, manualTranslation, manualRotation, fps, cadence, width, height]);

    return <Stack direction="column" spacing={2} alignItems={"center"}>
        {hideWarning || <Alert severity="warning">
                <p>This experimental feature gives you a rough idea of what your camera movements will look like.
                Inspired by <a href="https://colab.research.google.com/github/pharmapsychotic/ai-notebooks/blob/main/pharmapsychotic_AnimationPreview.ipynb">AnimationPreview by @pharmapsychotic</a>.
                </p>
                <ul>
                    <li>This is a rough reference only: the image warping algorithm is not identical to Deforum's.</li>
                    <li>This currently only works for 3D animation params (x, y, z translation and 3d rotation).</li>
                    <li>Does not factor in FPS or perspective params (fov, near, far).</li>
                    <li>Using a higher cadence (~10) in this preview can make it easier to see the effect of your camera movements. However, whether you should use a high cadence during your real generation depends on how often you want the Diffusion process to run.</li>
                </ul>
                Feedback welcome on <a href="https://discord.gg/deforum">Discord</a> or <a href="https://github.com/rewbs/sd-parseq/issues">GitHub</a>.
            </Alert>
        }
        {sketchElem}
        {hideCadence || <Tooltip title="In this preview, a higher cadence can make it easier to see the effect of your camera movements. However, whether you should use a high cadence during your actual generation depends on how often you want the Diffusion process to run.">
            <SmallTextField 
                value={cadence}
                label="Cadence"
                type="number"
                onChange={(e) => setCadence(e.target.value)}
            />
        </Tooltip>
        }
        {hideFrame || <Typography fontFamily={"monospace"}>Frame: <span id="frameCount">0</span></Typography> }
        {hidePrompt || <Typography fontSize={"0.75em"} fontFamily={"monospace"}><span id="prompt"></span></Typography> }
    </Stack>

}

export default MovementPreview;


// o = JSON.parse(JSON.parse($('pre').innerText).parseq_manifest); delete o['rendered_frames']; o