import { test } from '@playwright/test';
import fs from 'fs';
import _ from 'lodash';
import { ParseqPersistableState } from '../ParseqUI';

const baseConfig : ParseqPersistableState = {
  "meta": {
    "generated_by": "sd_parseq",
    "version": "0.1.57",
    "generated_at": "Wed, 24 May 2023 14:04:59 GMT"
  },
  "prompts": [
      {
          "name": "Prompt 1",
          "positive": "A cluster of beautiful (strange) (fungus, lychen, mushroom:1.1) in a lush forest, cinematic lighting, (photorealistic), depth of field, macro photography.",
          "negative": "cropped, watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
          "allFrames": true,
          "from": 0,
          "to": 119,
          "overlap": {
              "inFrames": 0,
              "outFrames": 0,
              "type": "none",
              "custom": "prompt_weight_1"
          }
      }
  ],
  "options": {
      "input_fps": 20,
      "bpm": 120,
      "output_fps": 20,
      "cc_window_width": 0,
      "cc_window_slide_rate": 1,
      "cc_use_input": false
  },
  "managedFields": [
      "strength",
      "seed"
  ],
  "displayedFields": [
      "translation_x"
  ],
  "keyframes": [
      {
          "frame": 0,
          "zoom": 1,
          "zoom_i": "C",
          "seed": 3272688462,
          "strength_i": "S-pulse(p=4b, pw=1f, a=0.15)",
          "seed_i": "S+f",
      },
      {
          "frame": 160,
      }
  ],
  "timeSeries": [],
  "keyframeLock": "beats",
}

