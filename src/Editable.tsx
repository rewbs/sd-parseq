import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import {
    CategoryScale, Chart as ChartJS, Legend, LegendItem, LinearScale, LineElement, PointElement, Title,
    Tooltip
} from 'chart.js';
import './components/chartjs-plugins/drag'
import 'chart.js/auto';
//@ts-ignore
import annotationPlugin from 'chartjs-plugin-annotation';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { fieldNametoRGBa, } from './utils/utils';
import { frameToBeats, frameToSeconds } from './utils/maths';
import zoomPlugin from 'chartjs-plugin-zoom';
import { DECIMATION_THRESHOLD } from './utils/consts';


const ChartJSAddPointPlugin = {
    id: 'click',
    afterInit: function (chartInstance: any) {
        chartInstance.canvas.addEventListener('dblclick', (e: MouseEvent) => {
            let x = chartInstance.scales.x.getValueForPixel(e.offsetX);
            const pluginOptions = chartInstance.config.options.plugins.click;
            pluginOptions.addPoint(Math.round(x));
        })
    }
}

const ChartJSDetectDecimationPlugin = {
    id: 'detectDecimation',
    afterUpdate: function (chartInstance: any) {
        const pluginOptions = chartInstance.config.options.plugins.detectDecimation;
        // All my datasets have the same length, so I just check the first one
        // To generalize, you should check all datasets.
        const isDecimating = chartInstance.data.datasets[0]._data !== undefined
            && chartInstance.data.datasets[0].data !== undefined
            && chartInstance.data.datasets[0].data.length !== chartInstance.data.datasets[0]._data.length;
        const unDecimatedPointCount = isDecimating ? chartInstance.data.datasets[0]._data?.length : chartInstance.data.datasets[0].data.length;
        const decimatedPointCount = chartInstance.data.datasets[0].data.length;
        pluginOptions.onDecimation(isDecimating, unDecimatedPointCount, decimatedPointCount);
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
    ChartJSAddPointPlugin,
    ChartJSDetectDecimationPlugin,
    zoomPlugin,
    annotationPlugin
);

//@ts-ignore
//Interaction.modes.interpolate = Interpolate

export class Editable extends React.Component<{
    renderedData: RenderedData,
    graphableData: GraphableData,
    displayedFields: string[],
    as_percents: boolean,
    updateKeyframe: (field: string, index: number, value: number) => void;
    addKeyframe: (index: number) => void;
    clearKeyframe: (field: string, index: number) => void;
    onDecimation: (isDecimating: boolean, unDecimatedPointCount: number, decimatedPointCount: number) => void;
    onGraphScalesChanged: ({xmin, xmax}: { xmin: number, xmax: number }) => void;
    markers: { x: number, label: string, color: string, top: boolean }[];
    xscales: { xmin: number, xmax: number };
}> {

    constructor(props : any) {
        super(props);
        this.state = {xscales: {
            xmin: this.props.xscales?.xmin ?? 0,
            xmax: this.props.xscales?.xmax ?? (this.props.renderedData.rendered_frames.length - 1),
        }};
      }

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

    isDecimating = (): boolean => {
        //@ts-ignore
        return (this.state.xscales.xmax - this.state.xscales.xmin) > DECIMATION_THRESHOLD
    };

    render() {
        const annotations = this.props.markers.reduce((acc: any, marker: { x: number, label: string, color: string, top: boolean }, idx: number) => {
            return {
                ...acc,
                ['line' + idx]: {
                    xMin: marker.x,
                    xMax: marker.x,
                    borderColor: marker.color,
                    borderDash: [5, 5],
                    borderWidth: 1,
                    label: {
                        display: true,
                        content: marker.label,
                        ...(marker.top ? { position: 'end', yAdjust: -5 } : { position: 'start', yAdjust: 5 }),
                        font: { size: '8' },
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: 3
                    },
                    callout: {
                        display: true,
                    }
                }
            }
        }, {});

        if ((!this.props.renderedData.rendered_frames)) {
            //log.debug("Editable input not set.")
            return <></>;
        }

        const capturedThis = this;

        let options: ChartOptions<'line'> = {
            parsing: false,
            normalised: true,
            spanGaps: true,
            aspectRatio: 4,
            animation: {
                duration: 175,
                delay: 0
            },
            scales: {
                x: {
                    type: 'linear',
                    min: this.props.xscales.xmin,
                    max: this.props.xscales.xmax,
                    title: {
                        display: true,
                        text: 'Frame',
                    },
                    ticks: {
                        minRotation: 0,
                        maxRotation: 0
                    }
                },
                y: {
                    type: 'linear',
                    ticks: {
                        minRotation: 0,
                        maxRotation: 0
                    }
                },
            },
            responsive: true,
            onClick: (event: any, elements: any, chart: any) => {
                if (!capturedThis.isDecimating() && elements[0] && event.native.shiftKey) {
                    const datasetIndex = elements[0].datasetIndex;
                    const field = chart.data.datasets[datasetIndex].label;
                    const index = Math.round(chart.scales.x.getValueForPixel(event.x));
                    this.props.clearKeyframe(field, index);
                }
            },
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: {
                        usePointStyle: true,
                        sort: (a: LegendItem, b: LegendItem) => {
                            return a.text.localeCompare(b.text);
                        }
                    }
                },
                decimation: {
                    enabled: true,
                    algorithm: 'lttb',
                    threshold: DECIMATION_THRESHOLD,
                    samples: DECIMATION_THRESHOLD,
                },
                //@ts-ignore
                detectDecimation: {
                    onDecimation: this.props.onDecimation
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'alt',
                        onPanComplete: function (chart: any) {
                            const newScales =  { xmin: Math.round(chart.chart.scales.x.min), xmax: Math.round(chart.chart.scales.x.max) };
                            capturedThis.setState({
                                xscales: newScales
                            })
                            capturedThis.props.onGraphScalesChanged(newScales);
                        }
                    },
                    limits: {
                        x: { min: 0, max: capturedThis.props.renderedData.rendered_frames.length - 1, minRange: 10 },
                    },
                    zoom: {
                        drag: {
                            enabled: false,
                            modifierKey: 'ctrl',
                        },
                        wheel: {
                            enabled: true,
                            speed: 0.05,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        onZoomComplete: function (chart: any) {
                            const newScales =  { xmin: Math.round(chart.chart.scales.x.min), xmax: Math.round(chart.chart.scales.x.max) };
                            capturedThis.setState({
                                xscales: newScales
                            })
                            capturedThis.props.onGraphScalesChanged(newScales);
                        }

                    }
                },
                tooltip: {
                    position: 'nearest',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    caretSize: 10,
                    callbacks: {
                        label: function (context) {
                            const field: string = context.dataset.label || '';
                            const frame = capturedThis.props.renderedData.rendered_frames[context.parsed.x];
                            const value = frame[field].toFixed(3);
                            //@ts-ignore
                            const maxValue = capturedThis.props.renderedData.rendered_frames_meta[field].max;
                            const pcOfMax = (maxValue === 0 ? 0 : frame[field] / maxValue * 100).toFixed(2);
                            const label = `${context.dataset.label}: ${value} (${pcOfMax}% of max) `;

                            return label;
                        },
                        title: function (items) {
                            const frame = items[0].parsed.x;
                            const fps = capturedThis.props.renderedData.options.output_fps;
                            const bpm = capturedThis.props.renderedData.options.bpm;
                            return `Frame ${frame.toString()} [beat ${frameToBeats(frame, fps, bpm).toFixed(2)}; ${frameToSeconds(frame, fps).toFixed(2)}s]`
                        }
                    }

                },
                //@ts-ignore - additional plugin config data is not declated in type.
                dragData: {
                    round: 4,
                    showTooltip: true,
                    onDragStart: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        return !this.isDecimating() && this.isKeyframe(point.x);
                    },
                    onDrag: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        return !this.isDecimating() && this.isKeyframe(point.x);
                    },
                    onDragEnd: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        if (this.isDecimating() || !this.isKeyframe(point.x)) {
                            return false;
                        }
                        let field = this.props.displayedFields[datasetIndex];
                        let newValue = point.y;
                        if (this.props.as_percents) {
                            //@ts-ignore
                            const maxValue = this.props.renderedData.rendered_frames_meta[field].max;
                            newValue = point.y * maxValue / 100;
                        }
                        this.props.updateKeyframe(field, point.x, newValue);
                    },
                },
                scales: {
                    y: {
                        // disables datapoint dragging for the entire axis
                        dragData: false
                    },
                },
                click: {
                    addPoint: (index: number) => {
                        if (!this.isDecimating() && !this.isKeyframe(index)) {
                            this.props.addKeyframe(index);
                        }
                    }
                },
                annotation: {
                    annotations
                }
            },
        };

        let chartData: ChartData<'line'> = {
            datasets: [
                ...this.props.displayedFields.map((field) => {
                    return {
                        label: field,
                        data: this.props.as_percents ? this.props.graphableData[field + "_pc"] : this.props.graphableData[field],
                        borderColor: fieldNametoRGBa(field, 255),
                        borderWidth: capturedThis.isDecimating() ? 1 : 0.25,
                        pointRadius: (ctx: ScriptableContext<'line'>) => {
                            // @ts-ignore
                            return capturedThis.isDecimating() ? 0 : this.isKeyframe(ctx.raw?.x) ? 6 : 2
                        },
                        // @ts-ignore
                        pointBackgroundColor: (ctx: ScriptableContext<'line'>) => capturedThis.isKeyframeWithFieldValue(field, ctx.raw?.x) ? fieldNametoRGBa(field, 1) : fieldNametoRGBa(field, 0.2),
                        backgroundColor: fieldNametoRGBa(field, 255),
                        // @ts-ignore
                        pointStyle: (ctx: ScriptableContext<'line'>) => (!capturedThis.isDecimating() && capturedThis.isKeyframe(ctx.raw?.x)) ? 'circle' : 'cross',
                    }
                })
            ]
        };

        // console.log("Markers", this.props.markers);
        // console.log("Annotations", annotations);
        return <Line options={options} data={chartData} />;
    }
}
