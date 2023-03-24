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

export function frameToBeat(frame: number, fps: number, bpm: number): number {
    return frame / ((fps * 60) / bpm);
}

export function frameToSec(frame: number, fps: number): number {
    return frame / fps;
}