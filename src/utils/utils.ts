import packageJson from '../../package.json';
import { defaultFields } from '../data/fields';
import type { ParseqKeyframe, DocId, VersionId } from '../ParseqUI.d.ts';

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

export function getOutputTruncationLimit() {
  return 1000*1000;
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


export function queryStringGetOrCreate(key : string, creator : () => string) {
  let qps = new URLSearchParams(window.location.search);
  let val = qps.get(key);
  if (val) {
    return val;
  } else {
    val = creator();
    qps.set(key, val);
    window.history.replaceState({}, '', `${window.location.pathname}?${qps.toString()}`);
    return val;
  }
}

export const findMatchingKeyframes = (keyframes: ParseqKeyframe[], filter: string, method: 'is' | 'regex', field: string, fieldType?: "value" | "interpolation") => {
  let regex : RegExp;
  try {
    regex = new RegExp(filter);
  } catch (e) {
    if (method === 'regex') {
      return [];
    }
  }
  return keyframes.filter((keyframe) => {
      const subject = String(fieldType === "interpolation" ? keyframe[field+'_i'] : keyframe[field]);
      if (method === 'is') {
          return subject === filter;
      } else {
          return regex.test(subject);
      }
  }).filter((x) => x !== null);
}

export function unique(value : number, index : number, array : number[]) {
  return array.indexOf(value) === index;
}

export function smartTrim(string : string, maxLength : number) {
  if (!string) return string;
  if (maxLength < 1) return string;
  if (string.length <= maxLength) return string;
  if (maxLength === 1) return string.substring(0,1) + '...';

  var midpoint = Math.ceil(string.length / 2);
  var toremove = string.length - maxLength;
  var lstrip = Math.ceil(toremove/2);
  var rstrip = toremove - lstrip;
  return string.substring(0, midpoint-lstrip) + '...' 
  + string.substring(midpoint+rstrip);
}   


export function navigateToDocId(selectedDocIdForLoad: DocId, extraParams?:{k:string,v:string}[]) {
  const qps = new URLSearchParams(window.location.search);
  qps.delete("docId");
  qps.delete("copyLocalDoc");
  qps.delete("copyLocalVersion");
  qps.delete("templateId");
  qps.set("docId", selectedDocIdForLoad);
  if (extraParams) {
    for (const {k,v} of extraParams) {
      qps.set(k,v);
    }
  }
  const newUrl = window.location.href.split("?")[0] + "?" + qps.toString();
  window.location.assign(newUrl);
}

export function navigateToClone(docToClone: DocId, versionToClone: VersionId | undefined) {
  const qps = new URLSearchParams(window.location.search);
  qps.delete("docId");
  qps.set("copyLocalDoc", docToClone);
  if (versionToClone) {
    qps.set("copyLocalVersion", versionToClone);
  }
  const newUrl = "/?" + qps.toString();
  window.location.assign(newUrl);
}

export function navigateToTemplateId(selectedTemplateId: string) {
  const qps = new URLSearchParams(window.location.search);
  qps.delete("templateId");
  qps.delete("docId");
  qps.set("templateId", selectedTemplateId);
  const newUrl = window.location.href.split("?")[0] + "?" + qps.toString();
  window.location.assign(newUrl);
}