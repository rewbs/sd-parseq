import aubio, { Tempo } from "aubiojs";

const run = (tempo: Tempo, bufferToAnalyse: Float32Array, hopSize: number) => {
    var startPos = 0;
    while (startPos + hopSize <= bufferToAnalyse.length) {
        const endPos = startPos + hopSize;
        const retval = tempo.do(bufferToAnalyse.subarray(startPos, endPos));
        const bpm = tempo.getBpm();
        // HACK - in my experience, aubio overshoots the bpm by a factor of 1% of the bpm at hop size 768.
        // The error margin decreases with lower hop sizes and lower BPMs.
        const fudgedBpm = bpm * (1 - (bpm / 95 / 100) * (hopSize / 512));
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
    });

}

onmessage = (e) => {
    aubio().then(async (aubio) => {
        const tempo = new aubio.Tempo(e.data.bufferSize, e.data.hopSize, e.data.sampleRate);
        run(tempo, e.data.buffer, e.data.hopSize);
    });
}