import { InterpolatableFieldDefinition } from "../ParseqUI";

export const defaultFields: InterpolatableFieldDefinition[] = [
    {
        name: "seed",
        type: "number",
        defaultValue: -1,
        description: "",
        color: [51, 105, 30],
        labels: []
    },
    {
        name: "scale",
        type: "number",
        defaultValue: 7,
        description: "",
        color: [130, 119, 23],
        labels: []
    },
    {
        name: "noise",
        type: "number",
        defaultValue: 0.08,
        description: "",
        color: [150, 25, 90],
        labels: []
    }, 
    {
        name: "noise_multiplier",
        type: "number",
        defaultValue: 1.05,
        description: "",
        color: [100, 0, 60],
        labels: []
    },      
    {
        name: "strength",
        type: "number",
        defaultValue: 0.6,
        description: "",
        color: [49, 27, 146],
        labels: []
    },
    {
        name: "clipskip",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [200, 10, 10],
        labels: []
    },    
    {
        name: "contrast",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [100, 100, 100],
        labels: []
    },
    {
        name: "prompt_weight_1",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [229, 115, 115],
        labels: []
    },
    {
        name: "prompt_weight_2",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [186, 104, 200],
        labels: []
    },
    {
        name: "prompt_weight_3",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [121, 134, 203],
        labels: []
    },
    {
        name: "prompt_weight_4",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [79, 195, 247],
        labels: []
    },
    {
        name: "prompt_weight_5",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [77, 182, 172],
        labels: []
    },
    {
        name: "prompt_weight_6",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [174, 213, 129],
        labels: []
    },
    {
        name: "prompt_weight_7",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [220, 231, 117],
        labels: []
    },
    {
        name: "prompt_weight_8",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [77, 208, 225],
        labels: []
    },
    {
        name: "angle",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [13, 71, 161],
        labels: ['2D']
    },
    {
        name: "zoom",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [136, 14, 79],
        labels: ['2D']
    },
    {
        name: "transform_center_x",
        type: "number",
        defaultValue: 0.5,
        description: "X center axis for 2D angle/zoom",
        color: [0, 79, 0],
        labels: ['2D']
    },
    {
        name: "transform_center_y",
        type: "number",
        defaultValue: 0.5,
        description: "Y center axis for 2D angle/zoom",
        color: [79, 40, 10],
        labels: ['2D']
    },
    {
        name: "perspective_flip_theta",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [210, 105, 30],
        labels: ['2D']
    },
    {
        name: "perspective_flip_phi",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [255, 0, 255],
        labels: ['2D']
    },
    {
        name: "perspective_flip_gamma",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [0, 0, 0],
        labels: ['2D']
    },
    {
        name: "perspective_flip_fv",
        type: "number",
        defaultValue: 50,
        description: "",
        color: [210, 180, 140],
        labels: ['2D']
    },
    {
        name: "translation_x",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [34, 139, 34],
        labels: []
    },
    {
        name: "translation_y",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [255, 140, 0],
        labels: []
    },
    {
        name: "translation_z",
        type: "number",
        defaultValue: 10,
        description: "",
        color: [255, 80, 80],
        labels: ['3D']
    },
    {
        name: "rotation_3d_x",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [178, 34, 34],
        labels: ['3D']
    },
    {
        name: "rotation_3d_y",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [50, 200, 50],
        labels: ['3D']
    },
    {
        name: "rotation_3d_z",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [25, 25, 112],
        labels: ['3D']
    },
    {
        name: "fov",
        type: "number",
        defaultValue: 40,
        description: "",
        color: [255, 0, 0],
        labels: ['3D']
    },
    {
        name: "near",
        type: "number",
        defaultValue: 200,
        description: "",
        color: [0, 255, 0],
        labels: ['3D']
    },
    {
        name: "far",
        type: "number",
        defaultValue: 10000,
        description: "",
        color: [0, 0, 255],
        labels: ['3D']
    },
    {
        name: "antiblur_kernel",
        type: "number",
        defaultValue: 5,
        description: "",
        color: [0, 0, 0],
        labels: ['antiblur']
    },
    {
        name: "antiblur_sigma",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [75, 75, 75],
        labels: ['antiblur']
    },
    {
        name: "antiblur_amount",
        type: "number",
        defaultValue: 0.2,
        description: "",
        color: [150, 150, 150],
        labels: ['antiblur']
    },
    {
        name: "antiblur_threshold",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [225, 225, 225],
        labels: ['antiblur']
    },
    {
        name: "hybrid_comp_alpha",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [0, 0, 50],
        labels: ['hybrid_video']
    },
    {
        name: "hybrid_comp_mask_blend_alpha",
        type: "number",
        defaultValue: 0.5,
        description: "",
        color: [50, 50, 100],
        labels: ['hybrid_video']
    },
    {
        name: "hybrid_comp_mask_contrast",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [100, 100, 150],
        labels: ['hybrid_video']
    },
    {
        name: "hybrid_comp_mask_auto_contrast_cutoff_low",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [150, 150, 200],
        labels: ['hybrid_video']
    },
    {
        name: "hybrid_comp_mask_auto_contrast_cutoff_high",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [200, 200, 250],
        labels: ['hybrid_video']
    },
    {
        name: "hybrid_flow_factor",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [200, 250, 250],
        labels: ['hybrid_video']
    },
    {
        name: "cadence_flow_factor",
        type: "number",
        defaultValue: 1,
        description: "If you have enabled optical flow estimation for your cadence frame, this ajusts how strongly that flow is applied",
        color: [0, 250, 25],
        labels: ['optical_flow']
    },
    {
        name: "redo_flow_factor",
        type: "number",
        defaultValue: 1,
        description: "If you have enabled optical flow redo generation, this adjusts how strongly that flow is applied",
        color: [0, 125, 70],
        labels: ['optical_flow']
    },
    {
        name: "cn_1_weight",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [100, 100, 150],
        labels: ['control_net']
    },
    {
        name: "cn_1_guidance_start",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [150, 150, 200],
        labels: ['control_net']
    },
    {
        name: "cn_1_guidance_end",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [200, 200, 250],
        labels: ['control_net']
    },
    {
        name: "cn_2_weight",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [100, 100, 50],
        labels: ['control_net']
    },
    {
        name: "cn_2_guidance_start",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [150, 150, 100],
        labels: ['control_net']
    },
    {
        name: "cn_2_guidance_end",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [200, 200, 150],
        labels: ['control_net']
    },
    {
        name: "cn_3_weight",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [150, 50, 50],
        labels: ['control_net']
    },
    {
        name: "cn_3_guidance_start",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [200, 100, 100],
        labels: ['control_net']
    },
    {
        name: "cn_3_guidance_end",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [250, 150, 150],
        labels: ['control_net']
    },    
    {
        name: "cn_4_weight",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [100, 50, 150],
        labels: ['control_net']
    },
    {
        name: "cn_4_guidance_start",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [150, 100, 200],
        labels: ['control_net']
    },
    {
        name: "cn_4_guidance_end",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [200, 150, 250],
        labels: ['control_net']
    },
    {
        name: "cn_5_weight",
        type: "number",
        defaultValue: 1,
        description: "",
        color: [50, 100, 150],
        labels: ['control_net']
    },
    {
        name: "cn_5_guidance_start",
        type: "number",
        defaultValue: 0,
        description: "",
        color: [100, 150, 200],
        labels: ['control_net']
    },
    {
        name: "cn_5_guidance_end",
        type: "number",
        defaultValue: 100,
        description: "",
        color: [150, 200, 250],
        labels: ['control_net']
    },
    {
        name: "guided_blendFactorMax",
        type: "number",
        defaultValue: 0.35,
        description: "",
        color: [0, 50, 0],
        labels: ['guided_images']
    },
    {
        name: "guided_blendFactorSlope",
        type: "number",
        defaultValue: 0.25,
        description: "",
        color: [0, 100, 0],
        labels: ['guided_images']
    },
    {
        name: "guided_tweening_frames",
        type: "number",
        defaultValue: 20,
        description: "",
        color: [0, 150, 0],
        labels: ['guided_images']
    },
    {
        name: "guided_color_correction_factor",
        type: "number",
        defaultValue: 0.075,
        description: "",
        color: [0, 200, 0],
        labels: ['guided_images']
    },
     
]