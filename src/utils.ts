import packageJson from '../package.json';
import { defaultFields } from './data/fields';

export const fieldNametoRGBa = (str: string, alpha: number): string => {
  const rgb = defaultFields.find((field) => field.name === str)?.color || [0, 0, 0];
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

export function frameToBeats(frame: number, fps: number, bpm: number): number {
  return frame / fps / 60 * bpm;
}

export function frameToSeconds(frame: number, fps: number): number {
  return frame / fps
}

export function toFixedNumber(num: number, digits: number, base: number): number {
  var pow = Math.pow(base || 10, digits);
  return Math.round(num * pow) / pow;
}

export function toFixedFloor(num: number, digits: number, base: number): number {
  var pow = Math.pow(base || 10, digits);
  return Math.floor(num * pow) / pow;
}

export function toFixedCeil(num: number, digits: number, base: number): number {
  var pow = Math.pow(base || 10, digits);
  return Math.ceil(num * pow) / pow;
}


export function isValidNumber(toTest : any) {
  return toTest !== undefined 
    && toTest !== ""
    && !isNaN(toTest);
}

export function getUTCTimeStamp() {
  return new Date().toUTCString();
}

export function getVersionNumber() {
  return packageJson.version;
}

export function percentageToColor(percentage:number, maxHue = 120, minHue = 0, alpha=1) {
  const hue = percentage * (maxHue - minHue) + minHue;
  return `hsla(${hue}, 100%, 50%, ${alpha})`;
}