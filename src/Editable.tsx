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
import type { ChartData, ChartOptions, ScriptableContext, ChartType } from 'chart.js';
import 'chartjs-plugin-dragdata';

const ChartJSAddPointPlugin = {
    id: 'click',
    afterInit: function (chartInstance: any) {
        chartInstance.canvas.addEventListener('dblclick', (e: MouseEvent) => {
            let x = chartInstance.scales.x.getValueForPixel(e.offsetX);
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
    ChartJSAddPointPlugin
);

// TODO - move to config when interpolatable fields are first class
// enums.
const toRGBa = (str:string, alpha:number):string => {
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

export class Editable extends React.Component<{
    renderedData: RenderedData,
    displayFields: string[],
    as_percents: boolean,
    updateKeyframe: (field: string, index: number, value: number) => void;
    addKeyframe: (index: number) => void;
    clearKeyframe: (field: string, index: number) => void;
}> {

    isKeyframeWithFieldValue = (field: string, idx: number): boolean => {
        return this.props.renderedData.keyframes
            .some(frame => frame['frame'] === idx
                && field in frame
                && frame[field] !== '');
    }

    isKeyframe = (idx: number): boolean => {
        return this.props.renderedData.keyframes
            .some(frame => frame['frame'] === idx);
    }

    render() {
        if ((!this.props.renderedData.rendered_frames)) {
            console.log("Editable input not set.")
            return <></>;
        }

        let options : ChartOptions<'line'> = {
            animation: {
                duration: 175,
                delay: 0
            },
            normalised: true,
            responsive: true,
            aspectRatio: 4,
            onClick: (event:any, elements:any, chart:any) => {
                if (elements[0] && event.native.shiftKey) {
                   const datasetIndex = elements[0].datasetIndex;
                   const field = chart.data.datasets[datasetIndex].label;
                   const index = chart.scales.x.getValueForPixel(event.x);
                   this.props.clearKeyframe(field, index);
                }
              },
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        usePointStyle: true
                    }
                },
                //@ts-ignore - additional plugin config data is not declated in type.
                dragData: {
                    round: 4,
                    showTooltip: true,
                    onDragStart: (e: MouseEvent, element: any) => {
                        // console.log(`drag start`, e, element);
                    },
                    onDrag: (e: MouseEvent, datasetIndex: number, index: number, value: number) => {
                        return this.isKeyframe(index);
                    },
                    onDragEnd: (e: MouseEvent, datasetIndex: number, index: number, value: number)  => {
                        if (!this.isKeyframe(index)) {
                            return;
                        }
                        let field = this.props.displayFields[datasetIndex];
                        if (this.props.as_percents) {                   
                            // TODO: pass through the max for each field from the UI so we're not recalculating it here.
                            const maxValue = Math.max(...this.props.renderedData.rendered_frames.map((frame) => frame[field] || 0))
                            value = value * maxValue / 100;
                        }
                        this.props.updateKeyframe(field, index, value);
                    },
                },
                scales: {
                    y: {
                        // disables datapoint dragging for the entire axis
                        dragData: false
                    }
                },
                click: {
                    addPoint: (index: number) => {
                        if (!this.isKeyframe(index)) {
                            this.props.addKeyframe(index);
                        }
                    }
                }
            },
        };

        let chartData: ChartData<'line'> = {
            labels: this.props.renderedData.rendered_frames.map((idx, frame) => frame.toString()),
            datasets: [
                ...this.props.displayFields.map((field) => {
                    return {
                        label: field,
                        data: this.props.renderedData.rendered_frames.map((frame) => this.props.as_percents ? ( frame[field+'_pc']) : frame[field] || 0),
                        borderColor: toRGBa(field,255),
                        borderWidth: 0.25,
                        pointRadius: (ctx: ScriptableContext<'line'>) => this.isKeyframe(ctx.dataIndex) ? 6 : 2,
                        pointBackgroundColor: (ctx: ScriptableContext<'line'>) => this.isKeyframeWithFieldValue(field, ctx.dataIndex) ? toRGBa(field,1) : toRGBa(field,0.2),
                        backgroundColor: toRGBa(field,255),
                        pointStyle: (ctx: ScriptableContext<'line'>) => this.isKeyframe(ctx.dataIndex ) ? 'circle' : 'cross',
                    }
                })
            ]
        };

        return <Line options={options} data={chartData} />;
    }
}
