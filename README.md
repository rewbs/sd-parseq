# Stable Diffusion Parseq

## What is this?

For context: [Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool and [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a web ui for that tool.

Parseq is a _parameter sequencer_ for [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui). You can use it to generate videos with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, denoising strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/199899245-46643e77-bb10-4367-b6bd-b2a699fb612c.png">

It can be used in 2 ways: with a custom script for Automatic1111, or with the [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui). 

You can jump straight into the UI here: https://sd-parseq.web.app/ .

## Installation

### Option 1: Deforum integration 

Use this approach if you like animating with Deforum and want to use Parseq as a IU to degine

- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Install the Deforum extension [from this branch](https://github.com/rewbs/deforum-for-automatic1111-webui). 
- Relaunch Auto1111 – You should now see a `Parseq` tab under the `Deforum` extension:

<img width="500" alt="image" src="https://i.imgur.com/oizeKMa.png">

### Option 2: Parseq script

This is mostly a legacy approach: Deforum is by far a more powerful animation back-end. Use this approach if you don't want to use Deforum for some reason, and would prefer to use Parseq's own back-end integration with A1111. 

- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Install ffmpeg](https://ffmpeg.org/download.html)
- Ensure A1111 can resolve the python library `ffmpeg-python`:
   - On Windows: edit `requirements_versions.txt` in the top level directory of A111, and add the line: `ffmpeg-python==0.2.0`.
   - On Mac/Linux: edit `requirements.txt` in the top level directory of A111, and add the line: `ffmpeg-python`.   
- From this repository, copy `scripts/parseq_script.py` and `scripts/parseq_core.py` to the `/scripts` subdirectory in your SD webui installation.
- Restart the webui (or do a full Gradio reload from the settings screen). You should now see `SD Parseq <version>` as a script available in the img2img section:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/196208333-da171e3e-65a4-4afa-b3bb-9677fd5dae16.png">


## Examples

Here are some examples of what you can do with this. Most of these were generated at 20fps then smoothed to 60fps with ffmpeg minterpolate.

- Img2img loopback using Deforum, with fluctiations on many parameters, and sync'ed to audio :

https://user-images.githubusercontent.com/74455/199890662-9f446def-0582-4021-8249-84ce6b7df5d7.mp4


- Vid2vid using the Parseq script backend, with fluctuations on many different params to attempt to synchronise param changes and image movement to music. The input audio is an excerpt of [The Prodigy - Smack My Bitch Up (Noisia Remix)](https://www.youtube.com/watch?v=r5OgQCvqbYA), and the original input video was generated with [Butterchurn](https://butterchurnviz.com/). Includes a side-by-side comparison of the original input video, the "dry run" video (which includes all pre-processing but no Stable Diffusion), and the final output:

https://user-images.githubusercontent.com/74455/199890420-9c939e3a-ae8e-4262-9805-da0f45b4c0bc.mp4


- Loopback using Deforum video where we oscillate between a few famous faces with some 3d movement and occasional denoising spikes to reset the context:

https://user-images.githubusercontent.com/74455/199898527-edcf7537-25ac-4d3f-b91f-8e9e89e252dc.mp4


## Usage

### Step 1: Create your parameter manifest

* Go to https://sd-parseq.web.app/ or https://sd-parseq.web.app/deforum (or run the UI yourself from this repo with `npm start`)
* Edit the table at the top to specify your keyframes and parameter values at those keyframes. See below for more information about what you can do here.
* Hit `Render` to generate the JSON config for every frame.
* Copy the contents of the textbox at the bottom

### Step 2: Generate the video

* Head to the SD web UI, go to the img2img tab and select the SD Parseq script OR the Deforum tab and then the Parseq tab.
* Paste in the JSON blob you copied in step 1.
* Fiddle with any other settings you want to tweak.
* Click generate.

<img width="1911" alt="image" src="https://user-images.githubusercontent.com/74455/196210360-7f2f6879-52d5-4537-86a0-71faafd515b9.png">

## Limitations & Caveats

### UI
- UI can get sluggish with 1000s of frames. Lots of room for optimisation.

### Parseq backend script

- The script deliberately overrides/ignores various settings that are defined outside of the script's parameters, including: seed, denoise strength, denoise strength scale factor, color correction, output path, etc... This is intentional but may be a source of confusion.
- Does not yet support batches. Only 1 output is ever generated per run. Batch size and batch count are ignored.
- Does not yet add noise in the blank areas created when zooming out or rotating.
- Chokes on .mov inputs because of a failure to get the total frame count. Seems to work with mp4 (so you just need to preprocess with ffmpeg).
- Rotation and zoom params have a very different impact on loopback. For example, if you linearly interpolate z-rotation from 0 to 360 over 36 frames, with vid2vid you'll get a single full rotation (10deg per frame), whereas with loopback you'll get an accelarating rotation because each looped-back input frame is already rotated.
- A seed value of -1 will be re-evaluated as a random value on every frame. If you want a fixed random seed on all frames, pick a number and lock it in over all your frames in Parseq.

## UI Features

### Intro to scriptable / keyframable parameter values

Parseq's main feature is advanced control over parameter values, with interesting interpolation features.

This all happens in the grid. Start by selecting the values you want to work with in the "fields to display" drop-down on the right. In this example, we'll use `denoise`, `prompt_1_weight`, and `prompt_2_weight`:

<img width="1069" alt="image" src="https://user-images.githubusercontent.com/74455/196230780-83681a78-cb70-4553-8f02-5e11b85efc5d.png">

Next we'll set the number of frames we want to work with by setting the frame number of the last row. We'll set it to 101 frames. You can always change this later. Tip: if you want to match a frame count from an input video, you can count the video's frames quickly from the CLI with ffmpeg's `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -print_format csv <input_video.mp4>`.

<img width="1045" alt="image" src="https://user-images.githubusercontent.com/74455/196231818-3396eb25-d0f4-4e21-864a-464158d46f9f.png">

Now we'll add some keyframes. We'll set them at frames 25, 50 and 75. We can always change them later or add more.

<img width="858" alt="image" src="https://user-images.githubusercontent.com/74455/196232289-217093de-2bfa-4322-b218-73668af30074.png">

(Note that the first and last frames MUST have values for all fields. Rendering will fail if you remove any because start and end values are required for interpolation.)

In this video, we'd like prompt 1 to start off weak, become strong in the middle of the video, and then become weak again. Easy! Put in some values for prompt_1_weight and hit render. You'll see it interpolates linearly by default, and if a value is empty in a keyframe we interpolate straight through it.

You might be wondering what the arrow (➟) columns are next to the value columns. These are the interpolation columns, and they let you specify how the value should "travel" from this point onwards. The default is linear interpolation, but you override this with `S` for Step, `C` for cubic, and `P` for Polinomial. Let's give it a go:

<img width="1063" alt="image" src="https://user-images.githubusercontent.com/74455/196233767-bf10dfdf-78ed-4d1f-8974-1b99d12de49d.png">

You can also switch interpolation part way through.


But that's not all! Let's say you want to make something happen rhythmically, such as synchronising prompt strength to the beat of a song. Adding keyframe for each beat would be a pain the arse. Instead, you can use **oscillators**. Here, we enter `sin(0.5, 0, 50, 0.5)` to make prompt 2's weight oscillate along a sine wave with y offset 0.5 and 0 phase shift, with a period of 50 frames and an amplitude of 0.5: 

<img width="867" alt="image" src="https://user-images.githubusercontent.com/74455/196235204-6c778985-ec1a-42a5-8470-cd0631d87fe8.png">

You can experiment with other oscillators such as `tri` for a triangle wave, `sq` for a square wave, `saw` for a sawtooth wave and `pulse` for a pulsewave. See below for more information.

Parseq also supports simple expressions so you can combine oscillators and even mix them with the interpolation values, as well as if/else statements:

<img width="1066" alt="image" src="https://user-images.githubusercontent.com/74455/196236628-e9786d42-52fb-458a-b39c-3f173c43818f.png">


### Interpolation modifiers

**TODO: descriptions and examples.**

#### Values

| value  	|  description 	| example  	| example output 	|
|---	    |---	|---	|---	|
| `S`   	| Step interpolation: use the last keyframed value 	|<img width="166" alt="image" src="https://user-images.githubusercontent.com/74455/199902063-da5c054c-9572-4f63-aa26-1b6853b89ac9.png">| <img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/199902277-2009c100-08b1-487d-84d8-d0d5194df302.png"> |
| `L` 	  | (default) Linear interpolation betwen the last and next keyframed value |   	| |
| `C`  	| Cubic spline interpolation betwen the last and next keyframed value  	| <img width="194" alt="image" src="https://user-images.githubusercontent.com/74455/199900924-7e709a58-fa6d-44cb-babe-acb3fe5e351e.png"> | <img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/199901099-7ee4a56a-9b56-4ce0-b403-6099c2d1f5c3.png"> |
| `P`  	| Polinomial interpolation betwen the last and next keyframed value  	|   	| |
| `f`  	| Frame number  	|   	| |
| `prev_keyframe`  	| Previous keyframe number for this column 	|   	| |
| `next_keyframe`  	| Next keyframe number for this column 	|   	| |
| `prev_keyframe_value`  	| Previous keyframed value for this column 	|   	| |
| `next_keyframe_value`  	| Next keyframed value for this column 	|   	| |

#### Functions

All functions can be called either with unnamed args (e.g. `sin(10)`) or named args (e.g. `sin(period=10, amplitude=2)`). Most arguments have long and short names.

| function  	|  description 	| example  	|
|---	    |---	|---	|
| `sin()`   	| Sine wave oscillator 	|   	|
| `sq()` 	  | Square wave oscillator |   	|
| `tri()`  	| Triangle wave oscillator  	|   	|
| `saw()`  	| Sawtooth wave oscillator  	|   	|
| `pulse()`  	| Pulse wave oscillator  	|   	|
| `bez()`  	| Return a point on a Bezier curve between previous and next keyframe. Arguments are the same as https://cubic-bezier.com/ . If none specified, defaults to `bez(0.5,0,0.5,1)`  	|   	|
| `min()`  	| Return the minimum of 2 argument  	|   	|
| `max()`  	| Return the maximum of 2 argument  	|   	|
| `abs()`  	| Return the asolute value of the argument |   	|

#### Units

Units can be used to modify numbers representing frame ranges to match second of beat offsets calculated using the FPS and BPM values. This is particularly useful when specifying the period of an oscillator.

| unit  	|  description 	| example  	|
|---	    |---	|---	|
| `f`   	| (default) frames 	|   	|
| `s` 	  | seconds |   	|
| `b`  	| beats  	|   	|

#### Other operators and expressions:



| if expression  	|  description 	| example  	|
|---	    |---	|---	|
| `if <cond> <consequent> else <alt>`   	| 	|   	|

| operator  	|  description 	| example  	|
|---	    |---	|---	|
| `+`   	| 	|   	|
| `-` 	  | |   	|
| `*`  	|   	|   	|
| `/`  	|   	|   	|
| `%`  	|   	|   	|
| `!=`  	|   	|   	|
| `==`  	|   	|   	|
| `<`  	|   	|   	|
| `<=`  	|   	|   	|
| `>=`  	|   	|   	|
| `>`  	|   	|   	|
| `and`  	|   	|   	|
| `or`  	|   	|   	|


## Deforum integration features

TODO: list & describe keyframable parameters.
TODO: describe purpose of Delta values



## Parseq backend features 

Only relevant if you are not using Deforum. I recommend using Deforum. :)

### Input types: video & loopback 

* To process an input video, simply specify the path of the input video in the SD UI before hitting generate.
* To loopback over the input image loaded into SD's img2img UI, leave the input video field blank.
* You can approximate do txt2vid by pinning the denoise strength param to 1, which means input images will be ignored entirely. It's not really the same as txt2vid though (frames are not identical to what you'd get with txt2img).

### Keyframable parameters

You can control the value of the following SD parameters:

* Seed: you can even decimal seed values, which will translate to an adjacent subseed with subseed strength proportional to the decimal part.
* Prompt weights: you can specify up to 4 prompts, and control the weight of each one, allowing you to morph between them.
* Scale
* Denoising strength

Values specified in the main SD GUI for the above parameters will be ignored in favour of those submitted through Parseq.

### Keyframable image processing parameters

In addition to SD parameters, Parseq also allows you to control the following pre-processing steps on each input:

* Pan & Zoom
* pseudo-3d rotation (on x, y and z axes)
* Historical frame blending: choose how many previously generated frames should be blended into the input, and with what decay.

### Colour correction

You can specify color correction window size and slide rate as specified in https://github.com/rewbs/stable-diffusion-loopback-color-correction-script, and optionally force the input frame to always be included in the target histogram. Only recommended for loopback. Set window size to 0 for vid2vid (this is the default).

### Dry-run mode & parameter text overlay 

 Dump a video without applying Stable Diffusion. This is very valuable to debug and to confirm your param sequence is synchronised in the way you want. You can also overlay text to see the parameter values at each frame (see examples above for what that looks like )

### Processing pipeline

The script applies processing in the following order:
- Retrieve frame from video or from previous iteration if doing loopback.
- Resize the input frame to match the desired output.
- Blend in historical frames.
- Apply zoom, pan & 3d rotation.
- Apply color correction.
- Feed into SD.
- Save video frame and optionally the standalone image.

## Colab

Coming soon?

## Development

- To run the Parseq UI locally, `npm start`.
- To develop the python script independently of Stable Diffusion, take a look at `parseq_test.py`. 

## Credits

This script includes ideas and code sourced from many other scripts. Thanks in particular to the following sources of inspiration:

* Everyone behind Deforum: https://github.com/deforum-art/
* Filarus for their vid2vid script: https://github.com/Filarius/stable-diffusion-webui/blob/master/scripts/vid2vid.py .  
* Animator-Anon for their animation script: https://github.com/Animator-Anon/Animator/blob/main/animation.py . I picked up some good ideas from this.
* Yownas for their seed travelling script: https://github.com/yownas/seed_travel . sd-parsec can only travel between consecutive seeds so only offers a fraction of the possible seed variations that Yownas's script does.
* feffy380 for the prompt-morph script https://github.com/feffy380/prompt-morph
* eborboihuc for the clear implementation of 3d rotations using `cv2.warpPerspective()`:  https://github.com/eborboihuc/rotate_3d/blob/master/image_transformer.py

