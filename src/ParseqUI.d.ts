
type ParseqMetadata = {
    generated_by: string;
    version: string;
    generated_at: string;
};

type ParseqSessionData = {
    session_name: string;
    session_version: string;
};

type ParseqOptions = {
    input_fps: number,
    bpm: number,
    output_fps: number,
    cc_window_width: number,
    cc_window_slide_rate: number,
    cc_use_input: boolean
};

type ParseqPrompts = {
    positive: string,
    negative: string
};

type ParseqKeyframes = [{
    frame:number,
    // TODO: make this stricter
    [key: string]: string | number;
}];

type ParseqRenderedFrames = [{
    // TODO: make this stricter
    frame: number,
    [key: string]: number;
}];


type RenderedData = {
    meta: ParseqMetadata;
    options: ParseqOptions;
    prompts: ParseqPrompts;
    keyframes: ParseqKeyframes;
    rendered_frames: ParseqRenderedFrames;
};
