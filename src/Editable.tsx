import React, { useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-dragdata';

//ChartJS.overrides.line.showLine = false;

const ChartJSClickPlugin = {
    id: 'click',
    afterInit: function (chartInstance: any) {
        // start listening for double-click events on the charts canvas
        chartInstance.canvas.addEventListener("dblclick", (e: any) => {
            // query corresponding x/y values for the click event
            let x: any, y: any;
            x = chartInstance.scales.x.getValueForPixel(e.offsetX);
            y = chartInstance.scales.x.getValueForPixel(e.offsetY);          

            // find the fitting index where the new datapoint should be inserted to
            // note that only the x-axis is relevant here, as the line is read from left-to-right
            const data = chartInstance.data.datasets[0].data;
            let indexToInsert = data.findIndex((point: any, index: any, arr: any) => {
                if (index === 0 && x < point.x) {
                    // insert at the beginning
                    return 0;
                }
                return point.x > x;
            })
            // insert the new datapoint accordingly
            const pluginOptions = chartInstance.config.options.plugins.click;
            pluginOptions.addPoint(x);
        })
    }
}

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartJSClickPlugin
);

type renderedData = {
    meta: {
        generated_by: string;
        version: string;
        generated_at: string;
    };
    options: object;
    prompts: object;
    keyframes: object[];
    rendered_frames: object[];

};

type chartInput = {
    labels: string[];
    datasets: {
        data: number[];
        label: string;
        borderColor: any;
        backgroundColor: any;
        pointStyle: any;
    }[]
};


export class Editable extends React.Component<{
    renderedData: renderedData,
    displayFields: string[],
    as_percents: boolean,
    updatePoint: any;
    addPoint: any;
  }> {

    isKeyframeWithFieldValue = (field: string, idx: number): boolean => {
        return this.props.renderedData.keyframes
            // @ts-ignore
            .some(frame => frame['frame'] === idx
                && field in frame
                // @ts-ignore
                && frame['field'] !== '');
    }

    isKeyframe = (idx: number): boolean => {
        return this.props.renderedData.keyframes
            // @ts-ignore
            .some(frame => frame['frame'] === idx);
    }

    toRGB = (str:string, alpha:number):string => {
        switch(str) {
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
            case 'rotation_3d_y': return `rgba(173,255,47,${alpha})`;
            case 'rotation_3d_z': return `rgba(25,25,112,${alpha})`;
            case 'fov': return `rgba(255,0,0,${alpha})`;
            case 'near': return `rgba(0,255,0,${alpha})`;
            case 'far': return `rgba(0,0,255,${alpha})`;   
            default: return `rgba(0,0,0,${alpha})`;              
        }

    }    

    render() {
        if ((!this.props.renderedData.rendered_frames)) {
            console.log("Editable input not set.")
            return <></>;
        }

        let options = {
            animation: {
                duration: 200,
                delay: 0
            },
            normalised: true,
            responsive: true,
            aspectRatio: 4,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        usePointStyle: true
                    }
                },
                dragData: {
                    round: 4,
                    showTooltip: true,
                    onDragStart: (e: any, element: any) => {
                        // console.log(`drag start`, e, element);
                    },
                    onDrag: (e: any, datasetIndex: any, index: any, value: any) => {
                        return this.isKeyframe(index);
                    },
                    onDragEnd: (e: any, datasetIndex: any, index: any, value: any)  => {
                        if (!this.isKeyframe(index)) {
                            return;
                        }
                        let field = this.props.displayFields[datasetIndex];
                        this.props.updatePoint(field, index, value);
                    },
                },
                scales: {
                    y: {
                        dragData: false // disables datapoint dragging for the entire axis
                    }
                },
                click: {
                    addPoint: (index: number) => {
                        if (!this.isKeyframe(index)) {
                            this.props.addPoint(index);
                        }
                    }
                }
            },
        };

  

        let chartInput: chartInput = {
            labels: this.props.renderedData.rendered_frames.map((idx, frame) => frame.toString()),
            datasets: [
                ...this.props.displayFields.map((field) => {
                    return {
                        label: field,
                        // @ts-ignore
                        data: this.props.renderedData.rendered_frames.map((frame) => frame[field] || 0),
                        borderColor: this.toRGB(field,255),
                        borderWidth: 0.25,
                        pointRadius: (ctx: any) => this.isKeyframe(ctx.index) ? 6 : 2,
                        pointBackgroundColor: (ctx: any) => this.isKeyframeWithFieldValue(field, ctx.index) ? this.toRGB(field,1) : this.toRGB(field,0.2),
                        backgroundColor: this.toRGB(field,255),
                        pointStyle: (ctx: any) => this.isKeyframe(ctx.index) ? 'circle' : 'cross',
                        
                    }
                })
            ]
        };

        return <Line options={options} data={chartInput} />;
    }
}
