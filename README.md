# Stable Diffusion Parseq

## What is this?

[Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool. (https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a web ui for that tool.

Parseq is a "parameter sequencer" for [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui). You can use it to generate videos with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, denoising strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

It is made of 2 components:

- A custom UI that allows you to sequence key frames and interpolation behaviour for all parameters, and which generates exact parameter values for all frames as a JSON blob.
- A plug-in script for [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) that accepts the JSON blob, and applies the settings and processing as expected.


## A note on the current state of this project

This project is in a pretty alpha state, thrown together over a couple of days. The UI is not polished and many error paths have not been tested. Also, the code is pretty horrible. You've been warned! :)

That said, I expect to improve things over time especially if this is valuable to others. Contributions and bug reports are very welcome of course.

## Examples

Here's a few examples of what you can do with this:

- Playing with prompt strength: Oscillating between a `cat` and a `dog` whilst becoming increasingly `spider`:

This example is effectively txt2img because the denoise ratio is set to 1, so the input image was ignored.



- Bouncy zooms & rotations with sudden prompt changes:

- Continuous zoom and pan on loopback



## Installation
- Have a working installation of 
- Copy `scripts/parseq_core.py` and `scripts/parseq_core.py` to the `/scripts` subdirectory in your SD webui installation.
- Install the necessary python dependencies 
- Restart the webui (or do a full reload from the setting screen)

If it is installed correctly, you should see `SD Parseq <version>` as a script available in the img2img section.


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

## Limitations & Caveats

- Note that the script deliberately overrides/ignores various settings that are defined outside of the script's parameters, including: seed, denoise strength, denoise strength scale factor, color correction, output path, etc... This is intentional but may be a source of confusion.
- Does not yet support batches. Only 1 output is ever generated per run. Batch size and batch count are ignored.
- ...

## Features

### Input types: video, loopback or txt2img

### Scriptable Stable Diffusion parameters

#### Seed travelling

#### Prompt morphing

### Scriptable image processing parameters

#### Pan, zoom, 3d rotaion

#### Historical frame blending

### Colour correction

### Interpolation language

### Test mode

## Processing pipeline

## Colab

Coming soon?

## Development

## Credits

Thanks to the following:

* 

