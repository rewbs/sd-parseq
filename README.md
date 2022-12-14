# Stable Diffusion Parseq

## What is this?

For context: 

* [Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool.
* [Deforum](https://github.com/deforum-art/deforum-stable-diffusion) is a notebook-based UI for Stable Diffusion that is geared towards creating videos.
* [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a Web UI for Stable Diffusion (but not for Deforum).
* The [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui) is an extention to the Automatic1111 Web UI that integrates the functionality of the Deforum notebook.

With all that defined, Parseq (this tool) is a _parameter sequencer_ for the [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui). You can use it to generate animations with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, noise, image strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

<img  width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205213244-b768437a-a260-4448-b8c1-3a832091241b.png">

You can jump straight into the UI here: https://sd-parseq.web.app/ . 

For now Parseq is fully front-end and stores all state in browser local storage (there is no backend).

## What's new?

* 🎉 You no longer need to use a branch of the A1111 Deforum extension. Parseq integration is now avialable in the official release. 🎉* 

### Version 0.1.0

* Parseq script mode is now deprecated, and Deforum integration mode is the default. I will no longer develop the Parseq script for a1111, focussing instead on making Parseq play well with the Deforum extension for a1111. The Parseq script was destined to only ever be an inferior version of the Deforum extension. If you need to work with the legacy parseq script variables, you can try here: https://sd-parseq.web.app/legacy .
* New document management, peristed to local storage, with options to revert, share & import. Keyframe data is no longer stored in the URL (this caused issues on some browsers). 
* New editable graph! You can add and update keyframes directly on the graph.


## Installation

- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Install the [Deforum extension](https://github.com/deforum-art/deforum-for-automatic1111-webui).
- Relaunch the Automatic1111 UI.
– You should now see a `Parseq` section right at the bottom for the `keyframes` tab under the `Deforum` extension (click to expand it):

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/200856608-d90762f4-b682-4b79-88ff-e8b3fa90813d.png">


### Alternative: Parseq Script installation (deprecated)

This is a legacy step: Deforum is by far a more powerful animation back-end. Use this approach if you don't want to use Deforum for some reason, and would prefer to use Parseq's own back-end integration with A1111. 

- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- [Install ffmpeg](https://ffmpeg.org/download.html)
- Ensure A1111 can resolve the python library `ffmpeg-python`:
   - On Windows: edit `requirements_versions.txt` in the top level directory of A111, and add the line: `ffmpeg-python==0.2.0`.
   - On Mac/Linux: edit `requirements.txt` in the top level directory of A111, and add the line: `ffmpeg-python`.   
- From this repository, copy `scripts/parseq_script.py` and `scripts/parseq_core.py` to the `/scripts` subdirectory in your SD webui installation.
- Restart the webui (or do a full Gradio reload from the settings screen). You should now see `SD Parseq <version>` as a script available in the img2img section.


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

* Go to https://sd-parseq.web.app/ (or run the UI yourself from this repo with `npm start`)
* Edit the table at the top to specify your keyframes and parameter values at those keyframes. See below for more information about what you can do here.
* Hit `Render` to generate the JSON config for every frame.
* Copy the contents of the textbox at the bottom

### Step 2: Generate the video

* Head to the SD web UI go to the Deforum tab and then the Keyframes tab.
* Paste the JSON you copied in step 1 into the Parseq section at the bottom of the page.
* Fiddle with any other Deforum / Stable Diffusion settings you want to tweak.
* Click generate.

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205213997-fc9bd7f2-2996-4475-9653-993055ad4cf1.png">


## UI Features

### Keyframed parameter values with scriptable interpolation

Parseq's main feature is advanced control over parameter values, using keyframing with interesting interpolation mechanisms.

The keyframe grid is the central UI concept in Parseq. Each row in the grid represents a keyframe. Each parameter has a pair of columns: the first takes an explicit value for that field, and the second takes an _interpolation formula_, which defines how the value will "travel" to the next keyframe's value. If no interpolation formula is specified on a given keyframe, the formula from the previous keyframe continues to be used. The default interpolation algorithm is linear interpolation.

Below the grid, a graph allows you to see the result of the interpolation (and edit keyframe values by dragging nodes):

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205216163-dd622849-a2ac-4991-8f74-7271c1ed5a5b.png">

The interpolation formula can be an arbitrarily complex mathematical expression, and can use a range of built-in functions and values, including oscillators and helpers to synchronise them to timestamps or beats:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205217130-74e8e5b0-f432-4dc7-a190-d6f0eacb3844.png">


### Beat and time sync'ing

Parseq allows you to specify Frames per second (FPS) and beats per minute (BPM) which are used to map frame numbers to time and beat offsets. For example, if you set FPS to 10 and BPM to 120, a tooltip when you hover over frame 40 (in the grid or the graph) will show that this frame will occur 4 seconds or 8 beats into the video.

Furthermore, your interpolation formulae can reference beats and seconds by using the `b` and `s` suffixes on numbers. For example, here we define a sine oscillator of a period of 1 beat (in green), and a pulse oscillator with a period of 5s and a pulse width of 0.5s (in grey):

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205224573-9f89518b-a4a8-4a71-86f9-388d0f65c2db.png">


### Interpolation modifiers

#### Values

| value  	|  description 	| examples  |
|---	      |---	            |---	      |
| `S`   	| Step interpolation: use the last keyframed value 	| <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225902-72d80405-855f-49ab-9d6b-38e940cf8332.png"> |
| `L` 	  | (default) Linear interpolation betwen the last and next keyframed value | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225983-72667c6b-3f15-4c19-b4b4-5567b9bc8022.png"> |
| `C`  	| Cubic spline interpolation betwen the last and next keyframed value  	| <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226043-13796fa8-8b76-4360-841c-a7f25835d224.png">|
| `P`  	| Polinomial interpolation betwen the last and next keyframed value. Very similar to Cubic spline. | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226091-09958f94-25fa-4646-944e-a3f07ad8d214.png"> |
| `f`  	| The frame number. Not very useful alone, but can be used to reference the overall video position in your interpolation algoritm. For example, add it to your seed value to increment the seed on every frame. |  <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226179-ff524dfa-aa40-4491-b4c1-2be56f7dda5a.png"> |
| `prev_keyframe`  	| Previous keyframe number for this column 	|    |
| `next_keyframe`  	| Next keyframe number for this column 	|  |
| `prev_keyframe_value`  	| Previous keyframed value for this column 	|  |
| `next_keyframe_value`  	| Next keyframed value for this column 	|   |

#### Functions

All functions can be called either with unnamed args (e.g. `sin(10,2)`) or named args (e.g. `sin(period=10, amplitude=2)`). Most arguments have long and short names (e.g. `sin(p=10, a=2)`).

In the examples below, note how the oscillators' amplitude is set to the linearly interpolated value of the field (`L`), from its initial value of `1` on frame 0, to value `0` on frame 120. This is why the amplitude of the oscillator decreases over time.

| function  	|  description 	| example  	|
|---	         |---	            |---        |
| `sin()`   	| Sine wave oscillator. See below for arguments (only period is required). 	| <img width="724" alt="image" src="https://user-images.githubusercontent.com/74455/205226860-26d6f424-db93-4b83-be69-5fa193a73d66.png"> |
| `sq()` 	  | Square wave oscillator | <img width="728" alt="image" src="https://user-images.githubusercontent.com/74455/205227751-b173dc97-f97d-44e2-a208-6e22a344b835.png"> | 
| `tri()`  	| Triangle wave oscillator.  	| <img width="722" alt="image" src="https://user-images.githubusercontent.com/74455/205227903-2c7ebdda-981c-4a78-9a82-7b75ef014499.png"> |
| `saw()`  	| Sawtooth wave oscillator.  	| <img width="722" alt="image" src="https://user-images.githubusercontent.com/74455/205227988-0c1e6fec-1a3d-438d-9f1a-a3cc685483bd.png"> |
| `pulse()`  	| Pulse wave oscillator.  	| <img width="727" alt="image" src="https://user-images.githubusercontent.com/74455/205228355-863dcf8d-3d10-4d63-9c5f-32ce75e7b8b3.png"> |
| `bez()`  	| Bezier curve between previous and next keyframe. Arguments are the same as https://cubic-bezier.com/ . If none specified, defaults to `bez(0.5,0,0.5,1)`  	| <img width="724" alt="image" src="https://user-images.githubusercontent.com/74455/205228620-8db81d38-2010-4059-99bc-ed84ec80ffa9.png"> |
| `min()`  	| Return the minimum of 2 argument  	|   	|
| `max()`  	| Return the maximum of 2 argument  	|   	|
| `abs()`  	| Return the asolute value of the argument |   	|
| `round()`  	| Return the rounded value of the argument |   	|

Oscillator arguments: 
* Period `p` *required*:  The period of the oscillation. By default the unit is frames, but you can specify seconds or beats by appending the appropriate suffix (e.g. `sin(p=4b)` or `sin(p=5s)`).
* Amplitude `a` (default: `1`): The amplitude of the oscillation. `sin(p=4b, a=2)` is equivalent to `sin(p=4b)*2`.
* Phase shift `ps` (default: `0`): The x-axis offset of the oscillation.
* Centre `c` (default: `0`): The y-axis offset of the oscillation. `sin(p=4b, c=2)` is equivalent to `sin(p=4b)+2`
* Pulse width `pw` (default: `5`): *pulse() function only* The pulse width. 


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
| `if <cond> <consequent> else <alt>` | if `cond` evaluates to any value other than 0, return `consequent`, else return `alt`. `cond`, `consequent` and `alt` are all arbitrary expressions. | Use a square wave which alternates between 1 and -1 with a period of 10 frames to alternatively render the step and cubic spline interpolations: <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205402345-88cfea53-382e-463d-a3a4-38d4b332f5f3.png"> |

| operator  	|  description 	| example  	|
|---	   |---	|---	|
| `<expr1> + <expr2>`   	| Add two expressions. 	| Make the seed increase by 0.25 on every frame (Parseq uses fractional seeds to infuence the subseed strength): <img width="800" alt="image" src="https://user-images.githubusercontent.com/74455/205402606-9d9ede7e-f763-4bb4-ab5a-993dbc65d29e.png"> |
| `<expr1> - <expr2>` 	| Subtract two expressions |   	|
| `<expr1> * <expr2>`  	| Multiply two expressions |   	|
| `<expr1> / <expr2>`  	| Divide two expressions  	|   	|
| `<expr1> % <expr2>`  	| Modulus  |  Reset the seed every 4 beats: <img width="802" alt="image" src="https://user-images.githubusercontent.com/74455/205402901-52f78382-b36a-403a-a6d9-6277af0c758f.png"> |
| `<expr1> != <expr2>`  	| 1 if expressions are not equal, 0 otherwise.       	      |   	|
| `<expr1> == <expr2>`  	| 1 if expressions are equal, 0 otherwise.   	            |   	|
| `<expr1> < <expr2>`  	   | 1 if <expr1> less than <expr2>, 0 otherwise.   	         |   	|
| `<expr1> <= <expr2>`  	| 1 if <expr1> less than or equals <expr2>, 0 otherwise.    |    	|
| `<expr1> >= <expr2>`  	| 1 if <expr1> greater than <expr2>, 0 otherwise.  	      |   	|
| `<expr1> < <expr2>`  	   | 1 if <expr1> greater than or equals <expr2>, 0 otherwise. |   	|
| `<expr1> and <expr2>`  	| 1 if <expr1> and <expr2> are non-zero, 0 otherwise.  	   |   	|
| `<expr1> or <expr2>`  	| 1 if <expr1> or <expr2> are non-zero, 0 otherwise.  	   |   	|


## Deforum integration features

Parseq can be used with all Deforum animation modes.

### Keyframable parameters

Here are the parameters that Parseq controls. Any values you set in the A1111 UI for Deforum will be overridden.
   
Stable diffusion generation parameters:

* seed
* scale
* noise: additional noise to add during generation, can help
* strength: how much the last generated image should influence the current generation

2D animation parameters :

* angle (ignored in 3D animation mode, use rotation 3D z axis)
* zoom (ignored in 3D animation mode, use rotation translation z)
* translation x axis
* translation y axis
   
Pseudo-3D animation parameters (ignored in 3D animation mode):
   
* perspective theta angle
* perspective phi angle
* perspective gamma angle
* perspective field of view

3D animation parameters (all ignored in 2D animation mode):   

* translation z axis
* rotation 3d x axis
* rotation_3d y axis
* rotation_3d z axis
* field of view
* near point
* far point

Other parameters:
   
* contrast: factor by which to adjust the previous last generated image's contrast before feeding to the current generation. 1 is no change, <1 lowers contrast, >1 increases contract.   
   
### Prompt interpolation

Parseq provides a further 8 keyframable parameters (`prompt_weight_1` to 'prompt_weight_8') that you can reference in your prompts, and can therefore be used as prompts weights. For example, here's a positive prompt that uses Composable Diffusion to interpolate between faces:
```
Jennifer Aniston, centered, high detail studio photo portrait :${prompt_weight_1} AND
Brad Pitt, centered, high detail studio photo portrait :${prompt_weight_2} AND
Ben Affleck, centered, high detail studio photo portrait :${prompt_weight_3} AND
Gwyneth Paltrow, centered, high detail studio photo portrait :${prompt_weight_4} AND
Zac Efron, centered, high detail :${prompt_weight_5} AND
Clint Eastwood, centered, high detail studio photo portrait :${prompt_weight_6} AND
Jennifer Lawrence, centered, high detail studio photo portrait :${prompt_weight_7} AND
Jude Law, centered, high detail studio photo portrait :${prompt_weight_8}
```

A corresponding parameter flow could look like this:
<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205405460-2f9ed10c-0df4-4e4e-8c4f-d68c1c6ceccf.png">
   
### Subseed control for seed travelling

For a great description of seed travelling, see [Yownas' script](https://github.com/yownas/seed_travel). In summary, you can interpolate between the latent noise generated by 2 seeds by setting the first as the (main) seed, the second as the subseed, and fluctuating the subseed strength. A subseed strength of 0 will just use the main seed, and 1 will just use the subseed as the seed. Any value in between will interpolate between the two noise patterns using spherical linear interpolation (SLERP).
   
Parseq does not currently expose the subseed and subseed strength parameters explicitly. Instead, it takes fractional seed values and uses them to control the subseed and subseed strength values. For example, if on a given frame your seed value is `10.5`, Parseq will send `10` as the seed, `11` as the subseed, and `0.5` as the subseed strength.
   
The downside is you can only interpolate between adjacent seeds. The benefit is seed travelling is very intuitive. If you'd like to have full control over the subseed and subseed strength, feel free to raise a feature request!

Note that the results of seed travelling are best seen with no input image (Interpolation animation mode) or with a very low strength. Else, the low input variations will likely result in artifacts / deep-frying.
   
Otherwise it's best to change the seed by at least 1 on each frame (you can also experiment with seed oscillation, for less variation).


### Delta values

**Parseq aims to let you set absolute values for all parameters.**   So if you want to progressively rotate 180 degrees over 4 frames, you specify the following values for each frame: 45, 90, 135, 180.

However, because Stable Diffusion animations are made by feeding the last generated frame into the current generation step, **some** animation parameters become relative if there is enough loopback strength. So if you want to rotate 180 degrees over 4 frames, the animation engine expects the values 45, 45, 45, 45.

This is not the case for all parameters: for example, the seed value and field-of-view settings have no dependency on prior frames, so the animation engine expects absolute values.
   
To reconcile this, Parseq supplies _delta values_ to Deforum for certain parameters. This is enabled by default, but you can toggle if off in the A111 Deforum extension UI if you want to see the difference.
   
For most parameters the delta value for a given field is simply the difference between the current and previous frame's value for that field. However, a few parameters such as 2D zoom (which is actually a scale factor) are multiplicative, so the delta is the ratio between the previous and current value.


## Development

Parseq is currently a front-end only React app. It is part way through a conversion from Javascript to Typescript. There is currently no back-end: persistence is entirely in browser indexdb storage via [Dexie.js](https://dexie.org/). You'll need `node` and `npm` on your system before you get started.

There is a severe lack of tests, which I will remedy one day. :)

If you want to dive in:
   - Run `npm install` to pull dependencies.
   - Run `npm start` to run the Parseq UI locally in dev mode on port 3000. You can now access the UI on `localhost:3000`. Code changes should be hot-reloaded.

Hosting & deployment is done using Firebase. There's no automated deployment pipeline at the moment.
   
## Credits

This script includes ideas and code sourced from many other scripts. Thanks in particular to the following sources of inspiration:

* Everyone behind Deforum: https://github.com/deforum-art/
* Filarus for their vid2vid script: https://github.com/Filarius/stable-diffusion-webui/blob/master/scripts/vid2vid.py .  
* Animator-Anon for their animation script: https://github.com/Animator-Anon/Animator/blob/main/animation.py . I picked up some good ideas from this.
* Yownas for their seed travelling script: https://github.com/yownas/seed_travel . sd-parsec can only travel between consecutive seeds so only offers a fraction of the possible seed variations that Yownas's script does.
* feffy380 for the prompt-morph script https://github.com/feffy380/prompt-morph
* eborboihuc for the clear implementation of 3d rotations using `cv2.warpPerspective()`:  https://github.com/eborboihuc/rotate_3d/blob/master/image_transformer.py
