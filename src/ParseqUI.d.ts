declare module 'uuid4';

type ParseqMetadata = {
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
    display_fields: string[];
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

type ParseqPrompts = {
    positive: string;
    negative: string;
};

type ParseqKeyframes = [{
    frame: number;
    // TODO: make this stricter
    [key: string]: string | number;
}];

type ParseqRenderedFrames = [{
    frame: number;
    // TODO: make this stricter    
    [key: string]: number;
}];

// Min, max, isAnimated... for each field.
type ParseqRenderedFramesMeta = [{
    // TODO: make this stricter 
    [key: string]: number | boolean;
}];

type RenderedData = ParseqPersistableState & {
    rendered_frames: ParseqRenderedFrames;
    rendered_frames_meta: ParseqRenderedFramesMeta;
};
