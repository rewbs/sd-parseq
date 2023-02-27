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
    }

}

// TODO:
// - Seed travelling example
// - Simple oscillation example