const baseDeforumSettings = {
  "W": 512,
  "H": 512,
  "show_info_on_ui": true,
  "tiling": false,
  "restore_faces": false,
  "seed_resize_from_w": 0,
  "seed_resize_from_h": 0,
  "seed": -1,
  "sampler": "Euler a",
  "steps": 20,
  "batch_name": "Deforum_{timestring}",
  "seed_behavior": "iter",
  "seed_iter_N": 1,
  "use_init": false,
  "strength": 0.8,
  "strength_0_no_init": true,
  "init_image": "https://deforum.github.io/a1/I1.png",
  "use_mask": false,
  "use_alpha_as_mask": false,
  "mask_file": "https://deforum.github.io/a1/M1.jpg",
  "invert_mask": false,
  "mask_contrast_adjust": 1.0,
  "mask_brightness_adjust": 1.0,
  "overlay_mask": true,
  "mask_overlay_blur": 4,
  "fill": "original",
  "full_res_mask": true,
  "full_res_mask_padding": 4,
  "reroll_blank_frames": "ignore",
  "reroll_patience": 10.0,
  "prompts": {
      "0": "tiny cute swamp bunny, highly detailed, intricate, ultra hd, sharp photo, crepuscular rays, in focus, by tomasz alen kopera",
      "30": "anthropomorphic clean cat, surrounded by fractals, epic angle and pose, symmetrical, 3d, depth of field, ruan jia and fenghua zhong",
      "60": "a beautiful coconut --neg photo, realistic",
      "90": "a beautiful durian, trending on Artstation"
  },
  "animation_prompts_positive": "",
  "animation_prompts_negative": "",
  "animation_mode": "3D",
  "max_frames": 165,
  "border": "replicate",
  "angle": "0:(0)",
  "zoom": "0:(1.0025+0.002*sin(1.25*3.14*t/30))",
  "translation_x": "0:(0)",
  "translation_y": "0:(0)",
  "translation_z": "0:(0)",
  "transform_center_x": "0:(0.5)",
  "transform_center_y": "0:(0.5)",
  "rotation_3d_x": "0:(0)",
  "rotation_3d_y": "0:(0)",
  "rotation_3d_z": "0:(0)",
  "enable_perspective_flip": false,
  "perspective_flip_theta": "0:(0)",
  "perspective_flip_phi": "0:(0)",
  "perspective_flip_gamma": "0:(0)",
  "perspective_flip_fv": "0:(53)",
  "noise_schedule": "0: (0.04)",
  "strength_schedule": "0: (0.65)",
  "contrast_schedule": "0: (1.0)",
  "cfg_scale_schedule": "0: (7)",
  "enable_steps_scheduling": false,
  "steps_schedule": "0: (25)",
  "fov_schedule": "0: (70)",
  "aspect_ratio_schedule": "0: (1)",
  "aspect_ratio_use_old_formula": false,
  "near_schedule": "0: (200)",
  "far_schedule": "0: (10000)",
  "seed_schedule": "0:(s), 1:(-1), \"max_f-2\":(-1), \"max_f-1\":(s)",
  "pix2pix_img_cfg_scale_schedule": "0:(1.5)",
  "enable_subseed_scheduling": false,
  "subseed_schedule": "0:(1)",
  "subseed_strength_schedule": "0:(0)",
  "enable_sampler_scheduling": false,
  "sampler_schedule": "0: (\"Euler a\")",
  "use_noise_mask": false,
  "mask_schedule": "0: (\"{video_mask}\")",
  "noise_mask_schedule": "0: (\"{video_mask}\")",
  "enable_checkpoint_scheduling": false,
  "checkpoint_schedule": "0: (\"model1.ckpt\"), 100: (\"model2.safetensors\")",
  "enable_clipskip_scheduling": false,
  "clipskip_schedule": "0: (2)",
  "enable_noise_multiplier_scheduling": false,
  "noise_multiplier_schedule": "0: (1.05)",
  "resume_from_timestring": false,
  "resume_timestring": "20230506203228",
  "enable_ddim_eta_scheduling": false,
  "ddim_eta_schedule": "0: (0)",
  "enable_ancestral_eta_scheduling": false,
  "ancestral_eta_schedule": "0: (1)",
  "amount_schedule": "0: (0.05)",
  "kernel_schedule": "0: (5)",
  "sigma_schedule": "0: (1.0)",
  "threshold_schedule": "0: (0.0)",
  "color_coherence": "LAB",
  "color_coherence_image_path": "",
  "color_coherence_video_every_N_frames": 1,
  "color_force_grayscale": false,
  "legacy_colormatch": false,
  "diffusion_cadence": 1,
  "optical_flow_cadence": "None",
  "cadence_flow_factor_schedule": "0: (1)",
  "optical_flow_redo_generation": "None",
  "redo_flow_factor_schedule": "0: (1)",
  "diffusion_redo": 0,
  "noise_type": "perlin",
  "perlin_octaves": 4,
  "perlin_persistence": 0.5,
  "use_depth_warping": true,
  "depth_algorithm": "Zoe",
  "midas_weight": 0.4,
  "padding_mode": "reflection",
  "sampling_mode": "bicubic",
  "save_depth_maps": false,
  "video_init_path": "https://deforum.github.io/a1/V1.mp4",
  "extract_nth_frame": 1,
  "extract_from_frame": 0,
  "extract_to_frame": -1,
  "overwrite_extracted_frames": false,
  "use_mask_video": false,
  "video_mask_path": "https://deforum.github.io/a1/VM1.mp4",
  "hybrid_comp_alpha_schedule": "0:(0.5)",
  "hybrid_comp_mask_blend_alpha_schedule": "0:(0.5)",
  "hybrid_comp_mask_contrast_schedule": "0:(1)",
  "hybrid_comp_mask_auto_contrast_cutoff_high_schedule": "0:(100)",
  "hybrid_comp_mask_auto_contrast_cutoff_low_schedule": "0:(0)",
  "hybrid_flow_factor_schedule": "0:(1)",
  "hybrid_generate_inputframes": false,
  "hybrid_generate_human_masks": "None",
  "hybrid_use_first_frame_as_init_image": true,
  "hybrid_motion": "None",
  "hybrid_motion_use_prev_img": false,
  "hybrid_flow_consistency": false,
  "hybrid_consistency_blur": 2,
  "hybrid_flow_method": "RAFT",
  "hybrid_composite": "None",
  "hybrid_use_init_image": false,
  "hybrid_comp_mask_type": "None",
  "hybrid_comp_mask_inverse": false,
  "hybrid_comp_mask_equalize": "None",
  "hybrid_comp_mask_auto_contrast": true,
  "hybrid_comp_save_extra_frames": false,
  "image_strength_schedule": "0:(0.75)",
  "blendFactorMax": "0:(0.35)",
  "blendFactorSlope": "0:(0.25)",
  "tweening_frames_schedule": "0:(20)",
  "color_correction_factor": "0:(0.075)",
  "skip_video_creation": false,
  "fps": 20,
  "make_gif": false,
  "delete_imgs": false,
  "add_soundtrack": "File",
  "soundtrack_path": "/home/rewbs/Four-Four-short.mp3",
  "r_upscale_video": true,
  "r_upscale_factor": "x4",
  "r_upscale_model": "realesrgan-x4plus",
  "r_upscale_keep_imgs": true,
  "store_frames_in_ram": false,
  "frame_interpolation_engine": "FILM",
  "frame_interpolation_x_amount": 3,
  "frame_interpolation_slow_mo_enabled": false,
  "frame_interpolation_slow_mo_amount": 2,
  "frame_interpolation_keep_imgs": false,
  "frame_interpolation_use_upscaled": true,
  "sd_model_name": "Protogen-x5.3.safetensors",
  "sd_model_hash": "d0b457ae",
  "deforum_git_commit_id": "75923415"
}


