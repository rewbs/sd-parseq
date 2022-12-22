/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * A noise generator with a gain AudioParam.
 *
 * @class NoiseGenerator
 * @extends AudioWorkletProcessor
 */
class NoiseGenerator extends AudioWorkletProcessor {
    constructor() {
        super();
        this.isPlaying = true;
        this.port.onmessage = this.onmessage.bind(this)
    }
    static get parameterDescriptors() {
        return [{ name: 'amplitude', defaultValue: 0.25, minValue: 0, maxValue: 1 }];
    }

    onmessage(event) {
        const { data } = event;
        this.isPlaying = data;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const amplitude = parameters.amplitude;
        const isAmplitudeConstant = amplitude.length === 1;

        // for (let channel = 0; channel < output.length; ++channel) {
        //     const inputChannel = input[channel];
        //     const outputChannel = output[channel];
        //     for (let i = 0; i < outputChannel.length; ++i) {
        //         outputChannel[i] = inputChannel[i] + 2 * (Math.random() - 0.5) * (isAmplitudeConstant ? amplitude[0] : amplitude[i]);
        //     }
        // }

        return this.isPlaying;
    }
}

registerProcessor('noise-generator', NoiseGenerator);