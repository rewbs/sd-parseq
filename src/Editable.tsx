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

ChartJS.overrides.line.showLine = false;

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
            const data = chartInstance.data.datasets[0].data
            let indexToInsert = data.findIndex((point: any, index: any, arr: any) => {
                if (index === 0 && x < point.x) {
                    // insert at the beginning
                    return 0
                }
                // insert at the first array position where our new datapoint has a greater value than the previous entry
                return point.x > x
            })
            // insert the new datapoint accordingly
            const pluginOptions = chartInstance.config.options.plugins.click
            pluginOptions.addPoint(x)
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

type EditableProps = {
    renderedData: {
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
    displayFields: string[];
    as_percents: boolean;
    updatePoint: any;
    addPoint: any;
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




export const Editable = (props: EditableProps) => {

    let renderedData = props.renderedData;
    console.log(props.renderedData);
    console.log(renderedData);

    let options = {
        animation: {
            duration: 0,
        },
        normalised: true,
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
            },
            dragData: {
                round: 4,
                showTooltip: true,
                onDragStart: function (e: any, element: any) {
                    /*
                    // e = event, element = datapoint that was dragged
                    // you may use this callback to prohibit dragging certain datapoints
                    // by returning false in this callback
                    if (element.datasetIndex === 0 && element.index === 0) {
                      // this would prohibit dragging the first datapoint in the first
                      // dataset entirely
                      return false
                    }
                    */
                    // console.log(element);
                    // return isKeyframe('zoom',  element.index);
                },
                onDrag: function (e: any, datasetIndex: any, index: any, value: any) {
                    /*     
                    // you may control the range in which datapoints are allowed to be
                    // dragged by returning `false` in this callback
                    if (value < 0) return false // this only allows positive values
                    if (datasetIndex === 0 && index === 0 && value > 20) return false 
                    */
                    console.log(renderedData.keyframes);
                    console.log(index, isKeyframe(index));
                    return isKeyframe(index);
                },
                onDragEnd: function (e: any, datasetIndex: any, index: any, value: any) {
                    // you may use this callback to store the final datapoint value
                    // (after dragging) in a database, or update other UI elements that
                    // dependent on it
                    if (!isKeyframe(index)) {
                        return;
                    }

                    let field = props.displayFields[datasetIndex];
                    props.updatePoint(field, index, value);
                },
            },
            scales: {
                y: {
                    // dragData: false // disables datapoint dragging for the entire axis
                }
            },
            click: {
                addPoint: (index: number) => {
                    if (!isKeyframe(index)) {
                        props.addPoint(index);
                    }
                }
            }
        },

    };


    function isKeyframeWithFieldValue(field: string, idx: number): boolean {
        return renderedData.keyframes
            // @ts-ignore
            .some(frame => frame['frame'] === idx
                && field in frame
                // @ts-ignore
                && frame['field'] !== '');
    }

    function isKeyframe(idx: number): boolean {
        return renderedData.keyframes
            // @ts-ignore
            .some(frame => frame['frame'] === idx);
    }    

    if ((!renderedData.rendered_frames)) {
        return <></>;
    }

    let chartInput: chartInput = {
        labels: renderedData.rendered_frames.map((idx, frame) => frame.toString()),
        datasets: [
            ...props.displayFields.map((field) => {
                return {
                    label: field,
                    // @ts-ignore
                    data: renderedData.rendered_frames.map((frame) => frame[field] || 0),
                    borderColor: stc(field),
                    backgroundColor: stc(field),
                    pointStyle: (ctx: any) => isKeyframeWithFieldValue(field, ctx.index) ? 'circle' 
                        : isKeyframe(ctx.index) ? 'square' : 'cross',
                }
            })

        ]
    }

    return <Line options={options} data={chartInput} />;
}
