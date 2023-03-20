import packageJson from '../../package.json';
import { defaultFields } from '../data/fields';

export const fieldNametoRGBa = (str: string, alpha: number): string => {
  const rgb = defaultFields.find((field) => field.name === str)?.color || [0, 0, 0];
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
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

export function isDefinedField(toTest: any) {
  return toTest !== undefined
      && toTest !== null
      && toTest !== "";
}