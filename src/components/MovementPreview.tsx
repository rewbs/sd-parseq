import { Alert, Stack, Typography } from "@mui/material";
import { P5CanvasInstance, ReactP5Wrapper, SketchProps } from "@p5-wrapper/react";
import _ from "lodash";
import { all, create } from 'mathjs';
import { useMemo, useState } from "react";
import { ParseqRenderedFrames } from "../ParseqUI";

const config = {}
const m = create(all, config)

type MySketchProps = SketchProps & {
    renderedData: ParseqRenderedFrames,
    currentFrame: number,
    manualRotation: number[],
    manualTranslation: number[],
};

const sketch = (p5: P5CanvasInstance) => {
    //let currentFrame = 0; // not currently used
    let renderedData: ParseqRenderedFrames = [];
    let generationBuffer: any = undefined;
    let inputBuffer: any = undefined;
    let myFont: any = undefined;
    let manualRotation = [0,0,0];
    let manualTranslation = [0,0,0];

    p5.updateWithProps = (props: MySketchProps) => {
        if (props.renderedData) {
            renderedData = props.renderedData;
        }
        if (_.isNumber(props.currentFrame)) {
            //currentFrame = props.currentFrame; // Currently unused
        }
        manualRotation = props.manualRotation;
        manualTranslation = props.manualTranslation;
    };

    p5.preload = () => {
        //console.log("In preload", p5);
        myFont = p5.loadFont('OpenSans-Light.ttf');
        p5.frameRate(5);
    }

    p5.setup = () => {
        //console.log("In setup", p5);

        if (!generationBuffer || !inputBuffer) {
            //perspective(512) // TODO figure out how to convert deforum perspective
            p5.createCanvas(512, 512, "webgl");
            p5.imageMode("center");
            p5.rectMode("center");
            p5.frameRate(10);
            p5.background(0);
        }

        if (!generationBuffer) {
            generationBuffer = p5.createGraphics(512, 512, "webgl");
            generationBuffer.imageMode("center");
            generationBuffer.rectMode("center");
            generationBuffer.strokeWeight(1)
            generationBuffer.noFill();
        }

        if (!inputBuffer) {
            inputBuffer = p5.createGraphics(512, 512, "webgl");
            inputBuffer.imageMode("center");
            inputBuffer.rectMode("center");
            inputBuffer.background(0);
        }

    }


    p5.draw = () => {

        if (!inputBuffer || !generationBuffer) {
            console.error("P5 draw() called before p5 setup().")
            return;
        }

        const totalFrames = renderedData.length || 100;
        const frame = (p5.frameCount-1) % totalFrames;
        if (frame === 0) {
            p5.clear(0);
            p5.background(0);
            inputBuffer.clear(0);
            inputBuffer.background(0);
            generationBuffer.clear(0);
            generationBuffer.background(0);
        }
        const frameCountSpan = document.getElementById("frameCount");
        if (frameCountSpan) {
            frameCountSpan.innerText = `${frame}/${totalFrames}`;
        }

        //console.log(`Drawing frame ${frame}/${renderedData.length - 1} (p5 total: ${p5.frameCount}) at ${p5.frameRate().toFixed(2)}fps`);

        // Read transform parameters
        let rotate: number[];
        let translate: number[];
        let prompt = "";
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
        //console.log(`Translate: ${translate}, rotate: ${rotate}`);
        inputBuffer.translate(translate[0], translate[1], translate[2]);
        inputBuffer.rotateX(p5.radians(rotate[0]));
        inputBuffer.rotateY(p5.radians(rotate[1]));
        inputBuffer.rotateZ(p5.radians(rotate[2]));

        // Perform "generation"
        const strength = 1;
        generationBuffer.reset();
        generationBuffer.resetMatrix();
        generationBuffer.clear(0); // TODO check alpha behaviour
        if ((frame - 1) % 10 === 0) {
            // simulate low deforum strength: copy previous frame, very faded.
            generationBuffer.tint(255, 220 * strength);
            generationBuffer.image(inputBuffer, 0, 0);

            // generate new content over the top
            const newImageAlpha = 200;
            generationBuffer.tint(255, 255);
            generationBuffer.strokeWeight(3);
            generationBuffer.stroke(0, 255, 255, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height - 10, inputBuffer.width - 10);
            generationBuffer.stroke(255, 200, 200, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height / 1.5, inputBuffer.height / 2)
            generationBuffer.stroke(200, 200, 255, newImageAlpha);
            generationBuffer.rect(0, 0, inputBuffer.height / 3, inputBuffer.height / 4)

        } else {
            // simulate high deforum strength: copy previous frame, slightly faded.
            generationBuffer.tint(255, 245);
            generationBuffer.image(inputBuffer, 0, 0);
        }

        // Display generated image
        p5.image(generationBuffer, 0, 0);
        p5.fill('#ED225D');
        p5.textFont(myFont, 15);
        p5.text(`frame: ${frame}`, -p5.width / 2 + 20, p5.height / 2 - 20);

        // Copy generated image to input for next loop
        inputBuffer.image(generationBuffer, 0, 0);

    };
};

type MovementPreviewProps = {
    renderedData: ParseqRenderedFrames,
};

export const MovementPreview = ({renderedData} : MovementPreviewProps ) => {

    const [currentFrame, setCurrentFrame] = useState(0);
    const [manualTranslation, setManualTranslation] = useState([0, 0, 0]);
    const [manualRotation, setManualRotation] = useState([0, 0, 0]);

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
        />;
    }, [renderedData, currentFrame, manualRotation, manualTranslation]);

    return <Stack direction="column" spacing={2} alignItems={"center"}>
        <Alert severity="warning">
                <p>This experimental feature gives you a rough idea of what your camera movements look like.
                Inspired by <a href="https://colab.research.google.com/github/pharmapsychotic/ai-notebooks/blob/main/pharmapsychotic_AnimationPreview.ipynb">AnimationPreview by @pharmapsychotic</a>.
                </p>
                <p>
                Not identical to Deforum's algorithm.
                Only works for 3D animation params (x, y, z translation and rotation).
                Does not factor in FPS, strength or perspective.
                </p>
                Improvements soon. Feedback welcome!
            </Alert>
        {sketchElem}
        <Typography fontFamily={"monospace"}>Frame: <span id="frameCount">0</span></Typography>
        <Typography fontSize={"0.75em"} fontFamily={"monospace"}><span id="prompt"></span></Typography>
    </Stack>

}


export default MovementPreview;

