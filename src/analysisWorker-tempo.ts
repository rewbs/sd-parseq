// TODO - convert to typescript

import aubio, { Tempo } from "aubiojs";

const run = (tempo : Tempo, bufferToAnalyse : Float32Array, hopSize : number) => {
    var startPos = 0;
    while (startPos + hopSize <= bufferToAnalyse.length) {
        const endPos = startPos + hopSize;
        const retval = tempo.do(bufferToAnalyse.subarray(startPos, endPos));
        const bpm = tempo.getBpm();
        const fudgedBpm = bpm * (1 - bpm / 200 / 100);
        const confidence = tempo.getConfidence();

        if (retval) {
            postMessage({
                status: "processing",
                progress: startPos / bufferToAnalyse.length,
                bpm: bpm,
                fudgedBpm: fudgedBpm,
                confidence: confidence,
            });
        }

        startPos += hopSize;        
    }

    postMessage({
        status: "done",
        progress: 1
    } );

}

onmessage = (e) => {
    aubio().then(async (aubio) => {
        const tempo = new aubio.Tempo(e.data.bufferSize, e.data.hopSize, e.data.sampleRate);
        run(tempo, e.data.buffer, e.data.hopSize);
    });
}