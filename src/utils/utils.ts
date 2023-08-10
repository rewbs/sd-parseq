import _ from 'lodash';
import packageJson from '../../package.json';
import { defaultFields } from '../data/fields';
import type { ParseqKeyframe, DocId, VersionId, ParseqPersistableState } from '../ParseqUI.d.ts';

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

export const base64_arraybuffer = async (data : Uint8Array) => {
  // Use a FileReader to generate a base64 data URI
  const base64url : string = await new Promise((r) => {
      const reader = new FileReader();
      reader.onload = () => r(reader.result as string);
      reader.readAsDataURL(new Blob([data]));
  })

  /*
  The result looks like 
  "data:application/octet-stream;base64,<your base64 data>", 
  so we split off the beginning:
  */
  return base64url.substring(base64url.indexOf(',')+1)
}

export function createAudioBufferCopy(audioBuffer: AudioBuffer): AudioBuffer {
  const context = new AudioContext();
  const newBuffer = context.createBuffer(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const channelData = new Float32Array(audioBuffer.length);
    audioBuffer.copyFromChannel(channelData, i);
    newBuffer.copyToChannel(channelData, i);
  }
  return newBuffer;
}

export function deleteQsParams(qsParamsToDelete: string[]) {
  const url = new URL(window.location.toString());
  qsParamsToDelete.forEach(p => url.searchParams.delete(p));
  window.history.replaceState({}, '', url);
}

export const channelToRgba = (channel: string, alpha: number): string => {
  //return `rgba(${channel.replaceAll(' ', ',')}, ${alpha})`
  return `rgba(${channel} / ${alpha})`
}

    //TODO this'll be slow, especially for for large timeSeries. Consider making timeseries objects immutable and doing comparison by reference.
export const compareParseqDocState = (a: ParseqPersistableState, b: ParseqPersistableState): string[] => {
      return Object.keys(a)
          .filter((k) => !['meta', 'timestamp', 'versionId', 'changes', 'docId'].includes(k)) // exclude these fields they are expected to change.
          .flatMap((k) => _.isEqual(a[k as keyof ParseqPersistableState], b[k as keyof ParseqPersistableState]) ? [] : [k]);
  } 


// From  https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download
// Returns Uint8Array of WAV bytes
export function getWavBytes(buffer: ArrayBuffer, options: { numChannels: number; sampleRate: number; isFloat: boolean; }) {
  const type = options.isFloat ? Float32Array : Uint16Array
  const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT

  const headerBytes = getWavHeader({...options, numFrames });
  const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

  // prepend header, then add pcmBytes
  wavBytes.set(headerBytes, 0)
  wavBytes.set(new Uint8Array(buffer), headerBytes.length)

  return wavBytes
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
export function getWavHeader(options: { numFrames: number; numChannels: number; sampleRate: number; isFloat: boolean; }) {
  const numFrames = options.numFrames;
  const numChannels = options.numChannels || 2;
  const sampleRate = options.sampleRate || 44100;
  const bytesPerSample = options.isFloat? 4 : 2;
  const format = options.isFloat? 3 : 1;

  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numFrames * blockAlign;

  const buffer = new ArrayBuffer(44);
  const dv = new DataView(buffer);

  let p = 0;

  function writeString(s : string) {
    for (let i = 0; i < s.length; i++) {
      dv.setUint8(p + i, s.charCodeAt(i));
    }
    p += s.length;
  }

  function writeUint32(d : number) {
    dv.setUint32(p, d, true);
    p += 4;
  }

  function writeUint16(d : number) {
    dv.setUint16(p, d, true);
    p += 2;
  }

  writeString('RIFF');              // ChunkID
  writeUint32(dataSize + 36);      // ChunkSize
  writeString('WAVE');              // Format
  writeString('fmt ');              // Subchunk1ID
  writeUint32(16);                  // Subchunk1Size
  writeUint16(format);              // AudioFormat https://i.stack.imgur.com/BuSmb.png
  writeUint16(numChannels);         // NumChannels
  writeUint32(sampleRate);          // SampleRate
  writeUint32(byteRate);            // ByteRate
  writeUint16(blockAlign);          // BlockAlign
  writeUint16(bytesPerSample * 8);  // BitsPerSample
  writeString('data');              // Subchunk2ID
  writeUint32(dataSize);            // Subchunk2Size

  return new Uint8Array(buffer)
}