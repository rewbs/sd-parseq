![example workflow](https://github.com/rewbs/sd-parseq/actions/workflows/firebase-hosting-merge.yml/badge.svg)

# Stable Diffusion Parseq

- [What is this?](#what-is-this)
- [What's new?](#whats-new)
- [Getting started](#getting-started)
- [Examples](#examples)
- [Features](#features)
  - [Keyframed parameter values with scriptable interpolation](#keyframed-parameter-values-with-scriptable-interpolation)
  - [Interpolation expressions](#interpolation-expressions)
    - [Operators](#operators)
    - [Context variables](#context-variables)
    - [Constants](#constants)
    - [Units](#units)
    - [Unit conversion functions](#unit-conversion-functions)
    - [Oscillator functions](#oscillator-functions)
    - [Transition functions](#transition-functions)
    - [Noise functions](#noise-functions)
    - [Maths functions](#maths-functions)
    - [Javascript maths functions](#javascript-maths-functions)
    - [Info text matching functions](#info-text-matching-functions)
    - [Prompt manipulation functions](#prompt-manipulation-functions)
  - [Working with time & beats (audio synchronisation)](#working-with-time--beats-audio-synchronisation)
    - [Beats per minute and frames per second](#beats-per-minute-and-frames-per-second)
    - [Locking keyframes to beats or seconds](#locking-keyframes-to-beats-or-seconds)
    - [Interval keyframe creation](#interval-keyframe-creation)
    - [Keyframe labelling](#keyframe-labelling)
    - [Reference audio](#reference-audio)
    - [Automatically generating keyframes from audio events](#automatically-generating-keyframes-from-audio-events)
    - [Sync'ing to pitch and amplitude using time series](#syncing-to-pitch-and-amplitude-using-time-series)
    - [Legacy Audio Analyser](#legacy-audio-analyser)
  - [Time series for arbtrary data sequences](#time-series-for-arbtrary-data-sequences)
  - [Camera movement preview](#camera-movement-preview)
  - [Deforum integration features](#deforum-integration-features)
    - [Keyframable parameters](#keyframable-parameters)
  - [Prompt manipulation](#prompt-manipulation)
  - [Using multiple prompts](#using-multiple-prompts)
  - [Subseed control for seed travelling](#subseed-control-for-seed-travelling)
  - [Delta values (aka absolute vs relative motion parameters)](#delta-values-aka-absolute-vs-relative-motion-parameters)
- [Working with large number of frames (performance tips)](#working-with-large-number-of-frames-performance-tips)
- [Development & running locally](#development--running-locally)
  - [Deployment](#deployment)
- [Credits and support](#credits)

## What is this?

You can jump straight into Parseq here: <https://sd-parseq.web.app/> .

To provide some context:

- [Stable Diffusion](https://stability.ai/blog/stable-diffusion-public-release) is an AI image generation tool.
- [Deforum](https://github.com/deforum-art/deforum-stable-diffusion) is a notebook-based UI for Stable Diffusion that is geared towards creating videos.
- [AUTOMATIC1111/stable-diffusion-webui](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a Web UI for Stable Diffusion (but not for Deforum).
- The [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui) is an extention to the Automatic1111 Web UI that integrates the functionality of the Deforum notebook.

Parseq (this tool) is a _parameter sequencer_ for the [Deforum extension for Automatic1111](https://github.com/deforum-art/deforum-for-automatic1111-webui). You can use it to generate animations with tight control and flexible interpolation over many Stable Diffusion parameters (such as seed, scale, prompt weights, noise, image strength...), as well as input processing parameter (such as zoom, pan, 3D rotation...).

For now, Parseq is almost entirely front-end and stores all state in browser local storage by default. All processing, including audio processing, is done in the browser. Signed-in users can optionally upload their work from the UI for easier sharing.

Using Parseq, you can:

| | | |
|---|---|---|
|  Sequence, evolve and blend prompts with scriptable logic right in the prompt text | Control how parameters and prompt weights change over time, both visually and with an advanced expression language | Automatically detect audio events, and use them to influence your video. |
| <img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/518def5f-df7b-4921-a020-ff580c5cc3ba"> | <img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/ed6fabee-528b-447f-8b68-73f695d23dec"> | <img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/44e40f83-72f0-4d1e-8386-7ab8e0a109a7">  |
| Extract pitch and amplitude data from audio, and import any raw timeseries data, for use in your expressions | Preview 3D motion and final prompts before kicking off your diffusion | Simple integration with the A1111 Deforum extension - just copy one link! |
| <img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/29f06f84-1542-4585-88d3-0a501fda8333"> | <img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/74669809-0153-4593-a17a-aaa65e1a4de4"> | <img width="1195" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/784dd7c9-d486-49f7-b640-7181e6abcdad"> |

## What's new?

See the [Parseq change log](https://github.com/rewbs/sd-parseq/wiki/Parseq-change-log) on the project wiki.

## Getting started

### Pre-reqs

- Start by ensuring you have a working installation of [Automatic1111's Stable Diffusion UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Next, install the [Deforum extension](https://github.com/deforum-art/deforum-for-automatic1111-webui).
– You should now see a `Parseq` section right at the bottom for the `Init` tab under the `Deforum` extension (click to expand it).

### Ramping up

The best way to get your head around Parseq's capabilities and core concepts is to watch the [following tutorials](https://www.youtube.com/playlist?list=PLXbx1PHKHwIHsYFfb5lq2wS8g1FKz6aP8):

| Part 1 | Part 2 | Part 3 |
|--- |--- |---
| [<img width=400 src="https://i.ytimg.com/vi/MXRjTOE2v64/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&amp;rs=AOn4CLBBgRv91gM-WNI2mlJMZbWXmyyMZg">](https://www.youtube.com/watch?v=MXRjTOE2v64) | [<img width=400 src="https://i.ytimg.com/vi/PvWckT0Pik8/hq720.jpg?sqp=-oaymwEcCNAFEJQDSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD7_8Aw9Coj6G7_0RWrSLEqStvamA">](https://www.youtube.com/watch?v=PvWckT0Pik8)  | [<img width=400 src="https://i.ytimg.com/vi/M6Z-kD2HnDQ/hqdefault.jpg?sqp=-oaymwEcCNACELwBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDZX4Xf6a_FNCBZCkfaYLmHyS1q6A">](https://www.youtube.com/watch?v=M6Z-kD2HnDQ) |

## Usage

In summary, there are 2 steps to perform:

**Step 1: Create your parameter manifest**

- Go to <https://sd-parseq.web.app/> (or run the UI yourself from this repo with `npm start`)
- Edit the table at the top to specify your keyframes and parameter values at those keyframes. See below for more information about what you can do here.
- Copy the contents of the "Output" textbox at the bottom. If you are signed in (via the button at the top right), you can choose to upload the output instead, and then copy the resulting URL. All subsequent changes will be pushed to the same URL, so you won't need to copy & paste again.

**Step 2: Generate the video**

- Head to the SD web UI go to the Deforum tab and then the Init tab.
- Paste the JSON or URL you copied in step 1 into the Parseq section at the bottom of the page.
- Fiddle with any other Deforum / Stable Diffusion settings you want to tweak. Rember in particular to check the animation mode, the FPS and the total number of frames to make sure they match Parseq.
- Click generate.

## Examples

Here are some examples showing what can do. Most of these were generated at 20fps then smoothed to 60fps with ffmpeg minterpolate or FILM. See the also the [Parseq Example Library](https://github.com/rewbs/sd-parseq/discussions/categories/parseq-example-library) for a range of simple examples and all required settings to recreate them.

| Example | Description |
|--- |--- |
| <video src="https://github.com/rewbs/sd-parseq/assets/74455/67013869-1dfc-4144-9640-6000ec4a4fe1" /> | Audio-controlled prompt: the amplitude affects the facial expression, and the pitch affects the pastel/vector effect. See [the video on Youtube](https://www.youtube.com/watch?v=fgiev3A93RU) for higher quality and all settings. |
| <video src="https://github.com/rewbs/sd-parseq/assets/74455/a7ff8731-c82a-4809-b128-487926aff40f" />  | Audio synchronisation example from [Parseq Tutorial 3](https://www.youtube.com/watch?v=M6Z-kD2HnDQ). Watch [on Youtube  for higher quality](https://www.youtube.com/watch?v=LzWXxCbTaOU). |
| <video src="https://user-images.githubusercontent.com/74455/209022677-568bd283-3e2a-457c-93ab-b27182db7bc6.mp4" /> | Another example of advanced audio synchronisation. A [detailed description of how this was created is available here](https://www.reddit.com/r/StableDiffusion/comments/zh8lk8/advanced_audio_sync_with_deforum_and_sdparseq/). The music is an excerpt of [The Prodigy - Smack My Bitch Up (Noisia Remix)](https://www.youtube.com/watch?v=r5OgQCvqbYA). |
| <video src="https://user-images.githubusercontent.com/74455/228871042-a7a26e6f-aa42-4b24-837a-b5dc93812602.mp4" /> | Combining 3D y-axis rotation with x-axis pan to rotate around a subject. See the [Parseq Example Library](https://github.com/rewbs/sd-parseq/discussions/106) for more information. |
| <video src="https://user-images.githubusercontent.com/74455/228868895-75da2d24-2fa0-49a3-ba7b-6ac644014935.mp4" /> | Seed travelling example featured in [Parseq Tutorial 2](https://www.youtube.com/watch?v=PvWckT0Pik8). |
| <video src="https://user-images.githubusercontent.com/74455/228870311-0f59ea4b-880b-449f-8552-daeba5a8d7c9.mp4" /> | - Prompt manipulation example featured in [Parseq Tutorial 2](https://www.youtube.com/watch?v=PvWckT0Pik8). |
| <video src="https://user-images.githubusercontent.com/74455/199898527-edcf7537-25ac-4d3f-b91f-8e9e89e252dc.mp4" /> | Oscillating between a few famous faces with some 3d movement and occasional denoising spikes to reset the context. |

## Features

### Keyframed parameter values with scriptable interpolation

Parseq's main feature is advanced control over parameter values, using keyframing with interesting interpolation mechanisms.

The keyframe grid is the central UI concept in Parseq. Each row in the grid represents a keyframe. Each parameter has a pair of columns: the first takes an explicit value for that field, and the second takes an _interpolation formula_, which defines how the value will "travel" to the next keyframe's value. If no interpolation formula is specified on a given keyframe, the formula from the previous keyframe continues to be used. The default interpolation algorithm is linear interpolation.

Below the grid, a graph allows you to see the result of the interpolation (and edit keyframe values by dragging nodes):

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205216163-dd622849-a2ac-4991-8f74-7271c1ed5a5b.png">

The interpolation formula can be an arbitrarily complex mathematical expression, and can use a range of built-in functions and values, including oscillators and helpers to synchronise them to timestamps or beats:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205217130-74e8e5b0-f432-4dc7-a190-d6f0eacb3844.png">

### Interpolation expressions

Interpolation expressions define how the value for a given field should be computed at each frame. Expressions can return numbers or strings. String literals must be enclosed in double quotes (`""`).

Here are the operators, values, constants and functions you can use in Parseq expressions.

#### Function live documentation

💡 You can visualise and play with all interpolation logic using [Parseq's live documentation](https://sd-parseq.web.app/functionDocs). 💡

#### Operators

| operator   |  description  | example   |
|---    |--- |--- |
| `<expr1> + <expr2>`    | Add two expressions. Also acts as string concatenation if either expression is a string (with the same type conversion semantics as Javascript string concatenation).  | Make the seed increase by 0.25 on every frame (Parseq uses fractional seeds to infuence the subseed strength): <img width="800" alt="image" src="https://user-images.githubusercontent.com/74455/205402606-9d9ede7e-f763-4bb4-ab5a-993dbc65d29e.png"> |
| `<expr1> - <expr2>`  | Subtract two expressions. |    |
| `<expr1> * <expr2>`   | Multiply two expressions. |    |
| `<expr1> / <expr2>`   | Divide two expressions.  |    |
| `<expr1> % <expr2>`   | Modulus  |  Reset the seed every 4 beats: <img width="802" alt="image" src="https://user-images.githubusercontent.com/74455/205402901-52f78382-b36a-403a-a6d9-6277af0c758f.png"> |
| `<expr1> != <expr2>`   | 1 if expressions are not equal, 0 otherwise.              |    |
| `<expr1> == <expr2>`   | 1 if expressions are equal, 0 otherwise.                |    |
| `<expr1> < <expr2>`      | 1 if <expr1> less than <expr2>, 0 otherwise.             |    |
| `<expr1> <= <expr2>`   | 1 if <expr1> less than or equals <expr2>, 0 otherwise.    |     |
| `<expr1> >= <expr2>`   | 1 if <expr1> greater than <expr2>, 0 otherwise.         |    |
| `<expr1> < <expr2>`      | 1 if <expr1> greater than or equals <expr2>, 0 otherwise. |    |
| `<expr1> and <expr2>`   | 1 if <expr1> and <expr2> are non-zero, 0 otherwise.      |    |
| `<expr1> or <expr2>`   | 1 if <expr1> or <expr2> are non-zero, 0 otherwise.      |    |
| `if <cond> <consequent> else <alt>` | if `cond` evaluates to any value other than 0, return `consequent`, else return `alt`. `cond`, `consequent` and `alt` are all arbitrary expressions. | Use a square wave which alternates between 1 and -1 with a period of 10 frames to alternatively render the step and cubic spline interpolations: <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205402345-88cfea53-382e-463d-a3a4-38d4b332f5f3.png"> |
| `<expr1> : <expr2>`  | Syntactic sugar for easily creating strings of the format `(<term>:<weight>)`. For example, putting the following in your prompt `${"cat":prompt_weight_1}` will render to `${(cat:0.5)}` where 0.5 is the value of `prompt_weight_1` for that frame. `expr1` must return a string and `expr2` a number. |  |  

#### Context variables

Your expression runs in a context that provides access to a number of useful variables:

| value   |  description  | examples  |
|---       |---             |---       |
| `L`  | (default) The value at this frame assuming linear interpolation betwen the previous and next keyframed value | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225983-72667c6b-3f15-4c19-b4b4-5567b9bc8022.png"> |
| `S`    | The value at this frame assuming step interpolation. This is equivalent to `active_keyframe_value`, i.e. the value last seen in the value column. | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205225902-72d80405-855f-49ab-9d6b-38e940cf8332.png"> |
| `C`   | The value at this frame assuming cubic spline over all keyframed values. | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226043-13796fa8-8b76-4360-841c-a7f25835d224.png">|
| `P`   | As above, but using polynomial interp. Very similar to Cubic spline. | <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226091-09958f94-25fa-4646-944e-a3f07ad8d214.png"> |
| `f`   | The current frame number. Not very useful alone, but can be used to reference the overall video position in your interpolation algoritm. For example, add it to your seed value to increment the seed on every frame. |  <img width="360" alt="image" src="https://user-images.githubusercontent.com/74455/205226179-ff524dfa-aa40-4491-b4c1-2be56f7dda5a.png"> |
| `k`   | The number of frames elapsed since the active keyframe started for this field |  <img width="360"  src="https://www.evernote.com/l/APZb70iFBttLsK4ioqLTDV-UF5rxaLUy2tcB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `b`   | The current position in beats. Depends on BPM and FPS. |   |
| `s`   | The current position in seconds. Depends on FPS. |   |
| `active_keyframe`   | The frame number of the currently active keyframe for this field  | <img  width="360" src="https://www.evernote.com/l/APY-jH_C5AJIUYipUAU_REuR6bq6jvkBY6sB/image.png" />    |
| `next_keyframe`   | The frame number of the next keyframe for this field  | <img width="360" src="https://www.evernote.com/l/APZUpufADXZJP55Z0jsDzFYZxvo-XKwPcicB/image.png" />  |
| `active_keyframe_value`   | The value set at the currently active keyframe for this field. Equivalent to `S` (step interpolation).  | <img width="360" src="https://www.evernote.com/l/APZv89DKzZpPna9s8O1w-5bYeCobsYl9GiEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `next_keyframe_value`   | The value set at the next keyframe for this field  | <img width="360" src="https://www.evernote.com/l/APakRylM_mdLcK-MZcKm4wmEL7AEJfuzddoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `prev_computed_value`   | The value calculated at the previous frame for this field, or 0 for the first frame.  | <img src="https://www.evernote.com/l/APaAsSyhbg5AZofq4JLUNFHLvY0N7NjwjEEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `last_frame`   | The value set in the "Final frame" input field. Similar to the "max_f" variable in deforum.  |   |

#### Constants

| Constant | description | example |
|--- |--- |--- |
| `PI` | Constant pi. | |
| `E` | Constant e. | |
| `SQRT2` | Square root of 2. | |
| `SQRT1_2` |  Square root of 2. | |
| `LN2` | Natural logarithm of 2. | |
| `LN10` | Natural logarithm of 10. | |
| `LOG2E` | Base 2 logarithm of e. | |
| `LOG10E` |  Base 10 logarithm of e. | |

#### Units

Units can be appended to numerical constants to convert from frame to beats/seconds using the document's FPS and BPM. This is particularly useful when specifying the period of an oscillator (or anything else representing a time period).

| unit   |  description  | example   |
|---    |--- |--- |
| `f`    | (default) frames  | `sin(p=10f)` (equivalent to `sin(p=10)`) |
| `s`  | seconds | `sin(p=2s)`   |
| `b`   | beats   | `sin(p=4b)` |

#### Unit conversion functions

Use these functions to convert between frames, beats and seconds:

| unit   |  function  | example   |
|---    |--- |--- |
| `f2b(x)`    | Frames to beats |    |
| `b2f(x)`   | Beats to frames |    |
| `f2s(x)`   | Frames to seconds   |    |
| `s2f(x)`   | Seconds to frames   |    |

#### Oscillator functions

All functions can be called either with unnamed args (e.g. `sin(10,2)`) or named args (e.g. `sin(period=10, amplitude=2)`). Most arguments have long and short names (e.g. `sin(p=10, a=2)`).

In the examples below, note how the oscillators' amplitude is set to the linearly interpolated value of the field (`L`), from its initial value of `1` on frame 0, to value `0` on frame 120. This is why the amplitude of the oscillator decreases over time.

| function   |  description  | example   |
|---          |---             |---        |
| `sin()`    | Sine wave oscillator. See below for arguments (only period is required).  | <img width="724" alt="image" src="https://user-images.githubusercontent.com/74455/205226860-26d6f424-db93-4b83-be69-5fa193a73d66.png"> |
| `sq()`    | Square wave oscillator | <img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205227751-b173dc97-f97d-44e2-a208-6e22a344b835.png"> |
| `tri()`   | Triangle wave oscillator.   | <img width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205227903-2c7ebdda-981c-4a78-9a82-7b75ef014499.png"> |
| `saw()`   | Sawtooth wave oscillator.   | <img  width="512" src="https://www.evernote.com/l/APbDR-xZ779Jh431tTc2qEc56-EoMETlb2QB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `pulse()`   | Pulse wave oscillator.   | <img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205228355-863dcf8d-3d10-4d63-9c5f-32ce75e7b8b3.png"> |

Oscillator arguments:

- Period `p` _required_:  The period of the oscillation. By default the unit is frames, but you can specify seconds or beats by appending the appropriate suffix (e.g. `sin(p=4b)` or `sin(p=5s)`).
- Amplitude `a` (default: `1`): The amplitude of the oscillation. `sin(p=4b, a=2)` is equivalent to `sin(p=4b)*2`.
- Phase shift `ps` (default: `0`): The x-axis offset of the oscillation, i.e. how much to subtract from the frame number to get the frame's oscillation x position. A useful value is `-active_keyframe`, which will make the period start from the keyframe position. See below for an illustration.
- Centre `c` (default: `0`): The y-axis offset of the oscillation. `sin(p=4b, c=2)` is equivalent to `sin(p=4b)+2`
- Limit `li` (default: `0`): If >0, limits the number of periods repeated
- Pulse width `pw` (default: `5`): _pulse() function only_ The pulse width.

Examples:
| | |
|---|---
| <img src="https://www.evernote.com/l/APbLSplqegdC77U_AJhyWz977bhQdFscYgUB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />| Defining a sine wave with linearly increasing amplitude using `sin(p=2b, a=L)`, meaning the amplitude is the linear interpolation of the keyframe values.|
| <img src="https://www.evernote.com/l/APZxcomc6UpL0q2HLBC78cwhZjwRHyokJcYB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> | Limiting to 1 period at each keyframe with `li=1`. Notice how the phase is maintained relative to the full sinewave, so the period does not start with the keyframe.|
|<img src="https://www.evernote.com/l/APacHmL0zHtGK6xWrzQKFFLkTSwlAzBzQDwB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />| By setting the phase shift to the negative offset of the active keyframe with `ps=-active_keyframe`, we can ensure the period starts at the keyframe point. |

#### Transition functions

<table>
  <tbody>
    <tr>
      <th>function</th>
      <th>description</th>
      <th>example</th>
    </tr>
    <tr>
      <td>`bez()`</td>
      <td>Bezier curve between previous and next keyframe. All arguments are optional:
         <ul>
            <li>`x1`, `y1`, `x2`, `y2`: control point co-ordinates. Set these explicitly if you don't like any of the pre-defined curves you can set with `c` as described below. https://cubic-bezier.com/ to establish the values . Defaults to `bez(0.5,0,0.5,1)` if none specified.</li>
            <li>`from` or `start`: Starting y position. Ignore the previous keyframe value and start from this value instead.</li>
            <li>`to` or `end`: Ending y position. Ignore the next keyframe value and curve towards this value instead.</li>
            <li>`in`: duration. Ignore the duration between the previous and next keyframe, and draw the curve over this number of frames instead.</li>
            <li>`os`: offset. Ignore how far along the curve the current value is, and use this value instead, where 0 is the start of the curve and 1 is the end of the curve.</li>
            <li>Curve type `c`: a string defining the shape of the curve, e.g. `bez(c="easeOut")`. Supports all values on https://easings.net/ except elastic an bounce, plus some convenience aliases. See [the code for the full list](https://github.com/rewbs/sd-parseq/blob/master/src/parseq-lang/parseq-lang-ast.ts#LL948C18-L948C18). Better documentation with pretty pictures TODO. :) </li>
         </ul>
      </td>
      <td><img  width="512" alt="image" src="https://user-images.githubusercontent.com/74455/205228620-8db81d38-2010-4059-99bc-ed84ec80ffa9.png"></td>
    </tr>
    <tr>
      <td>`slide()`</td>
      <td>Linear slide over a fixed time period. Requires at least one of `to` or `from` parameters (frame value will be used if missing), and `in` parameter defines how long the slide should last. Optional value `os` behaves like offset for `bez()`. See image for 3 examples.</td>
      <td><img width="512" src="https://www.evernote.com/l/APazj_b3MGRHBbDNHi30Imb-ZnCubVFGI7YB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /></td>
    </tr>
  </tbody>
</table>

#### Noise functions

| function   |  description  | example   |
|---          |---             |---        |
| `rand()`     | Returns a random number between `min` and `max` (default 0 and 1), using seed `s` (default current time using high precison timer), holding that value for 'h' frames (default 1). See the image for 3 examples. `prompt_weight_1` changes value between 0 and 1 on every frame and will get a new set of values on every render. `prompt_weight_2` gets a new random value between 1 and 2 every 40 frames, and will also get a new set of values on every render.  `prompt_weight_3` gets a new random value between 2 and 3 every beat, and will use the same series of values on every render. | <img src="https://www.evernote.com/shard/s246/sh/69b7115e-e3af-4561-a1ad-a5050653cd44/xXB0OKsJ9CVaoSZy7lmzGLwZaIxOgTKwRIOKXrnLaWUe3N4gP8LAtCIaaw/deep/0/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />  |
| `smrand()`   | Smooth random function (simplex noise). Arguments are smoothing factor `sm` (higher values mean smoother noise, default 10), `min` (default 0), `max` (default 1) and seed `s` (default current time using high precison timer). Because simplex is inherently a >2D noise generation algorithm, there is also a `y` parameter  (default 0) you can increase by small increments (e.g. 0.05) to slightly alter the overall noise pattern.  |  |
| `perlin()`   | Similar to `smrand()` but using perlin algorithm instead of simplex. | |
| `vibe()`     | Plots points at random intervals and draws bezier curves between them. Takes `min` and `max` to define the value range (defaults 0, 1), `pmin` and `pmax` to define the range of frame-count intervals between points (defaults: 1, 20) or alternatively `p` which overrides `pmin` and `pmax` to the same value, rand seed `s` (default current time using high precison timer), and `c` or `x1,y1,x2,y2` to define the shape of the bezier curve (see `bez()` above).   | |

#### Maths functions

| function   |  description  | example   |
|---          |---             |---        |
| `min()`   | Return the minimum of 2 argument   | <img width="512" src="https://www.evernote.com/l/APZX1k4fvOlJP6eyrKSFaw-9KeonwNkS7tEB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />   |
| `max()`   | Return the maximum of 2 argument   | <img width="512" src="https://www.evernote.com/l/APb9CEaqhEhF6L0FRWovG2Rt-qacyphjc_cB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `abs()`   | Return the asolute value of the argument | <img src="https://www.evernote.com/l/APar6IXJsoxK6LDrTeyeHr9c-42Cnrk05qgB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />   |
| `round()`   | Return the rounded value of the argument. Second argument specifies precision (default: 0). | <img src="https://www.evernote.com/l/APZWLyA1YPVMWao-Zke_v7X2adVxjk_0rEoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />   |
| `floor()`   | Return the value of the argument rounded down.  Second argument specifies precision (default: 0). | |
| `ceil()`   | Return the value of the argument rounded up.  Second argument specifies precision (default: 0). | |

#### Javascript maths functions

A range of methods from the Javascript [Math object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) are exposed as follows, with a `_` prefix.

Note that unlike the `sin()` oscillator above, these functions are **not oscillators**: they are simple functions.

| function  | description | example |
|-----------|-------------|---------|
| `_acos()` | Equivalent to Javascript's [Math.acos()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos)| |
| `_acosh()` | Equivalent to Javascript's [Math.acosh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh)| |
| `_asin()` | Equivalent to Javascript's [Math.asin()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asin)| |
| `_asinh()` | Equivalent to Javascript's [Math.asinh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asinh)| |
| `_atan()` | Equivalent to Javascript's [Math.atan()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan)| |
| `_atanh()` | Equivalent to Javascript's [Math.atanh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh)| |
| `_cbrt()` | Equivalent to Javascript's [Math.cbrt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt)| |
| `_clz32()` | Equivalent to Javascript's [Math.clz32()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32)| |
| `_cos()` | Equivalent to Javascript's [Math.cos()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos)| |
| `_cosh()` | Equivalent to Javascript's [Math.cosh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh)| |
| `_exp()` | Equivalent to Javascript's [Math.exp()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp)| |
| `_expm1()` | Equivalent to Javascript's [Math.expm1()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1)| |
| `_log()` | Equivalent to Javascript's [Math.log()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log)| |
| `_log10()` | Equivalent to Javascript's [Math.log10()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10)| |
| `_log1p()` | Equivalent to Javascript's [Math.log1p()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p)| |
| `_log2()` | Equivalent to Javascript's [Math.log2()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2)| |
| `_sign()` | Equivalent to Javascript's [Math.sign()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign)| |
| `_sinh()` | Equivalent to Javascript's [Math.sinh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh)| |
| `_sqrt()` | Equivalent to Javascript's [Math.sqrt()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt)| |
| `_tan()` | Equivalent to Javascript's [Math.tan()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tan)| |
| `_tanh()` | Equivalent to Javascript's [Math.tanh()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tanh)| |
| `_sin()` | Equivalent to Javascript's [Math.sin()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin)| |

#### Info text matching functions

All keyframes have an optional "info" field which can hold an arbitrary string. You can query these from your expressions. For example, you can use functions to check whether the text of the current keyframe matches a regex,  or to count how many past keyframes contained a given substring, or look forwards to when the next keyframe with a given string will occur.

| function   |  description  | example   |
|---          |---             |---        |
| `info_match()` | Takes a **regular expression** as an argument. Returns 1 if the info label of the current active kefframe matches the regex, 0 otherwise.  | <img src="https://www.evernote.com/l/APbS0YKyh2ZHw7ZKEIwCvRTyjIMGL5h2ZNkB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `info_match_count()` | Takes a **regular expression** as an argument. Returns the number of keyframes that have info labels that matched the regex so far. | <img src="https://www.evernote.com/l/APaln7KfMdNNwI1I6vKNwORBzE0Br_BfTxYB/image.png" alt="Cursor%20and%20Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `info_match_last()` | Takes a **regular expression** as an argument. Returns the frame number of the previous keyframe that matched the regex, the current frame number if it is a matching keyframe, or -1 if none.  | <img src="https://www.evernote.com/l/APajGqQUxC5Jnr4trTPzpkLXXevQyIFRVqoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |
| `info_match_next()` | Takes a **regular expression** as an argument. Returns the frame number of the next keyframe that matches the regex, or -1 if none.  | <img src="https://www.evernote.com/l/APajGqQUxC5Jnr4trTPzpkLXXevQyIFRVqoB/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" /> |

#### Prompt manipulation functions

Prompts can include any Parseq expression. For example, the following is a valid prompt using a conditional, the prompt weight operator `:` and string concatenation `+`:

```php
A painting of 
${
 if (f<10)
   "a cat":prompt_weight_1
 else
   "a dog":prompt_weight_2 + " with floppy ears"
}
, highly detailed
```

On frames less than 10, it will produce a rendered prompt like `A painting of (a cat:0.45), highly detailed`, and on frames 10 and above, it will yield `A painting of (a dog:0.45) with floppy ears, highly detailed`.

Note that if you want to ensure something does _not_ appear in your generated image, giving it a negative weight in the positive prompt is generally not sufficient: you need to put the term in the negative prompt.
Therefore, if you want something to appear then disappear, it becomes necessary to "move" it between the positive and negative prompts. This can be done with conditionals, but the following functions make it easier.

| function  |  description | example  |
|---         |---            |---        |
| `posneg(<term>, <weight>)` | `<term>` must evaluate to a string and `<weight>` to a number.  Automatically shuffle a term between the positive and negative prompt depending on the weight. For example,  if `posneg("cat", prompt_weight_1)` is in the positive prompt, frames on which `prompt_weight_1` are positive will have (cat:abs(prompt_weight_1)) in the positive prompt, and frames on which  `prompt_weight_1` is negative  will have (cat:abs(prompt_weight_1)) in the negative prompt. | See [this example video on Youtube](https://www.youtube.com/watch?v=fgiev3A93RU). The video description includes a link to the parseq document.  |
| `posneg_lora(<lora_name>, <weight>)` | Same as above but for loras. `posneg("Smoke", prompt_weight_1)` evaluates to `<"lora":"Smoke":prompt_weight_1>` | See [this example video on Youtube](https://www.youtube.com/watch?v=fgiev3A93RU). The video description includes a link to the parseq document. |

 See also the `:` operator above.

### Working with time & beats (audio synchronisation)

Parseq has a range of features to help you create animations with precisely-timed parameter fluctuations, for example for music synchronisation.

#### Beats per minute and frames per second

Parseq allows you to specify Frames per second (FPS) and beats per minute (BPM) which are used to map frame numbers to time and beat offsets. For example, if you set FPS to 10 and BPM to 120, a tooltip when you hover over frame 40 (in the grid or the graph) will show that this frame will occur 4 seconds or 8 beats into the video.

Furthermore, your interpolation formulae can reference beats and seconds by using the `b` and `s` suffixes on numbers. For example, here we define a sine oscillator of a period of 1 beat (in green), and a pulse oscillator with a period of 5s and a pulse width of 0.5s (in grey):

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205224573-9f89518b-a4a8-4a71-86f9-388d0f65c2db.png">

#### Locking keyframes to beats or seconds

<img src="https://www.evernote.com/shard/s246/sh/0182b1e1-92d9-4516-b376-ef422eec19f2/bUIDQQeKqUfFnUacaQR38X_qrbhWKKfOzmBnvM_lGuQzp9fEHtYpOxBzcQ/deep/0/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

By default, keyframe positions are defined in terms of their frame number, which will remain fixed even if the FPS or BPM changes. For example, if you start at 10fps and create a keyframe on the 4th beat of a 120BPM track, the keyframe will be at frame 20. But if you decide the change to 20fps and update your track to be 140BPM, your animation will be out-of-sync because the 4th beat should now be on frame 34!

To solve this, you can lock your keyframes to their beat (or second) position. After doing this, they will remain in-sync even when you change FPS or BPM.

#### Interval keyframe creation

You can quickly create keyframes aligned with regular events by using the "at intervals" tab of the Add keyframe dialog. For example, here we are creating a keyframe at every beat position for the first 8 beats. The keyframe positions will be determined by using the document's BPM and FPS. Note that only 6 keyframes will be created, because keyframes already exist for beats 0 and 4:

<img src="https://www.evernote.com/shard/s246/sh/a99f482f-5001-4a40-b385-2e6c86ef88d1/gX5DMeXy4s9nTO4U9O15HDQ0MD9r3-gTFqVvE4TzM2KSJmL19-kjjvVCWQ/deep/0/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

#### Keyframe labelling

A common practice is to label keyframes to indicate the audio event they represent (e.g. "bassdrum", "snare", etc...). You can then reference all such keyframes in interpolation formulae with functions like `info_match_last()`, `info_match_next()` and `info_match_count()`, as well as in the bulk edit dialog.

#### Reference audio

To help you align your keyframes and formula with audio, you can load an audio file to view its waveform alongside the your parameter graph. Zooming and panning the graph will apply to the audio (click and drag to pan, hold alt/option and mouse wheel to zoom). Scrolling the audio will pan the graph. A viewport control is available between the graph and audio. Prompt, beat and cursor markers are displayed on both visualisations.

<https://user-images.githubusercontent.com/74455/228865210-be0a3202-3c9e-4037-8d9f-cd5bb3c8fd65.mp4>

#### Automatically generating keyframes from audio events

Manually creating and labelling keyframes for audio events can be tedious. Parseq improves this with an audio event detection feature that uses [AubioJS](https://github.com/qiuxiang/aubiojs):

<img src="https://www.evernote.com/shard/s246/sh/8ee1d729-c3f5-40db-9f2e-153124833843/SLBBwnBxWTtF4tv2230ZPNptdNn0QSYjRAZe-4NJmWviLwnlW7KRZGtwtg/deep/0/image.png" alt="Parseq%20-%20parameter%20sequencer%20for%20Stable%20Diffusion" />

After loading a reference audio file, head to the event detection tab under the waveform and hit detect events. Markers will appear on the waveform indicating detected event positions.

You can tweak the event detection by controlling the following:

- Filtering: above the waveform and to the right is a biquad filter that allows you to apply a low/band/high-pass filter to your audio. This will enable you, for example, to isolate bassdrums from snares.
- Method: a range of event detection algorithms to choose from. Experiment with these, as they can produce vastly different results. See the [aubioonset CLI docs](https://aubio.org/manual/latest/cli.html#aubioonset) for more details.
- Threshold: defines how picky to be when identifying onset events. Lower threshold values result in more events, high values result in fewer events.
- Silence: from aubio docs: "volume in dB under which the onset will not be detected. A value of -20.0 would eliminate most onsets but the loudest ones. A value of -90.0 would select all onsets."

Once you're satisfied with the detected events, you can create keyframes by switching to the keyframe generation tab. You can pick a custom label that will be assigned to all newly generated keyframes. If a keyframe already exists at an event position, the label will be combined with the existing label.

See event detection and keyframe generation in action [in this tutorial](https://youtu.be/M6Z-kD2HnDQ?t=276).

#### Sync'ing to pitch and amplitude using time series

Time series are a powerful feature of Parseq that allows you to import any series of numbers and reference them from Parseq formulas. A primary use case for this is to sync parameter changes to audio pitch or amplitude.

Click 'Add time series' and select an audio file to work with. You can then choose whether to extract pitch or amplitude. When extracting pitch, you can choose from a range of methods (see the [aubiopitch CLI docs](https://aubio.org/manual/latest/cli.html#aubiopitch) for details).

A biquad filter that allows you to apply a low/band/high-pass filter to your audio is available if you wish to pre-process it before performing the pitch/amplitude extraction.

After extracting the data, you can post-process it to take the absolute value, exclude datapoints outside a given range, clamp datapoints outside a given range, and normalise to a target range.

Using absolute value is particularly valuable for amplitude, where the unprocessed amplitude will oscillate between positive and negative.

<img src="https://www.evernote.com/shard/s246/sh/8eca1310-b43f-42ad-8168-08422a03cec4/r53xto88ZfFPS3Rypni87mTiZSxaZzVihodPGyvsDT4LKZAvEdwF2yUNjQ/deep/0/image.png"  />

<img src="https://www.evernote.com/shard/s246/sh/32879f38-2798-4c29-bfa1-408966698972/CVVh1WIZVdrMJH7-C4UY8er4TWlwpkNlq3A6EZNg7uDfqSgtTwsBDtteTg/deep/0/image.png"  />

The final timeseries will be decimated to a maximum of 2000 points. The green dots represent where frames land on those points.

Once the time series are created, you can chose an alias for them, and then reference them in your formula.

<img src="https://www.evernote.com/shard/s246/sh/9ab5eefe-d6c1-4dc6-a981-06ede104c060/FDDtn5KQzOt1lGKiVHJfLdE7UxPjsyyccRyHPHXvjgtT99PKSSa6C4Cn9g/deep/0/image.png" />

There are two ways to reference timeseries:

| Method | Description | Example
|--- |--- |--- |
| `timeseries_name` | Returns the timeseries value at the current frame. Equivalent to `timeseries_name(f)`  | Time series replicated as is: <img src="https://www.evernote.com/shard/s246/sh/557e3964-d04c-4a3f-9e43-d875e51b29ee/ltBcQACTY9QD73JwjB2Txos9-v4Mu833zCuNvuqZEDabcT0clogIzH0mJQ/deep/0/image.png" /> |
| `timeseries_name(n)` | Returns the timeseries value at frame n  | Time series' first 10 frames repeated: <img src="https://www.evernote.com/shard/s246/sh/5719a37e-1037-49dd-9117-053483427c58/4yetefWaeAhBaCPldyouDmQ-GNOkgufLA0F3xdPSpQcDCcghk06XL0MBMg/deep/0/image.png" /> |

See pitch detection in action [in this tutorial](https://youtu.be/M6Z-kD2HnDQ?t=880).

#### Legacy Audio Analyser

This feature is deprecated. See its [archived documentation on the Parseq wiki](https://github.com/rewbs/sd-parseq/wiki/Legacy-Audio-Analyser-documentation).

### Time series for arbtrary data sequences

In addition to audio pitch and amplitude data, you can also load any CSV as a timeseries. This means you can import essentially any series of numbers for use in Parseq.

The format of the CSV file must be `timestamp,value` on each row. You can choose whether the timestamp represents milliseconds or frames before you import the file.

For example, here we have imported data given to us by ChatGPT 4 the after asking the following:

> Please generate CSV output in the format x,y , where x is a number increasing by 1 from 0 to 100, and the y value draws a simple city skyline.  Output only the CSV data, do not provide any explanation.

<img width="400" alt="image" src="https://github.com/rewbs/sd-parseq/assets/74455/7d6bc4c8-e765-4fa4-be43-b444b3cfea01">

### Camera movement preview

Parseq has an experimental feature that enables you to visualise your camera movements in real time. It is inspired by [AnimationPreview by @pharmapsychotic
](https://colab.research.google.com/github/pharmapsychotic/ai-notebooks/blob/main/pharmapsychotic_AnimationPreview.ipynb).

It currently has a few caveats:

- It is a rough reference only: the image warping algorithm is not identical to Deforum's.
- It currently only works for 3D animation params (x, y, z translation and 3d rotation).
- It does not factor in FPS or perspective params (fov, near, far).

Nonetheless, it is quite useful to get a general sense of what your movement params are going to do:

<https://github.com/rewbs/sd-parseq/assets/74455/03a18a78-e804-4e90-a061-1d9c1d063564>

## Deforum integration features

Parseq can be used with **all** Deforum animation modes (2D, 3D, prompt interpolation, video etc...). You don't need to do anything special in Parseq to switch between modes: simply tweak the parameters you're interested in.

### Keyframable parameters

Here are the parameters that Parseq can control. You can select which ones are controlled by your document in the 'Managed Fields' section. Any 'Managed Fields' for which you also set values in the A1111 UI for Deforum will be overridden by Parseq. On the other hand, fields you don't select in 'Managed fields' can be controlled from the Deforum UI as normal. So you can 'mix & match' Parseq-controlled values with Deforum-controlled values.

Stable diffusion generation parameters:

- seed
- scale (CFG)
- noise: additional noise to add during generation, can help
- strength: how much the last generated image should influence the current generation

2D animation parameters:

- angle (ignored in 3D animation mode, use rotation 3D z axis)
- zoom (ignored in 3D animation mode, use rotation translation z)
- translation x axis
- translation y axis

Pseudo-3D animation parameters (ignored in 3D animation mode):

- perspective theta angle
- perspective phi angle
- perspective gamma angle
- perspective field of view

3D animation parameters (all ignored in 2D animation mode):

- translation z axis
- rotation 3d x axis
- rotation_3d y axis
- rotation_3d z axis
- field of view
- near point
- far point

Anti-blur parameters:

- antiblur_kernel
- antiblur_sigma
- antiblur_amount
- antiblur_threshold

Hybrid video parameters:

- hybrid_comp_alpha
- hybrid_comp_mask_blend_alpha
- hybrid_comp_mask_contrast
- hybrid_comp_mask_auto_contrast_cutoff_low
- hybrid_comp_mask_auto_contrast_cutoff_high

Other parameters:

- contrast: factor by which to adjust the previous last generated image's contrast before feeding to the current generation. 1 is no change, <1 lowers contrast, >1 increases contract.

### Prompt manipulation

Parseq provides a further 8 keyframable parameters (`prompt_weight_1` to `prompt_weight_8`) that you can reference in your prompts, and can therefore be used as prompts weights. You can use any prompt format that will be recognised by a1111, keeping in mind that anything enclosed in `${...}` will be evaluated as a Parseq expression.

For example, here's a positive prompt that uses [Composable Diffusion](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Features#composable-diffusion) to interpolate between faces:

```php
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

```php
(Jennifer Aniston:${prompt_weight_1}), (Brad Pitt:${prompt_weight_2}), (Ben Affleck:${prompt_weight_3}), (Gwyneth Paltrow:${prompt_weight_4}), (Zac Efron:${prompt_weight_5}), (Clint Eastwood:${prompt_weight_6}), (Jennifer Lawrence:${prompt_weight_7}), (Jude Law:${prompt_weight_8}), centered, high detail studio photo portrait 
```

A corresponding parameter flow could look like this:

<img width="500" alt="image" src="https://user-images.githubusercontent.com/74455/205405460-2f9ed10c-0df4-4e4e-8c4f-d68c1c6ceccf.png">

Note that any Parseq expression can be used, so for example the following will alternate between cat and dog on each beat:

```php
Detailed photo of a ${if (floor(b%2)==0) "cat" else "dog"} 
```

Some important notes:

- Remember that unless you set `strength` to `0`, prior frames influence the current frame in addition to the prompt, so previous items won't disappear immediately even if they are removed from the prompt on a given frame.
- To counter-act this, you may wish to put terms you _don't_ wish to see at a given frame in your negative prompt too, with inverted weights.

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

## Working with large number of frames (performance tips)

Parseq can become slow when working with a large number of frames. If you see performance degradations, try the following:

- In the Managed Fields section, select only the fields you want to control with Parseq.
- Close the sections you're not using. For example, if you're not using Sparklines or the test Output view, close them using the ^ next to the section title.
- Hide the fields you're not actively working with by unselecting them in the "show/hide fields" selection box (or toggle them by clicking their sparklines).
- Disable autorender (and remember to manually hit the render button every few changes).
- Note that the graph becomes uneditable when displaying more than 1000 frames, and does not show keyframes. To restore editing, zoom in to a section less than 1000 frames.

## Development & running locally

Parseq is currently a front-end React app. It is part way through a conversion from Javascript to Typescript. There is currently very little back-end: by default, persistence is entirely in browser indexdb storage via [Dexie.js](https://dexie.org/). Signed-in users can optionally upload data to a Firebase-backed datastore.

You'll need `node` and `npm` on your system before you get started.

If you want to dive in:

- Run `npm install` to pull dependencies.
- Run `npm start` to run the Parseq UI locally in dev mode on port 3000. You can now access the UI on `localhost:3000`. Code changes should be hot-reloaded.

### Deployment

Hosting & deployment is done using Firebase. Merges to master are automatically deployed to the staging channel. PRs are automatically deployed to the dev channel. There is currently no automated post-deployment verification or promotion to prod.

Assuming you have the right permissions, you can view active deployements with:

```bash
firebase hosting:channel:list
```

And promote from staging to prod with:

```bash
firebase hosting:clone sd-parseq:staging sd-parseq:live
```

## Credits

This script includes ideas and code sourced from many other scripts. Thanks in particular to the following sources of support and inspiration:

- Everyone supporting [Parseq on Patreon](https://www.patreon.com/rewbs), including: Adam Sinclair, MJ, AndyXT, King Kush, Ben Del Vacchio, Zirteq, Kewk, BinaryLady at TheTechMargin, ascendant, Sasha Agafonoff, Brandon Glasgow, Koshi Mazaki, lexvesseur, Andreas Lewitzki, veryVANYA, Nenad Kuzmanovic, Stash
- Everyone who has [bought me a coffee](https://www.buymeacoffee.com/rewbs)!
- Everyone who has contributed to the [A1111 web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
- Everyone who has contributed to [Deforum](https://github.com/deforum-art/)
- Everyone trying out Parseq and giving feedback on Discord
- Everyone behind [Aubio](https://aubio.org/), [AubioJS](https://github.com/qiuxiang/aubiojs), [Wavesurfer](https://wavesurfer-js.org/),  [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor), [ag-grid](https://www.ag-grid.com/) (community edition), p5, chart.js and recharts.
- The following scripts and their authors from whom I picked up some good ideas when I was starting out:
  - Filarus for their [vid2vid script](https://github.com/Filarius/stable-diffusion-webui/blob/master/scripts/vid2vid.py).  
  - Animator-Anon for their [animation script](https://github.com/Animator-Anon/Animator/blob/main/animation.py).
  - Yownas for their [seed travelling script](https://github.com/yownas/seed_travel)
  - feffy380 for the [prompt-morph script](https://github.com/feffy380/prompt-morph)
  - eborboihuc for the [clear implementation of 3d rotations using `cv2.warpPerspective()`](https://github.com/eborboihuc/rotate_3d/blob/master/image_transformer.py)
