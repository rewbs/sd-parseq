declare module 'uuid4';
declare module 'lodash.debounce';
declare module 'chartjs-plugin-crosshair';
declare module 'react-copy-to-clipboard';


type ParseqMetadata = {
    docName?: string;
    generated_by: string;
    version: string;
    generated_at: string;
};

type DocId = string & { _docIdBrand: undefined };
type VersionId = string & { _versionIdBrand: undefined };

type ParseqDoc = {
    docId: DocID,
    name: string,
}

type ParseqPersistableState = {
    meta: ParseqMetadata;
    options: ParseqOptions;
    displayFields?: string[];
    prompts: ParseqPrompts;
    keyframes: ParseqKeyframes;
}

type ParseqDocVersion = ParseqPersistableState & {
    versionId: VersionId,
    docId: DocID;
    timestamp: number;
}

type ParseqOptions = {
    input_fps: number;
    bpm: number;
    output_fps: number;
    cc_window_width: number;
    cc_window_slide_rate: number;
    cc_use_input: boolean;
};

type SimpleParseqPrompts = {
    positive: string;
    negative: string;
};

type AdvancedParseqPrompts = {
    positive:string;
    negative:string;    
    allFrames:boolean;
    from:number;
    to:number;
    weight:string;
}[];

type ParseqPrompts = SimpleParseqPrompts | AdvancedParseqPrompts;


type ParseqKeyframes = [{
    frame: number;
    // TODO: make this stricter
    [key: string]: string | number;
}] | [];

type ParseqRenderedFrames = [{
    frame: number;
    // TODO: make this stricter    
    [key: string]: number;
}];

// Min, max, isAnimated... for each field.
type ParseqRenderedFramesMeta = [{
    // TODO: make this stricter 
    [key: string]: {
        min: number;
        max: number;
        isFlat: boolean;
    };
}];

type RenderedData = ParseqPersistableState & {
    rendered_frames: ParseqRenderedFrames;
    rendered_frames_meta: ParseqRenderedFramesMeta;
};
