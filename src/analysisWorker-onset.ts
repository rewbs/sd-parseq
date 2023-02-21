// TODO - convert to typescript

import aubio, { Onset } from "aubiojs";

const run = (onset : Onset, bufferToAnalyse : Float32Array, hopSize : number) => {
    var startPos = 0;
    while (startPos + hopSize <= bufferToAnalyse.length) {
        const endPos = startPos + hopSize;
        const retval = onset.do(bufferToAnalyse.subarray(startPos, endPos));
        if (retval) {
            postMessage({
                status: "processing",
                progress: startPos / bufferToAnalyse.length,
                eventS: onset.getLastS()
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
        //@ts-ignore - typechecker thinks onset() only takes 3 args, but it needs 4. Possile bug in aubiojs typedefs?
        const onset = new aubio.Onset(e.data.method, e.data.bufferSize, e.data.hopSize, e.data.sampleRate);
        onset.setSilence(e.data.silence);
        onset.setThreshold(e.data.threshold);
        
        //@ts-ignore - TODO: this method is not exposed. Possibly a bug in aubiojs?
        //onset.setAwhitening(e.data.awhitening);
        //onset.setMinoi(e.data.minoi);
        
        run(onset, e.data.buffer, e.data.hopSize);
    });
}