import aubio, { Pitch } from "aubiojs";

const run = (pitch : Pitch, bufferToAnalyse : Float32Array, hopSize : number) => {
    var startPos = 0;
    while (startPos + hopSize <= bufferToAnalyse.length) {
        const endPos = startPos + hopSize;
        const retval = pitch.do(bufferToAnalyse.subarray(startPos, endPos));

        if (retval) {
            postMessage({
                status: "processing",
                progress: startPos / bufferToAnalyse.length,
                pitchHz: retval                
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
        const pitch = new aubio.Pitch(e.data.method, e.data.bufferSize, e.data.hopSize, e.data.sampleRate);
        
        //@ts-ignore - method missing in aubiojs typedefs. Possibly a bug?
        //pitch.setTolerance(pitchTolerance);

        run(pitch, e.data.buffer, e.data.hopSize);
    });
}