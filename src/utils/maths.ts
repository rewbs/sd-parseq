export function frameToBeats(frame: number, fps: number, bpm: number): number {
    return frame / fps / 60 * bpm;
}

export function frameToSeconds(frame: number, fps: number): number {
    return frame / fps
}

export function toFixedNumber(num: number, digits: number, base?: number): number {
    var pow = Math.pow(base || 10, digits);
    return Math.round(num * pow) / pow;
}

export function toFixedFloor(num: number, digits: number, base?: number): number {
    var pow = Math.pow(base || 10, digits);
    return Math.floor(num * pow) / pow;
}

export function toFixedCeil(num: number, digits: number, base?: number): number {
    var pow = Math.pow(base || 10, digits);
    return Math.ceil(num * pow) / pow;
}

export function isValidNumber(toTest: any) {
    return toTest !== undefined
        && toTest !== ""
        && !isNaN(toTest);
}

export function frameToXAxisType(frame : number, xaxisType: "frames" | "seconds" | "beats", fps: number, bpm: number) {
    switch (xaxisType) {
        case "frames":
            return frame.toFixed(0);
        case "seconds":
            return frameToSec(frame, fps).toFixed(3);
        case "beats":
            return frameToBeat(frame, fps, bpm).toFixed(2);
    }
}

export function frameToBeat(frame: number, fps: number, bpm: number): number {
    return frame / ((fps * 60) / bpm);
}

export function frameToSec(frame: number, fps: number): number {
    return frame / fps;
}