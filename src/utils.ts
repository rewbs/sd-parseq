
export const fieldNametoRGBa = (str: string, alpha: number): string => {
    switch (str) {
        case 'seed': return `rgba(128,0,0,${alpha})`;
        case 'scale': return `rgba(255,140,0,${alpha})`;
        case 'noise': return `rgba(189,183,107,${alpha})`;
        case 'strength': return `rgba(107,0,0,${alpha})`;
        case 'contrast': return `rgba(255,0,0,${alpha})`;
        case 'prompt_weight_1': return `rgba(0,128,0,${alpha})`;
        case 'prompt_weight_2': return `rgba(128,128,128,${alpha})`;
        case 'prompt_weight_3': return `rgba(75,0,130,${alpha})`;
        case 'prompt_weight_4': return `rgba(0,0,255,${alpha})`;
        case 'prompt_weight_5': return `rgba(188,143,143,${alpha})`;
        case 'prompt_weight_6': return `rgba(112,128,144,${alpha})`;
        case 'prompt_weight_7': return `rgba(255,0,0,${alpha})`;
        case 'prompt_weight_8': return `rgba(255,0,255,${alpha})`;
        case 'angle': return `rgba(128,0,128,${alpha})`;
        case 'zoom': return `rgba(255,0,160,${alpha})`;
        case 'perspective_flip_theta': return `rgba(210,105,30,${alpha})`;
        case 'perspective_flip_phi': return `rgba(255,0,255,${alpha})`;
        case 'perspective_flip_gamma': return `rgba(0,0,0,${alpha})`;
        case 'perspective_flip_fv': return `rgba(210,180,140,${alpha})`;
        case 'translation_x': return `rgba(34,139,34,${alpha})`;
        case 'translation_y': return `rgba(255,140,0,${alpha})`;
        case 'translation_z': return `rgba(169,169,169,${alpha})`;
        case 'rotation_3d_x': return `rgba(178,34,34,${alpha})`;
        case 'rotation_3d_y': return `rgba(50,200,50,${alpha})`;
        case 'rotation_3d_z': return `rgba(25,25,112,${alpha})`;
        case 'fov': return `rgba(255,0,0,${alpha})`;
        case 'near': return `rgba(0,255,0,${alpha})`;
        case 'far': return `rgba(0,0,255,${alpha})`;
        default: return `rgba(0,0,0,${alpha})`;
    }
}

export function frameToBeats(frame : number, fps : number, bpm : number) : number {
    return frame / fps / 60 * bpm;
  }
  
export function frameToSeconds(frame : number, fps : number) : number {
    return frame / fps
  }
  