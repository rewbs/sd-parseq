/* eslint-disable no-template-curly-in-string */
export const templates: {
    [key: string]: Template;
} = {
    "blank": {
        name: "Blank",
        description: "A blank template with no prompts, no parameter changes, and just a start and end keyframe",
        template: {
            "prompts": {
                "positive": "",
                "negative": ""
            },
            "displayedFields": [
                "seed",
                "strength",
            ],
            "keyframes": [
                {
                    "frame": 0,
                    "seed": 0,
                    "seed_i": "S+f",
                },
                {
                    "frame": 119
                }
            ]
        }
    },
    "multiprompt": {
        name: "Multi-prompt",
        description: "An example showing multiple prompts",
        template: {
            "prompts": [
                {
                    "name": "Prompt 1",
                    "positive": "A lone black cat, centered, realistic, photorealism, fine textures, highly detailed, volumetric lighting, studio photography",
                    "negative": "watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly",
                    "allFrames": false,
                    "from": 0,
                    "to": 30,
                    "overlap": {
                        "inFrames": 0,
                        "outFrames": 0,
                        "type": "none",
                        "custom": "prompt_weight_1"
                    }
                },
                {
                    "positive": "A lone white swan, centered, realistic, photorealism, fine textures, highly detailed, volumetric lighting, studio photography",
                    "negative": "watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly",
                    "from": 30,
                    "to": 60,
                    "allFrames": false,
                    "name": "Prompt 2",
                    "overlap": {
                        "inFrames": 0,
                        "outFrames": 0,
                        "type": "none",
                        "custom": "prompt_weight_2"
                    }
                },
                {
                    "positive": "A lone red fox, centered, realistic, photorealism, fine textures, highly detailed, volumetric lighting, studio photography",
                    "negative": "watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly",
                    "from": 60,
                    "to": 90,
                    "allFrames": false,
                    "name": "Prompt 3",
                    "overlap": {
                        "inFrames": 0,
                        "outFrames": 0,
                        "type": "none",
                        "custom": "prompt_weight_3"
                    }
                },
                {
                    "positive": "A lone brown bear, centered, realistic, photorealism, fine textures, highly detailed, volumetric lighting, studio photography",
                    "negative": "watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry, cartoon, CGI, computer, video game, painting, drawing, sketch, disfigured, deformed, ugly",
                    "from": 90,
                    "to": 120,
                    "allFrames": false,
                    "name": "Prompt 4",
                    "overlap": {
                        "inFrames": 0,
                        "outFrames": 0,
                        "type": "none",
                        "custom": "prompt_weight_4"
                    }
                }
            ],
            "managedFields": [
                "prompt_weight_1",
                "prompt_weight_2",
                "prompt_weight_3",
                "prompt_weight_4",
                "seed",
                "stength",
                "zoom"
            ],
            displayedFields: ['seed', 'strength'],
            "keyframes": [
                {
                    "frame": 0,
                    "seed": -1,
                },
                {
                    "frame": 119
                }
            ]
        }
    },

    "catduck": {
        name: "Cat / Duck",
        description: "Using term weights to slide from a cat to a duck.",
        template: {
            "prompts": [
                {
                    "name": "Prompt 1",
                    "positive": "A lone (black cat:${prompt_weight_1}) (white duck:${prompt_weight_2}) at midday, centered, realistic, photorealism, crisp, natural colors, fine textures, highly detailed, volumetric lighting, studio photography",
                    "negative": "(black cat:${prompt_weight_2}) (white duck:${prompt_weight_1})\nwatermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
                    "allFrames": false,
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
            "managedFields": [
                "prompt_weight_1",
                "prompt_weight_2",
                "prompt_weight_3",
                "prompt_weight_4",
                "seed",
                "strength",
                "noise",
                "zoom"
            ],
            "displayedFields": [
                "seed",
                "prompt_weight_1",
                "prompt_weight_2",
                "zoom"
            ],
            "keyframes": [
                {
                    "frame": 0,
                    "zoom": 1,
                    "zoom_i": "C",
                    "seed": -1,
                    "noise": 0.04,
                    "strength": 0.6,
                    "prompt_weight_1": 1,
                    "prompt_weight_1_i": "bez(0,0.6,1,0.4)",
                    "prompt_weight_2": 0,
                    "prompt_weight_2_i": "bez(0,0.6,1,0.4)"
                },
                {
                    "frame": 40,
                    "zoom": 1.5
                },
                {
                    "frame": 80,
                    "prompt_weight_1": 0,
                    "prompt_weight_2": 1
                },
                {
                    "frame": 119,
                    "zoom": 0.5
                }
            ]
        }
    },

    "strengthWave": {
        name: "Strength wave",
        description: "Oscillate the strength (similar to loopback wave), while evolving the prompt.",
        template: {
            "prompts": [
                {
                  "name": "Prompt 1",
                  "positive": "Full shot, young beginner padawan, light sabre, attack pose, dramatic lighting, professional photography, 80mm, high detail, intense",
                  "negative": "old jedi warrior, watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
                  "allFrames": true,
                  "from": 0,
                  "to": 119,
                  "overlap": {
                    "inFrames": 0,
                    "outFrames": 119,
                    "type": "linear",
                    "custom": "prompt_weight_1"
                  }
                },
                {
                  "positive": "Full shot, old jedi warrior, light sabre, attack pose, dramatic lighting, professional photography, 80mm, high detail, intense",
                  "negative": "young beginner padawan,  watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
                  "from": 0,
                  "to": 119,
                  "allFrames": true,
                  "name": "Prompt 2",
                  "overlap": {
                    "inFrames": 119,
                    "outFrames": 0,
                    "type": "linear",
                    "custom": "1-prompt_weight_1"
                  }
                }
              ],
              "options": {
                "output_fps": "30",
              },
              "managedFields": [
                "prompt_weight_1",
                "seed",
                "strength",
                "zoom"
              ],
              "keyframes": [
                {
                  "frame": 0,
                  "seed": -1,
                  "seed_i": "",
                  "strength": 0.8,
                  "strength_i": "S-(sin(p=2s)^10)*(S-0.2)",
                  "prompt_weight_1": 0
                },
                {
                  "frame": 119,
                  "prompt_weight_1": 1
                }
              ],
              "timeSeries": [],
              "keyframeLock": "frames"
        }
    },

    "seedWave": {
        name: "Seed wave",
        description: "Increment the seed at oscillating rates while evolving the prompt.",
        template: {

            "prompts": [
                {
                  "name": "Prompt 1",
                  "positive": "Full shot, young beginner padawan, light sabre, attack pose, dramatic lighting, professional photography, 80mm, high detail, intense",
                  "negative": "old jedi warrior, watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
                  "allFrames": true,
                  "from": 0,
                  "to": 119,
                  "overlap": {
                    "inFrames": 0,
                    "outFrames": 119,
                    "type": "linear",
                    "custom": "prompt_weight_1"
                  }
                },
                {
                  "positive": "Full shot, old jedi warrior, light sabre, attack pose, dramatic lighting, professional photography, 80mm, high detail, intense",
                  "negative": "young beginner padawan,  watermark, logo, text, signature, copyright, writing, letters,\nlow quality, artefacts, cropped, bad art, poorly drawn, lowres, simple, pixelated, grain, noise, blurry,\ncartoon, computer game, video game, painting, drawing, sketch,\ndisfigured, deformed, ugly",
                  "from": 0,
                  "to": 119,
                  "allFrames": true,
                  "name": "Prompt 2",
                  "overlap": {
                    "inFrames": 119,
                    "outFrames": 0,
                    "type": "linear",
                    "custom": "1-prompt_weight_1"
                  }
                }
              ],
              "options": {
                "output_fps": "30",
              },
              "managedFields": [
                "prompt_weight_1",
                "seed",
                "strength",
              ],
              "keyframes": [
                {
                  "frame": 0,
                  "seed": 0,
                  "seed_i": "prev_computed_value+(sin(p=2s)^10)/4",
                  "strength": 0.25,
                  "strength_i": "S",
                  "prompt_weight_1": 0,
                },
                {
                  "frame": 119,
                  "prompt_weight_1": 1,
                }
              ],
              "timeSeries": [],
              "keyframeLock": "frames"
        }
    }

}

// TODO:
// - Seed travelling example
// - Simple oscillation example