const tamperConfig = (config:ParseqPersistableState, kf : number, field: string, value: number, interpolation : string) : ParseqPersistableState => {
  const newConfig = _.cloneDeep(config);
  newConfig.managedFields = [...newConfig.managedFields, field]
  newConfig.displayedFields = [...newConfig.managedFields]
  newConfig.keyframes[kf] = {
    ...newConfig.keyframes[kf],
    [field]: value,
    [`${field}_i`]: interpolation
  }
  return newConfig;  
}


test('Render many', async ({ page }) => {

  const setups = [
    {
      category: 'rhythmic-incremental',
      interpolation: "prev_computed_value + S*abs(sin(p=2b, ps=0.25b)^5)"
    }
  ].flatMap((category) => {
      return [
        {field: 'translation_x', value: 16},
        {field: 'translation_y', value: 16},
        {field: 'translation_z', value: 16},
        {field: 'rotation_3d_x', value: 8},
        {field: 'rotation_3d_y', value: 8},
        {field: 'rotation_3d_z', value: 8},
      ].map(s => ({...s, ...category}))
    })
    .concat([
      {
        category: 'linear',
        interpolation: "prev_computed_value + S"
      }
    ].flatMap((category) => {
      return [
        {field: 'translation_x', value: 2},
        {field: 'translation_y', value: 2},
        {field: 'translation_z', value: 2},
        {field: 'rotation_3d_x', value: 2},
        {field: 'rotation_3d_y', value: 2},
        {field: 'rotation_3d_z', value: 2},
      ].map(s => ({...s, ...category}))
    }));

  fs.mkdirSync('pw-output', {recursive: true});

  for (const setup of setups) {
    const outputLabel = `${setup.category}-${setup.field}-${setup.value}`;
    console.log(`Creating ${outputLabel}...`);

    const parseqInput = tamperConfig(baseConfig, 0, setup.field, setup.value, setup.interpolation);
    fs.writeFileSync(`pw-output/parseq-input-${outputLabel}.json`, JSON.stringify(parseqInput, null, 2));      
    
    const parseqInputUrlEncoded = encodeURIComponent(JSON.stringify(parseqInput));
    await page.goto('http://localhost:3000/raw?parseq=' + parseqInputUrlEncoded);
    const rawParseqOutput = await page.locator('//*[@id="root"]')?.textContent();
    if (!rawParseqOutput) {
      throw new Error("No output from parseq when generating " + outputLabel);
    }

    try {
      const parseqOutput = JSON.parse(rawParseqOutput);
      const newDeforumSettings = {
        ...baseDeforumSettings,
        parseq_manifest: JSON.stringify(parseqOutput, null, 2)
      }
      fs.writeFileSync(`pw-output/deforum-settings-${outputLabel}.txt`, JSON.stringify(newDeforumSettings, null, 2));      
    } catch (e) {
      throw new Error("Failed to generate output for " + outputLabel + ": " + e);
    }

  }

  
});