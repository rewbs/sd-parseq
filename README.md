# Stable Diffusion Parseq

## What is this?

For context: [Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool and [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a web ui for that tool.

Parseq is a "parameter sequencer" for [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui). You can use it to generate videos with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, denoising strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

<img width="720" alt="Parseq_-_parameter_sequencer_for_Stable_Diffusion" src="https://user-images.githubusercontent.com/74455/196206868-d463a083-8069-41fe-ac8f-cfc1fd3df463.png">

It is made of 2 components:

- A custom UI that allows you to sequence key frames and interpolation behaviour for all parameters, and which generates exact parameter values for all frames as a JSON blob. A version of this UI is hosted here: https://sd-parseq.web.app/.
- A plug-in script for [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) that accepts the JSON blob, and applies the settings and processing as expected.


## Current state of the project

This project is in a pretty alpha state, thrown together over a couple of days. The UI is not polished and many error paths have not been tested. The code is pretty horrible.

That said, I expect to improve things over time especially if this is valuable to others. Contributions and bug reports are very welcome of course.

## Examples (TODO: get some better examples - ones where things don't keep going off-centre)

Here are some examples of what you can do with this. Most of these were generated at 20fps then smoothed to 60fps with ffmpeg minterpolate.

- Complex vid2vid example with fluctuations on many different params to attempt to synchronise param changes and image movement to music. The input audio is an excerpt of [The Prodigy - Smack My Bitch Up (Noisia Remix)](https://www.youtube.com/watch?v=r5OgQCvqbYA), and the original input video was generated with [Butterchurn](https://butterchurnviz.com/).

https://user-images.githubusercontent.com/74455/196309008-1d3f3a23-123c-4108-b673-3693f9935f57.mp4

Here you can see a side-by-side comparison of the original input video, the "dry run" video (which includes all pre-processing but no Stable Diffusion), and the final output:

https://user-images.githubusercontent.com/74455/196308963-68f503f8-1d76-4954-93e0-b00361fd16a1.mp4

Here's what the param sequence looks like ([you can play with it directly here](https://sd-parseq.web.app/?parsec=%7B%22prompts%22%3A%5B%7B%22positive%22%3A%22Realistic+human+eyes%2C+intense+colors%2C+organic%2C+surreal%2C+bright%2C+dense%2C+amazing+high+definition+4k+beautiful+detail%2C+award+winning.%22%2C%22negative%22%3A%22empty%2C+boring%2C+blank+space%2C+black%2C+dark%22%7D%2C%7B%22positive%22%3A%22Realistic+snakes%2C+intense+colors%2C+organic%2C+surreal%2C+bright%2C+dense%2C+amazing+high+definition+4k+beautiful+detail%2C+award+winning.%22%2C%22negative%22%3A%22empty%2C+boring%2C+blank+space%2C+black%2C+dark%22%7D%2C%7B%22positive%22%3A%22Realistic+tongues%2C+intense+colors%2C+organic%2C+surreal%2C+bright%2C+dense%2C+amazing+high+definition+4k+beautiful+detail%2C+award+winning.%22%2C%22negative%22%3A%22empty%2C+boring%2C+blank+space%2C+black%2C+dark%22%7D%2C%7B%22positive%22%3A%22Terrifying+aliens%2C+attacking%2C+angry%2C+violent%2C+industrial%2C+amazing+high+definition+4k+beautiful+detail%2C+award+winning.%22%2C%22negative%22%3A%22empty%2C+boring%2C+blank+space%2C+black%2C+dark%22%7D%5D%2C%22options%22%3A%7B%22input_fps%22%3A%22%22%2C%22output_fps%22%3A%22%22%2C%22cc_window_width%22%3A%2200%22%2C%22cc_window_slide_rate%22%3A%221%22%2C%22cc_use_input%22%3Afalse%7D%2C%22keyframes%22%3A%5B%7B%22frame%22%3A0%2C%22seed%22%3A68400%2C%22scale%22%3A13%2C%22denoise%22%3A0.5%2C%22rotx%22%3A0%2C%22roty%22%3A0%2C%22rotz%22%3A0%2C%22panx%22%3A0%2C%22pany%22%3A0%2C%22zoom%22%3A1%2C%22loopback_frames%22%3A3%2C%22loopback_decay%22%3A0.3%2C%22prompt_1_weight%22%3A1%2C%22prompt_2_weight%22%3A0%2C%22prompt_3_weight%22%3A0%2C%22prompt_4_weight%22%3A0%2C%22zoom_i%22%3A%22sin%28125%2C12.857%2C51.428%2C250%29%22%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22prompt_1_weight_i%22%3A%22L%22%2C%22prompt_2_weight_i%22%3A%22L%22%2C%22prompt_3_weight_i%22%3A%22L%22%2C%22prompt_4_weight_i%22%3A%22S%22%2C%22denoise_i%22%3A%22L%2Btri%280%2C-26%2C103%2C0.2%29%22%2C%22loopback_decay_i%22%3A%22S%22%2C%22loopback_frames_i%22%3A%22S%22%7D%2C%7B%22frame%22%3A26%2C%22rotx_i%22%3A%22L%22%2C%22prompt_3_weight%22%3A%22%22%7D%2C%7B%22frame%22%3A51%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A77%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A103%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22zoom_i%22%3A%22L%22%2C%22zoom%22%3A250%7D%2C%7B%22frame%22%3A129%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A154%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22zoom_i%22%3Anull%7D%2C%7B%22frame%22%3A180%2C%22panx_i%22%3A%22L%22%2C%22zoom%22%3A-300%7D%2C%7B%22frame%22%3A206%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22prompt_1_weight%22%3A1%2C%22prompt_2_weight%22%3A0.01%2C%22zoom_i%22%3A%22sin%28125%2C12.857%2C51.428%2C250%29%22%2C%22zoom%22%3A250%7D%2C%7B%22frame%22%3A231%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A257%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A283%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A309%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22prompt_1_weight%22%3A0.01%2C%22prompt_2_weight%22%3A1%2C%22loopback_decay%22%3A0.6%7D%2C%7B%22frame%22%3A334%2C%22rotx_i%22%3A%22L%22%2C%22loopback_decay%22%3A0.3%7D%2C%7B%22frame%22%3A360%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A386%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A411%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22roty%22%3A0%7D%2C%7B%22frame%22%3A437%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A463%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A489%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A514%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22prompt_2_weight%22%3A1%2C%22prompt_3_weight%22%3A0.01%2C%22roty%22%3A0%7D%2C%7B%22frame%22%3A540%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A566%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A591%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A617%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22prompt_2_weight%22%3A0.01%2C%22prompt_3_weight%22%3A1%7D%2C%7B%22frame%22%3A643%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A669%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A694%2C%22panx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A720%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22zoom%22%3A1%2C%22zoom_i%22%3A%22S%22%2C%22rotz%22%3A1%2C%22prompt_4_weight_i%22%3A%22sq%280.5%2C0%2C34.2%2C0.5%29%22%2C%22prompt_2_weight_i%22%3Anull%2C%22prompt_3_weight_i%22%3Anull%2C%22roty%22%3A0%2C%22loopback_decay%22%3A0.6%2C%22loopback_decay_i%22%3A%22P%22%2C%22denoise%22%3A0.5%2C%22denoise_i%22%3A%22%22%7D%2C%7B%22frame%22%3A733%2C%22zoom%22%3A75%2C%22prompt_2_weight_i%22%3Anull%2C%22prompt_3_weight_i%22%3Anull%2C%22loopback_decay%22%3A%22%22%2C%22denoise_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A746%2C%22zoom%22%3A150%2C%22prompt_3_weight_i%22%3Anull%2C%22prompt_2_weight_i%22%3Anull%2C%22loopback_decay%22%3A%22%22%2C%22denoise%22%3A0.8%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A759%2C%22zoom%22%3A225%2C%22prompt_2_weight_i%22%3Anull%2C%22prompt_3_weight_i%22%3Anull%2C%22loopback_decay%22%3A%22%22%7D%2C%7B%22frame%22%3A771%2C%22zoom%22%3A300%2C%22prompt_2_weight_i%22%3Anull%2C%22prompt_3_weight_i%22%3Anull%2C%22loopback_decay%22%3A%22%22%2C%22loopback_decay_i%22%3Anull%2C%22panx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%7D%2C%7B%22frame%22%3A784%2C%22zoom%22%3A375%2C%22prompt_2_weight_i%22%3Anull%2C%22prompt_3_weight_i%22%3Anull%2C%22loopback_decay%22%3A%22%22%2C%22loopback_decay_i%22%3Anull%7D%2C%7B%22frame%22%3A797%2C%22rotx_i%22%3A%22L%22%2C%22zoom%22%3A450%2C%22zoom_i%22%3A%22L%22%2C%22loopback_decay%22%3A0.3%2C%22loopback_decay_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A810%2C%22panx_i%22%3A%22L%22%2C%22denoise%22%3A0.8%2C%22denoise_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A823%2C%22rotx_i%22%3A%22tri%280%2C0%2C6.4285%2C70%29%22%2C%22zoom%22%3A0%2C%22zoom_i%22%3A%22L%22%2C%22rotz%22%3A360%2C%22panx%22%3A0%2C%22loopback_frames%22%3A10%2C%22denoise%22%3A0.5%2C%22denoise_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A836%2C%22rotx_i%22%3A%22L%22%7D%2C%7B%22frame%22%3A874%7D%2C%7B%22frame%22%3A891%2C%22seed%22%3A68500%2C%22scale%22%3A13%2C%22denoise%22%3A0.5%2C%22rotx%22%3A0%2C%22roty%22%3A0%2C%22rotz%22%3A360%2C%22panx%22%3A0%2C%22pany%22%3A0%2C%22zoom%22%3A0%2C%22loopback_frames%22%3A10%2C%22loopback_decay%22%3A0.5%2C%22prompt_1_weight%22%3A0%2C%22prompt_2_weight%22%3A1%2C%22prompt_3_weight%22%3A0%2C%22prompt_4_weight%22%3A0%7D%5D%7D)

<img width="1045" alt="image" src="https://user-images.githubusercontent.com/74455/196308592-7ace3911-6ff9-4183-aa15-03ad5d8c8226.png">


- Playing with prompt strength by oscillating between a `cat` and a `dog` whilst becoming increasingly `spider`-y. This example is effectively txt2img because the denoise ratio is set to 1, so the input image was ignored. 

https://user-images.githubusercontent.com/74455/196248930-4d5c88b8-04da-4e76-a17e-acf5185556ec.mp4

- Here's a loopback video where we oscillate between a few famous faces with a zoom and occasional denoising spikes to reset the context.

https://user-images.githubusercontent.com/74455/196251751-cd0f3333-d3b5-4296-8d0b-2ccc785d1105.mp4

Here's what the param sequence looks like ([you can play with it directly here](https://sd-parseq.web.app/?parsec=%7B%22prompts%22%3A%5B%7B%22positive%22%3A%22Elon+Musk%2C+centered%2C+ecstatic%2C+laughing%2C+colorful%2C+cinematic+lighting+award+winning+studio+photo+portrait+by+Annie+Leibovitz.%22%2C%22negative%22%3A%22%22%7D%2C%7B%22positive%22%3A%22Jack+Nicholson%2C+centered%2C+snarling%2C+angry%2C+old%2C+colorful%2C+cinematic+lighting+award+winning+studio+photo+portrait+by+Annie+Leibovitz.%22%2C%22negative%22%3A%22%22%7D%2C%7B%22positive%22%3A%22Jennifer+Lawrence%2C+centered%2C+confused%2C+cinematic+lighting+award+winning+studio+photo+portrait+by+Annie+Leibovitz.%22%2C%22negative%22%3A%22%22%7D%2C%7B%22positive%22%3A%22Kanye+West%2C+serious%2C+thinking%2C+centered%2C+cinematic+lighting+award+winning+studio+photo+portrait+by+Annie+Leibovitz.%22%2C%22negative%22%3A%22%22%7D%5D%2C%22options%22%3A%7B%22input_fps%22%3A%22%22%2C%22output_fps%22%3A%22%22%2C%22cc_window_width%22%3A%225%22%2C%22cc_window_slide_rate%22%3A%220.2%22%2C%22cc_use_input%22%3Afalse%7D%2C%22keyframes%22%3A%5B%7B%22frame%22%3A0%2C%22seed%22%3A50%2C%22scale%22%3A12%2C%22denoise%22%3A0.25%2C%22rotx%22%3A0%2C%22roty%22%3A0%2C%22rotz%22%3A0%2C%22panx%22%3A0%2C%22pany%22%3A0%2C%22zoom%22%3A5%2C%22loopback_frames%22%3A1%2C%22loopback_decay%22%3A0.1%2C%22prompt_1_weight%22%3A1%2C%22prompt_2_weight%22%3A0%2C%22prompt_3_weight%22%3A0%2C%22prompt_4_weight%22%3A0%2C%22prompt_2_weight_i%22%3A%22sin%280.5%2C12.5%2C50%2C0.5%29%22%2C%22prompt_3_weight_i%22%3A%22sin%280.5%2C25%2C50%2C0.5%29%22%2C%22prompt_1_weight_i%22%3A%22sin%280.5%2C0%2C50%2C0.5%29%22%2C%22prompt_4_weight_i%22%3A%22sin%280.5%2C37.5%2C50%2C0.5%29%22%7D%2C%7B%22frame%22%3A20%2C%22denoise%22%3A0.4%7D%2C%7B%22frame%22%3A25%2C%22denoise%22%3A0.8%2C%22denoise_i%22%3Anull%7D%2C%7B%22frame%22%3A26%2C%22denoise%22%3A0.25%2C%22denoise_i%22%3A%22%22%7D%2C%7B%22frame%22%3A45%2C%22denoise%22%3A0.4%7D%2C%7B%22frame%22%3A50%2C%22denoise%22%3A0.8%7D%2C%7B%22frame%22%3A51%2C%22denoise%22%3A0.25%7D%2C%7B%22frame%22%3A70%2C%22denoise%22%3A0.4%7D%2C%7B%22frame%22%3A75%2C%22denoise%22%3A0.8%7D%2C%7B%22frame%22%3A76%2C%22denoise%22%3A0.25%7D%2C%7B%22frame%22%3A100%2C%22seed%22%3A150%2C%22scale%22%3A12%2C%22denoise%22%3A0.4%2C%22rotx%22%3A0%2C%22roty%22%3A0%2C%22rotz%22%3A0%2C%22panx%22%3A0%2C%22pany%22%3A0%2C%22zoom%22%3A50%2C%22loopback_frames%22%3A1%2C%22loopback_decay%22%3A0.1%2C%22prompt_1_weight%22%3A0%2C%22prompt_2_weight%22%3A1%2C%22prompt_3_weight%22%3A0%2C%22prompt_4_weight%22%3A0%7D%5D%7D) ):
<img width="1887" alt="image" src="https://user-images.githubusercontent.com/74455/196251021-8251f6d9-a4e7-4cab-ad47-f2e6f0587836.png">



## Installation
- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Copy `scripts/parseq_core.py` and `scripts/parseq_core.py` to the `/scripts` subdirectory in your SD webui installation.
- Install the necessary python dependencies incluing `ffmpeg-python` (TODO: figure out and add full list).
- Restart the webui (or do a full Gradio reload from the settings screen)

If it is installed correctly, you should see `SD Parseq <version>` as a script available in the img2img section:

<img width="565" alt="image" src="https://user-images.githubusercontent.com/74455/196208333-da171e3e-65a4-4afa-b3bb-9677fd5dae16.png">


## Usage

### Step 1: Create your parameter script

* Go to https://sd-parseq.web.app/ (or run the UI yourself from this repo with `npm start`)
* Edit the table at the top to specify your keyframes and parameter values at those keyframes. See below for more information about what you can do here.
* Hit `Render` to generate the JSON config for every frame.
* Copy the contents of the textbox at the bottom

### Step 2: Run the script

* Head to the SD web UI, go to the img2img tab and select the SD Parseq script.
* Paste in the JSON blob you copied in step 1
* Set your input path (if doing vid2vid – leave blank for loopback) and output video path.
* Click generate

<img width="1911" alt="image" src="https://user-images.githubusercontent.com/74455/196210360-7f2f6879-52d5-4537-86a0-71faafd515b9.png">

## Limitations & Caveats

- Note that the script deliberately overrides/ignores various settings that are defined outside of the script's parameters, including: seed, denoise strength, denoise strength scale factor, color correction, output path, etc... This is intentional but may be a source of confusion.
- Does not yet support batches. Only 1 output is ever generated per run. Batch size and batch count are ignored.
- Does not yet add noise in the blank areas created when zooming out or rotating.
- The interpolation language supports simple expressions but does not yet understand operator precedence or parens.
- UI can get sluggish with 1000s of frames. Lots of room for optimisation.
- Chokes on .mov inputs because of a failure to get the total frame count. Seems to work with mp4 (so you just need to preprocess with ffmpeg).
- Rotation and zoom params have a very different impact on loopback. For example, if you linearly interpolate z-rotation from 0 to 360 over 36 frames, with vid2vid you'll get a single full rotation (10deg per frame), whereas with loopback you'll get an accelarating rotation because each looped-back input frame is already rotated.
- A seed value of -1 will be re-evaluated as a random value on every frame. If you want a fixed random seed on all frames, pick a number and lock it in over all your frames in Parseq.

## Features

### Input types: video, loopback or txt2img

* To process an input video, simply specify the path of the input video in the SD UI before hitting generate.
* To loopback over the input image loaded into SD's img2img UI, leave the input video field blank.
* You can effectively do txt2img2vid by pinning the denoise strength param to 1, which means input images will be ignored entirely.

### Scriptable / keyframable parameter values

Parseq's main feature is advanced control over parameter values, with interesting interpolation features.

This all happens in the grid. Start by selecting the values you want to work with in the "fields to display" drop-down on the right. In this example, we'll use `denoise`, `prompt_1_weight`, and `prompt_2_weight`:

<img width="1069" alt="image" src="https://user-images.githubusercontent.com/74455/196230780-83681a78-cb70-4553-8f02-5e11b85efc5d.png">

Next we'll set the number of frames we want to work with by setting the frame number of the last row. We'll set it to 101 frames. You can always change this later. Tip: if you want to match a frame count from an input video, you can count the video's frames quickly from the CLI with ffmpeg's `ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -print_format csv <input_video.mp4>`.

<img width="1045" alt="image" src="https://user-images.githubusercontent.com/74455/196231818-3396eb25-d0f4-4e21-864a-464158d46f9f.png">

Now we'll add some keyframes. We'll set them at frames 25, 50 and 75. We can always change them later or add more.

<img width="858" alt="image" src="https://user-images.githubusercontent.com/74455/196232289-217093de-2bfa-4322-b218-73668af30074.png">

(Note that the first and last frames MUST have values for all fields. Rendering will fail if you remove any because start and end values are required for interpolation.)

In this video, we'd like prompt 1 to start off weak, become strong in the middle of the video, and then become weak again. Easy! Put in some values for prompt_1_weight and hit render. You'll see it interpolates linearly by default, and if a value is empty in a keyframe we interpolate straight through it.

<img width="858" alt="image" src="https://user-images.githubusercontent.com/74455/196232646-171e2755-48f9-454b-bb80-db5462e55ea4.png">

Now you might be wondering what the arrow (➟) columns are next to the value columns. These are the interpolation columns, and they let you specify how the value should "travel" from this point onwards. The default is linear interpolation, but you override this with `S` for Step and `P` for Polinomial. Let's give it a go:

<img width="1063" alt="image" src="https://user-images.githubusercontent.com/74455/196233767-bf10dfdf-78ed-4d1f-8974-1b99d12de49d.png">

<img width="1063" alt="image" src="https://user-images.githubusercontent.com/74455/196233894-16560a04-2fce-4e41-a8c9-501db44394cf.png">

You can also switch interpolation part way through:

<img width="1063" alt="image" src="https://user-images.githubusercontent.com/74455/196234083-d6bea98e-9d0a-4e54-a2d2-baf698100962.png">

But that's not all! Let's say you want to make something happen rhythmically, such as synchronising prompt strength to the beat of a song. Adding keyframe for each beat would be a pain the arse. Instead, you can use **oscillators**. Here, we enter `sin(0.5, 0, 50, 0.5)` to make prompt 2's weight oscillate along a sine wave with y offset 0.5 and 0 phase shift, with a period of 50 frames and an amplitude of 0.5: 

<img width="867" alt="image" src="https://user-images.githubusercontent.com/74455/196235204-6c778985-ec1a-42a5-8470-cd0631d87fe8.png">

You can experiment with other oscillators such as `tri` for a triangle wave, `sq` for a square wave and `saw` for a sawtooth wave. The arguments are always the same: `(yoffset, phaseShift, periodFrames, amplitude)`. 

Parseq also supports simple expressions so you can combine oscillators and even mix them with the linear/step/poly interpolation values:

<img width="1066" alt="image" src="https://user-images.githubusercontent.com/74455/196236628-e9786d42-52fb-458a-b39c-3f173c43818f.png">

A pulse wave can be obtained by subtracting phase shifted sawtooth waves.


#### Keyframable parameters

You can control the value of the following SD parameters:

* Seed: you can even decimal seed values, which will translate to an adjacent subseed with subseed strength proportional to the decimal part.
* Prompt weights: you can specify up to 4 prompts, and control the weight of each one, allowing you to morph between them.
* Scale
* Denoising strength

Values specified in the main SD GUI for the above parameters will be ignored in favour of those submitted through Parseq.

### Scriptable image processing parameters

In addition to SD parameters, Parseq also allows you to control the following pre-processing steps on each input:

* Pan & Zoom
* 3d rotation (on x, y and z axes)
* Historical frame blending: choose how many previously generated frames should be blended into the input, and with what decay.

### Colour correction

You can specify color correction window size and slide rate as specified in https://github.com/rewbs/stable-diffusion-loopback-color-correction-script, and optionally force the input frame to always be included in the target histogram. Only recommended for loopback. Set window size to 0 for vid2vid (this is the default).

### Dry-run mode

This isn't yet integrated into the UI, but take a look at `parseq_test.py` to see how to apply all processing steps to the input video without invoking SD. This is very valuable to debug and to confirm your param sequence is synchronised in the way you want.

## Processing pipeline

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

This script includes ideas sourced from many other scripts. Thanks in particular to the following sources of inspiration:

* Filarus for their vid2vid script: https://github.com/Filarius/stable-diffusion-webui/blob/master/scripts/vid2vid.py .  
* Animator-Anon for their animation script: https://github.com/Animator-Anon/Animator/blob/main/animation.py . I picked up some good ideas from this.
* Yownas for their seed travelling script: https://github.com/yownas/seed_travel . sd-parsec can only travel between consecutive seeds so only offers a fraction of the possible seed variations that Yownas's script does.
* feffy380 for the prompt-morph script https://github.com/feffy380/prompt-morph
* eborboihuc for the clear implementation of 3d rotations using `cv2.warpPerspective()`:  https://github.com/eborboihuc/rotate_3d/blob/master/image_transformer.py

