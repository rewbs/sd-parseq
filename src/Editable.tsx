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
import stc from 'string-to-color';

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

//type EditableProps = {

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
                        borderColor: stc(field),
                        borderWidth: 0.25,
                        pointRadius: (ctx: any) => this.isKeyframe(ctx.index) ? 6 : 2,
                        pointBackgroundColor: (ctx: any) => stc(field) + (this.isKeyframeWithFieldValue(field, ctx.index) ? 'FF' : '40'),
                        backgroundColor: stc(field),
                        pointStyle: (ctx: any) => this.isKeyframe(ctx.index) ? 'circle' : 'cross',
                        
                    }
                })
            ]
        };

        return <Line options={options} data={chartInput} />;
    }
}
