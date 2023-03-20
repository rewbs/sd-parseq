![example workflow](https://github.com/rewbs/sd-parseq/actions/workflows/firebase-hosting-merge.yml/badge.svg)

# Stable Diffusion Parseq

  * [What is this?](#what-is-this)
  * [What's new?](#what-s-new)
    + [Version 0.1.45](#version-0145) 
    + [Version 0.1.40](#version-0140)
    + [Version 0.1.22](#version-0122)
    + [Version 0.1.14](#version-0114)
    + [Version 0.1.0](#version-010)
  * [Installation](#installation)
  * [Examples](#examples)
  * [Usage](#usage)
    + [Step 1: Create your parameter manifest](#step-1-create-your-parameter-manifest)
    + [Step 2: Generate the video](#step-2-generate-the-video)
  * [Features](#features)
    + [Keyframed parameter values with scriptable interpolation](#keyframed-parameter-values-with-scriptable-interpolation)
    + [Beat and time sync'ing](#beat-and-time-syncing)
    + [Interpolation modifiers](#interpolation-modifiers)
      - [Values](#values)
      - [Functions](#functions)
      - [Units](#units)
      - [Other operators and expressions](#other-operators-and-expressions)
    + [Audio analyser for automatic keyframe creation from audio data](#audio-analyser-for-automatic-keyframe-creation-from-audio-data)
      - [Audio analyer general info (read this first)](#audio-analyer-general-info-read-this-first)
      - [Using the Audio analyser](#using-the-audio-analyser)
        * [Audio Analysis](#audio-analysis)
        * [Visualisation & playback](#visualisation--playback)
        * [Conversion to Parseq keyframes](#conversion-to-parseq-keyframes)
  * [Deforum integration features](#deforum-integration-features)
    + [Keyframable parameters](#keyframable-parameters)
    + [Prompt interpolation](#prompt-interpolation)
    + [Subseed control for seed travelling](#subseed-control-for-seed-travelling)
    + [Delta values (aka absolute vs relative motion parameters)](#delta-values-aka-absolute-vs-relative-motion-parameters)
  * [Development](#development)
    + [Deployment](#deployment)
  * [Credits](#credits)


## What is this?

For context:

* [Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool.
* [Deforum](https://github.com/deforum-art/deforum-stable-diffusion) is a notebook-based UI for Stable Diffusion that is geared towards creating videos.
* [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a Web UI for Stable Diffusion (but not for Deforum).
* The [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui) is an extention to the Automatic1111 Web UI that integrates the functionality of the Deforum notebook.

Parseq (this tool) is a _parameter sequencer_ for the [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui). You can use it to generate animations with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, noise, image strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

<img width="500"  src="https://www.evernote.com/shard/s246/sh/6601a99d-4078-4589-a26c-22c02fa07ac7/u3TayR3OPMjXkDIYphPO-FhUpBZRM5FXqqyBaHB87cT4GJtuk6532rEHzQ/deep/0/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

You can jump straight into the UI here: https://sd-parseq.web.app/ . 

For now Parseq is almost entirely front-end and stores all state in browser local storage by default. Signed-in users can optionally upload their work from the UI for easier sharing.

## What's new?

### Version 0.1.45

* You can now mix & match Parseq-managed schedules with Deforum-managed schedules, and choose whether the prompt should be managed by Parseq or Deforum.

<img width="500"  src="https://user-images.githubusercontent.com/74455/222583867-898f3763-481c-490a-ac93-6f9918bca416.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />
   
   * **Note:** Delegating prompts to Deforum requires the latest Deforum extenion. Make sure you update! You should a table like this in your A1111 CLI output to help describe what is managed by Parseq vs Deforum:

<img width="500"  src="https://user-images.githubusercontent.com/74455/222584674-6fcfe3ed-dd50-4b55-9465-d07bf97c216f.png" />

* The prompt visual timeline is now clickable (you can move and resize prompts)

https://user-images.githubusercontent.com/74455/222586254-3a776276-64aa-4779-9d04-0e8c4d4dcaf8.mp4

* Initial implementation range selection in the grid. Works for deletion only – **not** copy/cut/paste. 
* Delete keyframes dialog accepts lists and is pre-populated based on the range selection.



https://user-images.githubusercontent.com/74455/222586768-05073ce8-70d5-4b35-b2a9-88ed27822c46.mp4



### Version 0.1.40

* Improved UI with duplicated elements moved to footer.
* Revamped prompt management. Add unlimited prompts with defined frame ranges, and flexible [composable diffusion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#composable-diffusion) weighting for overlapping prompts.
* New "Preview" section, allowing you to quickly see the value of all fields and the fully rendered prompt on each frame.
* Create new documents from templates (including a "blank" template). Only 2 templates available for now, suggestions / contributions welcome.
* UI improvements to grid: coloured columns, auto-resizing to match row count.
* Optionally show markers on graph, including prompt start/end positions and grid cursor location.
* Added functions `ceil()` and `floor()`, and variables `s` (current position in seconds) and `b` (current position in beats).


### Version 0.1.22

* Added an [audio analyser](https://sd-parseq.web.app/analyser). Use it to generate keyframes and values based on beats, events and pitch of an input audio file. Experimental! Details in documentation.
* Added an "info" field on keyframes so you can keep track of what each keyframe represents.
* New functions and variables available in your formula: `prev_computed_value`, `slide(from, to, in)`, `info_match(regex)`, `info_match_last(regex)`, `info_match_count(regex)`. Details in documentation.
* Full parseq expressions can now be used directly in the prompts.
* Blank values are now permitted on the first and last frames (will use closest value or default value if none specified).
* Oscillator functions can now all take a `limit` (`li`) argument to limit the number of repeated periods.
* Support for new Deforum A1111 schedules (antiblur, hybrid comp). Sampler schedule is not available for now in Parseq (but you can use it directly in Deforum alongside your Parseq manifest).


### Version 0.1.14

* If you sign in at the top right (only Google sign-in supported for now, raise a feature request if this is too limiting), you can use 2 new upload features.
* Once signed in, you can now easily create a sharable URL for your parseq doc from the `Share...` dialog.
* Also once signed in, you can upload the rendered output to a URL. With the latest version of the A1111 extension, you can refer to this URL in the Parseq manifest textbox, so you don't have to keep copying the full JSON data back and forth.
* Sparklines are now clickable, so you can show/hide data more easily.
* A simple Parseq document "Browser" is accessible from the `Load...` dialog that lets you see all the docs and versions in your local storage a bit more easily.


### Version 0.1.0

* Parseq script mode is now deprecated, and Deforum integration mode is the default. I will no longer develop the Parseq script for a1111, focussing instead on making Parseq play well with the Deforum extension for a1111. The Parseq script was destined to only ever be an inferior version of the Deforum extension. If you need to work with the legacy parseq script variables, you can try here: https://sd-parseq.web.app/legacy .
* New document management, peristed to local storage, with options to revert, share & import. Keyframe data is no longer stored in the URL (this caused issues on some browsers). 
* New editable graph! You can add and update keyframes directly on the graph.


## Installation

- Have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Install the [Deforum extension](https://github.com/deforum-art/deforum-for-automatic1111-webui).
- Relaunch the Automatic1111 UI.
– You should now see a `Parseq` section right at the bottom for the `Init` tab under the `Deforum` extension (click to expand it):

<img width="500" alt="image" src="https://i.imgur.com/pGC8im8.png">


## Examples

Here are some examples of what you can do with this. Most of these were generated at 20fps then smoothed to 60fps with ffmpeg minterpolate.

- Img2img loopback using Deforum, with fluctiations on many parameters, and sync'ed to audio :

https://user-images.githubusercontent.com/74455/199890662-9f446def-0582-4021-8249-84ce6b7df5d7.mp4

- Example of advanced audio synchronisation. A [detailed description of how this was created is available here](https://www.reddit.com/r/StableDiffusion/comments/zh8lk8/advanced_audio_sync_with_deforum_and_sdparseq/). The music is an excerpt of [The Prodigy - Smack My Bitch Up (Noisia Remix)](https://www.youtube.com/watch?v=r5OgQCvqbYA).

https://user-images.githubusercontent.com/74455/209022677-568bd283-3e2a-457c-93ab-b27182db7bc6.mp4


- An older version of the same audio sync idea, with side-by-side comparisons with the input video and a preview render that bypasses SD:

https://user-images.githubusercontent.com/74455/199890420-9c939e3a-ae8e-4262-9805-da0f45b4c0bc.mp4


- Loopback using Deforum video where we oscillate between a few famous faces with some 3d movement and occasional denoising spikes to reset the context:

https://user-images.githubusercontent.com/74455/199898527-edcf7537-25ac-4d3f-b91f-8e9e89e252dc.mp4


- Using pitch to influence prompt weight. A higher pitch generates a more luxurious house, and a lower pitch a more decrepit house. The audio analyser was used to to autodetect the notes, create keyframes for each note, and assign the pitch to a prompt weight value. Because Parseq support expression evaluation directly in the prompt, we can then have a positive prompt like: `Photo of the outside of a (${if prompt_weight_1>=0 "modern:"  else "crumbling old:"} ${abs(prompt_weight_1)}) realistic house. <rest of your positive prompt>` and a negative prompt like `(${if prompt_weight_1<0 "modern:"  else "crumbling old:"} ${abs(prompt_weight_1)}) <rest of your negative prompt>`.

https://user-images.githubusercontent.com/74455/213343711-c66c25d6-9ad1-4070-950f-7122db7a1a07.mp4


## Usage

For a video tutorial on getting started with Parseq, see:  https://www.youtube.com/watch?v=MXRjTOE2v64

In summary, there are 2 steps to perform:

### Step 1: Create your parameter manifest

* Go to https://sd-parseq.web.app/ (or run the UI yourself from this repo with `npm start`)
* Edit the table at the top to specify your keyframes and parameter values at those keyframes. See below for more information about what you can do here.
* Hit `Render` to generate the JSON config for every frame.
* Copy the contents of the textbox at the bottom.
   *  If you are signed in (via the button at the top right), you can choose to upload the output instead, and then copy the resulting URL. All changes will be pushed to the same URL, so you won't need to copy & paste again.

### Step 2: Generate the video

* Head to the SD web UI go to the Deforum tab and then the Init tab.
* Paste the JSON or URL you copied in step 1 into the Parseq section at the bottom of the page.
* Fiddle with any other Deforum / Stable Diffusion settings you want to tweak. Rember in particular to check the animation mode, the FPS and the total number of frames to make sure they match Parseq.
* Click generate.

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205213997-fc9bd7f2-2996-4475-9653-993055ad4cf1.png">


## Features

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

Lastly, Parseq can generate keyframes and values directly from an audio file. See the [Audio analyser](#audio-analyser-for-automatic-keyframe-creation-from-audio-data) documentation for details.

### Interpolation modifiers

#### Values

| value  	|  description 	| examples  |
|---	      |---	            |---	      |
| `S`   	| Step interpolation: use the last keyframed value 	| <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225902-72d80405-855f-49ab-9d6b-38e940cf8332.png"> |
| `L` 	  | (default) Linear interpolation betwen the last and next keyframed value | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225983-72667c6b-3f15-4c19-b4b4-5567b9bc8022.png"> |
| `C`  	| Cubic spline interpolation betwen the last and next keyframed value  	| <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226043-13796fa8-8b76-4360-841c-a7f25835d224.png">|
| `P`  	| Polinomial interpolation betwen the last and next keyframed value. Very similar to Cubic spline. | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226091-09958f94-25fa-4646-944e-a3f07ad8d214.png"> |
| `f`  	| The frame number. Not very useful alone, but can be used to reference the overall video position in your interpolation algoritm. For example, add it to your seed value to increment the seed on every frame. |  <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226179-ff524dfa-aa40-4491-b4c1-2be56f7dda5a.png"> |
| `k`  	| The number of frames elapsed since the active keyframe started for this field |  <img width="360"  src="https://www.evernote.com/l/APZb70iFBttLsK4ioqLTDV-UF5rxaLUy2tcB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `b`  	| The current position in beats. Depends on BPM and FPS. |   |
| `s`  	| The current position in seconds. Depends on FPS. |   |
| `active_keyframe`  	| The frame number of the currently active keyframe for this field 	| <img  width="360" src="https://www.evernote.com/l/APY-jH_C5AJIUYipUAU_REuR6bq6jvkBY6sB/image.png" />    |
| `next_keyframe`  	| The frame number of the next keyframe for this field 	| <img width="360" src="https://www.evernote.com/l/APZUpufADXZJP55Z0jsDzFYZxvo-XKwPcicB/image.png" />  |
| `active_keyframe_value`  	| The value set at the currently active keyframe for this field. Equivalent to `S` (step interpolation). 	| <img width="360" src="https://www.evernote.com/l/APZv89DKzZpPna9s8O1w-5bYeCobsYl9GiEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `next_keyframe_value`  	| The value set at the next keyframe for this field 	| <img width="360" src="https://www.evernote.com/l/APakRylM_mdLcK-MZcKm4wmEL7AEJfuzddoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `prev_computed_value`  	| The value calculated at the previous frame for this field, or 0 for the first frame. 	| <img src="https://www.evernote.com/l/APaAsSyhbg5AZofq4JLUNFHLvY0N7NjwjEEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |

#### Functions

All functions can be called either with unnamed args (e.g. `sin(10,2)`) or named args (e.g. `sin(period=10, amplitude=2)`). Most arguments have long and short names (e.g. `sin(p=10, a=2)`).

In the examples below, note how the oscillators' amplitude is set to the linearly interpolated value of the field (`L`), from its initial value of `1` on frame 0, to value `0` on frame 120. This is why the amplitude of the oscillator decreases over time.

| function  	|  description 	| example  	|
|---	         |---	            |---        |
| `sin()`   	| Sine wave oscillator. See below for arguments (only period is required). 	| <img width="724" alt="image" src="https://user-images.githubusercontent.com/74455/205226860-26d6f424-db93-4b83-be69-5fa193a73d66.png"> |
| `sq()` 	  | Square wave oscillator | <img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205227751-b173dc97-f97d-44e2-a208-6e22a344b835.png"> | 
| `tri()`  	| Triangle wave oscillator.  	| <img width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205227903-2c7ebdda-981c-4a78-9a82-7b75ef014499.png"> |
| `saw()`  	| Sawtooth wave oscillator.  	| <img  width="512" src="https://www.evernote.com/l/APbDR-xZ779Jh431tTc2qEc56-EoMETlb2QB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `pulse()`  	| Pulse wave oscillator.  	| <img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205228355-863dcf8d-3d10-4d63-9c5f-32ce75e7b8b3.png"> |
| `bez()`  	| Bezier curve between previous and next keyframe. Arguments are the same as https://cubic-bezier.com/ . If none specified, defaults to `bez(0.5,0,0.5,1)`. Optional parameters include `to`, `from` and `in` to override current and next keyframes as the anchor points.    | <img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205228620-8db81d38-2010-4059-99bc-ed84ec80ffa9.png"> |
| `slide()` | Linear slide over a fixed time period. Requires at least one of `to` or `from` parameters (frame value will be used if missing), and `in` parameter defines how long the slide should last. See image for 3 examples. | <img width="512" src="https://www.evernote.com/l/APazj_b3MGRHBbDNHi30Imb-ZnCubVFGI7YB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `min()`  	| Return the minimum of 2 argument  	| <img width="512" src="https://www.evernote.com/l/APZX1k4fvOlJP6eyrKSFaw-9KeonwNkS7tEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  	|
| `max()`  	| Return the maximum of 2 argument  	| <img width="512" src="https://www.evernote.com/l/APb9CEaqhEhF6L0FRWovG2Rt-qacyphjc_cB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />	|
| `abs()`  	| Return the asolute value of the argument | <img src="https://www.evernote.com/l/APar6IXJsoxK6LDrTeyeHr9c-42Cnrk05qgB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  	|
| `round()`  	| Return the rounded value of the argument. Second argument specifies precision (default: 0). | <img src="https://www.evernote.com/l/APZWLyA1YPVMWao-Zke_v7X2adVxjk_0rEoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  	|
| `floor()`  	| Return the value of the argument rounded down.  Second argument specifies precision (default: 0). | |
| `ceil()`  	| Return the value of the argument rounded up.  Second argument specifies precision (default: 0). | |
| `info_match()` | Takes a **regular expression** as an argument. Returns 1 if the info label of the current active kefframe matches the regex, 0 otherwise.  | <img src="https://www.evernote.com/l/APbS0YKyh2ZHw7ZKEIwCvRTyjIMGL5h2ZNkB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `info_match_count()` | Takes a **regular expression** as an argument. Returns the number of keyframes that have info labels that matched the regex so far. | <img src="https://www.evernote.com/l/APaln7KfMdNNwI1I6vKNwORBzE0Br_BfTxYB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `info_match_last()` | Takes a **regular expression** as an argument. Returns the frame number of the last keyframe that matched the regex, or -1 if none.  | <img src="https://www.evernote.com/l/APajGqQUxC5Jnr4trTPzpkLXXevQyIFRVqoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |

Oscillator arguments: 
* Period `p` *required*:  The period of the oscillation. By default the unit is frames, but you can specify seconds or beats by appending the appropriate suffix (e.g. `sin(p=4b)` or `sin(p=5s)`).
* Amplitude `a` (default: `1`): The amplitude of the oscillation. `sin(p=4b, a=2)` is equivalent to `sin(p=4b)*2`.
* Phase shift `ps` (default: `0`): The x-axis offset of the oscillation, i.e. how much to subtract from the frame number to get the frame's oscillation x position. A useful value is `-active_keyframe`, which will make the period start from the keyframe position. See below for an illustration.
* Centre `c` (default: `0`): The y-axis offset of the oscillation. `sin(p=4b, c=2)` is equivalent to `sin(p=4b)+2`
* Limit `li` (default: `0`): If >0, limits the number of periods repeated
* Pulse width `pw` (default: `5`): *pulse() function only* The pulse width. 

Examples:
| | |
|---|---
| <img src="https://www.evernote.com/l/APbLSplqegdC77U_AJhyWz977bhQdFscYgUB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />| Defining a sine wave with linearly increasing amplitude using `sin(p=2b, a=L)`, meaning the amplitude is the linear interpolation of the keyframe values.|
| <img src="https://www.evernote.com/l/APZxcomc6UpL0q2HLBC78cwhZjwRHyokJcYB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> | Limiting to 1 period at each keyframe with `li=1`. Notice how the phase is maintained relative to the full sinewave, so the period does not start with the keyframe.|
|<img src="https://www.evernote.com/l/APacHmL0zHtGK6xWrzQKFFLkTSwlAzBzQDwB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />| By setting the phase shift to the negative offset of the active keyframe with `ps=-active_keyframe`, we can ensure the period starts at the keyframe point. |


#### Units

Units can be used to modify numbers representing frame ranges to match second of beat offsets calculated using the FPS and BPM values. This is particularly useful when specifying the period of an oscillator.

| unit  	|  description 	| example  	|
|---	   |---	|---	|
| `f`   	| (default) frames 	|   	|
| `s` 	| seconds |   	|
| `b`  	| beats  	|   	|

#### Other operators and expressions

| if expression  	|  description 	| example  	|
|---	    |---	|---	|
| `if <cond> <consequent> else <alt>` | if `cond` evaluates to any value other than 0, return `consequent`, else return `alt`. `cond`, `consequent` and `alt` are all arbitrary expressions. | Use a square wave which alternates between 1 and -1 with a period of 10 frames to alternatively render the step and cubic spline interpolations: <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205402345-88cfea53-382e-463d-a3a4-38d4b332f5f3.png"> |

| operator  	|  description 	| example  	|
|---	   |---	|---	|
| `<expr1> : <expr2>`  | Syntactic sugar for easily creating strings of the format `(<term>:<weight>)`. For example, putting the following in your prompt `${"cat":prompt_weight_1}` will render to `${(cat:0.5)}` where 0.5 is the value of `prompt_weight_1` for that frame. `expr1` must return a string and `expr2` a number. |  |  
| `<expr1> + <expr2>`   	| Add two expressions. Also acts as string concatenation if either expression is a string (with the same type conversion semantics as Javascript string concatenation). 	| Make the seed increase by 0.25 on every frame (Parseq uses fractional seeds to infuence the subseed strength): <img width="800" alt="image" src="https://user-images.githubusercontent.com/74455/205402606-9d9ede7e-f763-4bb4-ab5a-993dbc65d29e.png"> |
| `<expr1> - <expr2>` 	| Subtract two expressions. |   	|
| `<expr1> * <expr2>`  	| Multiply two expressions. |   	|
| `<expr1> / <expr2>`  	| Divide two expressions. 	|   	|
| `<expr1> % <expr2>`  	| Modulus  |  Reset the seed every 4 beats: <img width="802" alt="image" src="https://user-images.githubusercontent.com/74455/205402901-52f78382-b36a-403a-a6d9-6277af0c758f.png"> |
| `<expr1> != <expr2>`  	| 1 if expressions are not equal, 0 otherwise.       	      |   	|
| `<expr1> == <expr2>`  	| 1 if expressions are equal, 0 otherwise.   	            |   	|
| `<expr1> < <expr2>`  	   | 1 if <expr1> less than <expr2>, 0 otherwise.   	         |   	|
| `<expr1> <= <expr2>`  	| 1 if <expr1> less than or equals <expr2>, 0 otherwise.    |    	|
| `<expr1> >= <expr2>`  	| 1 if <expr1> greater than <expr2>, 0 otherwise.  	      |   	|
| `<expr1> < <expr2>`  	   | 1 if <expr1> greater than or equals <expr2>, 0 otherwise. |   	|
| `<expr1> and <expr2>`  	| 1 if <expr1> and <expr2> are non-zero, 0 otherwise.  	   |   	|
| `<expr1> or <expr2>`  	| 1 if <expr1> or <expr2> are non-zero, 0 otherwise.  	   |   	|


### Audio analyser for automatic keyframe creation from audio data

Parseq now includes a [built-in audio analyser](https://sd-parseq.web.app/analyser), which you can use to generate keyframes and values based on beats, events and pitch of an input audio file.

#### Audio analyer general info (read this first)
* ⚠️ This feature is experimental. That's why it's quite separate from the main Parseq UI for now. The keyframes it generates can be merged into an existing Parseq document using the "Merge keyframes" button in the main UI.
* Tempo, onset event and pitch detection use [Aubio](https://aubio.org/), via [AubioJS](https://github.com/qiuxiang/aubiojs). See the [Aubio CLI documentation](https://aubio.org/manual/latest/cli.html) for the meaning of analysis parameters.
* Not all parameters are exposed by AubioJS. Some look like they should be, but aren't (those are grayed out in the UI).
* All processing runs in the browser, using web workers. This seems to be faster in Chrome and Safari compared to Firefox. You can speed things up by increasing the hop sizes to larger multiples of 2 (trading off accuracy).
* Parseq generally expects audio with a constant Tempo (shuffles and other changign tempos are not yet supported). Also, tempo detection is not perfect, so you can override it before generating keyframes. If the first beat is not at the very beginning of the track, you will need to enter a manual offset for now.
* Pitch detection is sketchy with beats in the mix. You may want to run this multiple times on different audio layers and do multiple merges.
* The frame-per-second (FPS) specified in the analyser must match the parseq doc you're merging with, or you'll be out-of-sync.


#### Using the Audio analyser

The audio analyser UI is split into 3 parts: 
* **Audio analysis** where you load an audio file, and run algorithms on it for tempo, onset event and pitch detection.
* **Visualisation & playback** where you can see your audio wave, spectrogram, detected pitch and beat & event positions, as well as play the audio file. 
* **Conversion to Parseq keyframes** where you define how the result of the audio analysis will be mapped to Parseq keyframes.

Digging into each section:


##### Audio Analysis

<img width="720" src="https://www.evernote.com/l/APYsXAZGTmxJ2bLc7uLdOgzyyjDV4vyInc4B/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

Parseq performs 3 types of analysis on your audio file:
* Tempo detection: attempts to identify the overall number of beats per minute in the audio file.
* Onset (event) detection: attempts to identify the moments where meaningful changes occur in the audio file. These could be drum beats, new instruments being introduced, etc...
* Pitch detection: attempts to identify the dominant frequency at each moment of your audio file.

Here are the settings you can tweak for this analysis:

* File: opens a file browser for you to select an audio file. Most audio formats are supported.
* Sample rate: the samples per second to use for processing.
* Tempo detection settings:
   * Tempo buffer: number of samples used for each analysis. Recommend to leave as is.
   * Tempo hop: number of samples between two consecutive analysis parsses. Lower values increase precision at the exepense of increased CPU time, but going too low will result in invalid results.
* Onset event detection settings (see the [aubioonset CLI docs](https://aubio.org/manual/latest/cli.html#aubioonset)  for more complete definitions).
   * Onset buffer: number of samples used for each analysis. Recommend to leave as is.
   * Onset hop: number of samples between two consecutive analysis parsses. Lower values increase precision at the exepense of increased CPU time, but going too low will result in invalid results.
   * Onset threshold: defines how picky to be when identifying onset events. Lower threshold values result in more events, high values result in fewer events.
   * Onset silence: from aubio docs: "volume in dB under which the onset will not be detected. A value of -20.0 would eliminate most onsets but the loudest ones. A value of -90.0 would select all onsets."
   * Onset method: a selction of onset detection algorithms to choose from. Experiment with these, as they can produce vastly different results.
* Pitch detection settings (see the [aubiopitch CLI docs](https://aubio.org/manual/latest/cli.html#aubiopitch) for more complete definitions):
   * Pitch buffer: number of samples used for each analysis. Recommend to leave as is.
   * Pitch hop: number of samples between two consecutive analysis parsses. Lower values increase precision at the exepense of increased CPU time, but going too low will result in invalid results.
   * Pitch method: a selction of pitch detection algorithms to choose from. Experiment with these, as they can produce vastly different results.

##### Visualisation & playback

<img width="720"  src="https://www.evernote.com/l/APYyk-gfAYJHw4MQXIbKhg8T8jrMfG6FUbgB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

The top section shows the waveform and, after running the analysis, will include markers for beats in blue at the bottom, and for onset events in red at the top. Onset markers can be dragged, but beat markers cannot. The waveform can be zoomed with the slider at the bottom. Beneath that is a simple spectrogram view.

Next is a graph showing detected pitch values over time in light purple. Typically, the pitch detection is quite "jagged", i.e. the values might include undesirable spikes. After you generate keyframes, you will see 2 additonal curves appear, which should be smoother: the normalised values in dark purple which has had filtering and normalisation applied to it as per your settings (see next section), and the keyframed values in red which are the actual values that will be used in Parseq keyframes.


##### Conversion to Parseq keyframes

<img width="720"  src="https://www.evernote.com/l/APZqnCDTIkxNxbmC7u_q76JIZyf7LVkk-icB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

Beats and Onset events can be converted to keyframes with custom values and interpolation functions for any Parseq-controllable field.  Pitch data can be used to set a value at each generated keyframe.

There are a range of settings that help define how the audio analysis data will be converted to Parseq keyframes:

* Tempo settings: 
   * Filtering:
      * *Include every Nth beat* and *Starting from* allow you to pick a subset of beats to convert to keyframes. You can set either one of these to a ridiculously high value to skip generating keyframes for beats altogether.
      * Custom label: include custom text in the "info" field for these keyframes.
   * Correction:
      * BPM override: ignore the detected BPM and use this value instead. Defaults to a rounded version of the detected BPM
      * First beat offset: the time of the first beat in seconds. Useful if the song does not start immediately.
   * Set value: the value data to include in the generated keyframes
* Onset settings: 
   * Filtering:
      * *Include every Nth event* and *Starting from* allow you to pick a subset of onset events to convert to keyframes. You can set either one of these to a ridiculously high value to skip generating keyframes for onset events altogether.
      * Custom label: include custom text in the "info" field for these keyframes.
   * Set value: the value data to include in the generated keyframes
* Pitch settings:
   * Filtering: 
      * Outlier tolerance: parseq uses a Median Differencing algorithm to try to remove unwanted outliers from the pitch detection data. Higher values means allow more outliers, lower values (above 0) means cut out more outliers, or -1 to disable outlier elimination completely.
      * Discard above / discard below: a more brute-force way of removing pitch detection glitches: ignore any pitch data points outside of these thresholds.
   * Normalisation: you'll usually want to map the pitch data to a different range for the values to make sense in deforum. For example, if you're using pitch to set a prompt weight, you'll want to normalise the pitch data to a min of 0 and a max of 1. For a rotation, you might want a min of -45 and a max of 45.
   * Set value: unlike beats and onset events, pitch data points do not create keyframes because it is a continuous data stream rather than discrete events. Therefore, the normalised pitch value is assigned to the keyframes generated from the beat and onset events. Here you can set the field and interpolation that should be used (the value is the pitch value itself).

Once you are happy with your generated keyframes, hit `Copy Keyframes` and merge them into your Parseq Doc with the `Merge Keyframes` button beneath the grid in the main Parseq UI. 

<img  width="360" src="https://www.evernote.com/l/APaHqp1Qfu1GXIvc4aC-42lFAIs3k83_0nEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

Note that you can run multiple merges if you with to set multiple different values on each keyframe.



## Deforum integration features

Parseq can be used with **all** Deforum animation modes (2D, 3D, prompt interpolation, video etc...). You don't need to do anything special in Parseq to switch between modes: simply tweak the parameters you're interested in. 

### Keyframable parameters

Here are the parameters that Parseq controls. Any values you set in the A1111 UI for Deforum will be overridden.
   
Stable diffusion generation parameters:

* seed
* scale
* noise: additional noise to add during generation, can help
* strength: how much the last generated image should influence the current generation

2D animation parameters:

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

Anti-blur parameters:

* antiblur_kernel
* antiblur_sigma
* antiblur_amount
* antiblur_threshold

Hybrid video parameters:

* hybrid_comp_alpha
* hybrid_comp_mask_blend_alpha
* hybrid_comp_mask_contrast
* hybrid_comp_mask_auto_contrast_cutoff_low
* hybrid_comp_mask_auto_contrast_cutoff_high

Other parameters:
   
* contrast: factor by which to adjust the previous last generated image's contrast before feeding to the current generation. 1 is no change, <1 lowers contrast, >1 increases contract.   
   
### Prompt manipulation

Parseq provides a further 8 keyframable parameters (`prompt_weight_1` to `prompt_weight_8`) that you can reference in your prompts, and can therefore be used as prompts weights. You can use any prompt format that will be recognised by a1111, keeping in mind that anything enclosed in `${...}` will be evaluated as a Parseq expression.

For example, here's a positive prompt that uses [Composable Diffusion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#composable-diffusion) to interpolate between faces:
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

And here's an example using term weighting:
```
(Jennifer Aniston:${prompt_weight_1}), (Brad Pitt:${prompt_weight_2}), (Ben Affleck:${prompt_weight_3}), (Gwyneth Paltrow:${prompt_weight_4}), (Zac Efron:${prompt_weight_5}), (Clint Eastwood:${prompt_weight_6}), (Jennifer Lawrence:${prompt_weight_7}), (Jude Law:${prompt_weight_8}), centered, high detail studio photo portrait 
```

A corresponding parameter flow could look like this:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205405460-2f9ed10c-0df4-4e4e-8c4f-d68c1c6ceccf.png">
   
Note that any Parseq expression can be used, so for example the following will alternate between cat and dog on each beat:

```
Detailed photo of a ${if (floor(b%2)==0) "cat" else "dog"} 
```

Some important notes:
* Remember that unless you set `strength` to `0`, prior frames influence the current frame in addition to the prompt, so previous items won't disappear immediately even if they are removed from the prompt on a given frame.
* To counter-act this, you may wish to put terms you *don't* wish to see at a given frame in your negative prompt too, with inverted weights. 

So the prior example might look like this:

| Positive | Negative |
|--- |--- |
| `Detailed photo of a ${if (floor(b%2)==0) "cat" else "dog"}` | `${if (floor(b%2)==0) "dog" else "cat"}` |

### Using multiple prompts

You can add additional prompts and assign each one to a frame range:

<img width='500' src="https://i.imgur.com/eY5FSOX.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

If the ranges overlap, Parseq will combine the overlapping prompts with [composable diffusion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#composable-diffusion). You can decide whether the composable diffusion weights should be fixed, slide linearly in and out, or be defined by a custom Parseq expression.

Note that if overlapping prompts already use composable diffusion (`... AND ...`), this may lead to unexpected results, because only the last section of the original prompt will be weighted against the overlapping prompt. Parseq will warn you if this is happening.


### Subseed control for seed travelling

For a great description of seed travelling, see [Yownas' script](https://github.com/yownas/seed_travel). In summary, you can interpolate between the latent noise generated by 2 seeds by setting the first as the (main) seed, the second as the subseed, and fluctuating the subseed strength. A subseed strength of 0 will just use the main seed, and 1 will just use the subseed as the seed. Any value in between will interpolate between the two noise patterns using spherical linear interpolation (SLERP).

Parseq does not currently expose the subseed and subseed strength parameters explicitly. Instead, it takes fractional seed values and uses them to control the subseed and subseed strength values. For example, if on a given frame your seed value is `10.5`, Parseq will send `10` as the seed, `11` as the subseed, and `0.5` as the subseed strength.
   
The downside is you can only interpolate between adjacent seeds. The benefit is seed travelling is very intuitive. If you'd like to have full control over the subseed and subseed strength, feel free to raise a feature request!

Note that the results of seed travelling are best seen with no input image (Interpolation animation mode) or with a very low strength. Else, the low input variations will likely result in artifacts / deep-frying.
   
Otherwise it's best to change the seed by at least 1 on each frame (you can also experiment with seed oscillation, for less variation).


### Delta values (aka absolute vs relative motion parameters)

**Parseq aims to let you set absolute values for all parameters.**   So if you want to progressively rotate 180 degrees over 4 frames, you specify the following values for each frame: 45, 90, 135, 180.

However, because Stable Diffusion animations are made by feeding the last generated frame into the current generation step, **some** animation parameters become relative if there is enough loopback strength. So if you want to rotate 180 degrees over 4 frames, the animation engine expects the values 45, 45, 45, 45.

This is not the case for all parameters: for example, the seed value and field-of-view settings have no dependency on prior frames, so the animation engine expects absolute values.
   
To reconcile this, Parseq supplies _delta values_ to Deforum for certain parameters. This is enabled by default, but you can toggle if off in the A111 Deforum extension UI if you want to see the difference.
   
For most parameters the delta value for a given field is simply the difference between the current and previous frame's value for that field. However, a few parameters such as 2D zoom (which is actually a scale factor) are multiplicative, so the delta is the ratio between the previous and current value.


## Development

Parseq is currently a front-end React app. It is part way through a conversion from Javascript to Typescript. There is currently very little back-end: by default, persistence is entirely in browser indexdb storage via [Dexie.js](https://dexie.org/). Signed-in users can optionally upload data to a Firebase-backed datastore.

You'll need `node` and `npm` on your system before you get started.

There is a severe lack of tests, which I will remedy one day. :)

If you want to dive in:
   - Run `npm install` to pull dependencies.
   - Run `npm start` to run the Parseq UI locally in dev mode on port 3000. You can now access the UI on `localhost:3000`. Code changes should be hot-reloaded.

### Deployment

Hosting & deployment is done using Firebase. Merges to master are automatically deployed to the staging channel. PRs are automatically deployed to the dev channel. There is currently no automated post-deployment verification or promotion to prod.

Assuming you have the right permissions, you can view active deployements with:

```
firebase hosting:channel:list
```

And promote from staging to prod with:

```
firebase hosting:clone sd-parseq:staging sd-parseq:live
```

   
## Credits

This script includes ideas and code sourced from many other scripts. Thanks in particular to the following sources of inspiration:

* Everyone behind Deforum: https://github.com/deforum-art/
* Everyone trying out Parseq and giving me feedback on Discrod (e.g. ronnykhalil, Michael L, Moistlicks, Kingpin, hithere, kabachuha...)
* Everyone behind [Aubio](https://aubio.org/), [AubioJS](https://github.com/qiuxiang/aubiojs), [Wavesurfer](https://wavesurfer-js.org/),  [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor), [ag-grid](https://www.ag-grid.com/) (community edition), chart.js and recharts.
* Filarus for their vid2vid script: https://github.com/Filarius/stable-diffusion-webui/blob/master/scripts/vid2vid.py .  
* Animator-Anon for their animation script: https://github.com/Animator-Anon/Animator/blob/main/animation.py . I picked up some good ideas from this.
* Yownas for their seed travelling script: https://github.com/yownas/seed_travel.
* feffy380 for the prompt-morph script https://github.com/feffy380/prompt-morph
* eborboihuc for the clear implementation of 3d rotations using `cv2.warpPerspective()`:  https://github.com/eborboihuc/rotate_3d/blob/master/image_transformer.py
