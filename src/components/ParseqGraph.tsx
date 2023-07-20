import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import {
    CategoryScale, Chart as ChartJS, Legend, LegendItem, LinearScale, LineElement, PointElement, Title,
    Tooltip
} from 'chart.js';
import './chartjs-plugins/drag'
//@ts-ignore
import annotationPlugin from 'chartjs-plugin-annotation';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { fieldNametoRGBa, } from '../utils/utils';
import { frameToBeat, frameToSec } from '../utils/maths';
import zoomPlugin from 'chartjs-plugin-zoom';
import { DECIMATION_THRESHOLD } from '../utils/consts';
import debounce from 'lodash.debounce';
//@ts-ignore
import range from 'lodash.range';
import { RenderedData, GraphableData } from '../ParseqUI';
import { Theme } from '@mui/material';
import { SupportedColorScheme, experimental_extendTheme as extendTheme, useColorScheme } from "@mui/material/styles";
import { themeFactory } from "../theme";

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

// const ChartJSDetectDecimationPlugin = {
//     id: 'detectDecimation',
//     afterUpdate: function (chartInstance: any) {
//         // const pluginOptions = chartInstance.config.options.plugins.detectDecimation;
//         // // All my datasets have the same length, so I just check the first one
//         // // To generalize, you should check all datasets.
//         // const isDecimating = chartInstance.data.datasets[0]._data !== undefined
//         //     && chartInstance.data.datasets[0].data !== undefined
//         //     && chartInstance.data.datasets[0].data.length !== chartInstance.data.datasets[0]._data.length;
//         // const unDecimatedPointCount = isDecimating ? chartInstance.data.datasets[0]._data?.length : chartInstance.data.datasets[0].data.length;
//         // const decimatedPointCount = chartInstance.data.datasets[0].data.length;
//         // pluginOptions.onDecimation(isDecimating, unDecimatedPointCount, decimatedPointCount);
//     }
// }

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartJSAddPointPlugin,
//    ChartJSDetectDecimationPlugin,
    zoomPlugin,
    annotationPlugin
);

//@ts-ignore
//Interaction.modes.interpolate = Interpolate

class ParseqGraphRaw extends React.Component<{
    renderedData: RenderedData,
    graphableData: GraphableData,
    displayedFields: string[],
    as_percents: boolean,
    updateKeyframe: (field: string, index: number, value: number) => void;
    addKeyframe: (index: number) => void;
    clearKeyframe: (field: string, index: number) => void;
    onDecimation: (isDecimating: boolean, unDecimatedPointCount: number, decimatedPointCount: number) => void;
    onGraphScalesChanged: ({ xmin, xmax }: { xmin: number, xmax: number }) => void;
    promptMarkers: { x: number, label: string, color: string, top: boolean }[];
    beatMarkerInterval : number;
    gridCursorPos : number;
    audioCursorPos : number;
    xscales: { xmin: number, xmax: number };
    xaxisType: string
    height: number|string;
    editingDisabled?: boolean;
    hideLegend?: boolean;
    theme: Theme;
    colorScheme: SupportedColorScheme;
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

    isDecimating = (): boolean => {
        return (this.props.xscales.xmax - this.props.xscales.xmin) > DECIMATION_THRESHOLD;
    };

    render() {

        // TODO - annotation construction is horrible here, need some utility functions to reduce duplication.
        const promptAnnotations = this.props.promptMarkers.reduce((acc: any, marker: { x: number, label: string, color: string, top: boolean }, idx: number) => {
            return {
                ...acc,
                ['prompt' + idx]: {
                    type: 'line',
                    xMin: marker.x,
                    xMax: marker.x,
                    borderColor: marker.color,
                    borderDash: [5, 5],
                    borderWidth: 1,
                    label: {
                        display: true,
                        content: marker.label,
                        ...(marker.top ? { position: 'end', yAdjust: -5 } : { position: 'start', yAdjust: this.props.beatMarkerInterval > 0?-10:5 }),
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

        const gridCursorAnnotation = this.props.gridCursorPos >= 0 ? {
            gridCursor : {
                type: 'line',
            xMin: this.props.gridCursorPos,
            xMax: this.props.gridCursorPos,
            borderColor: 'rgba(200,0,100,0.6)',
            borderDash: [],
            borderWidth: 1,
            label: {
                display: true,
                content: 'Grid cursor',
                position: 'end',
                yAdjust: -5,
                font: { size: '8' },
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 3
            },
            callout: {
                display: true,
            }
        }
        } : {};

        const audioCursorAnnotation = this.props.audioCursorPos >= 0 ? {
            audioCursor : {
                type: 'line',
            xMin: this.props.audioCursorPos,
            xMax: this.props.audioCursorPos,
            borderColor: 'rgba(100,0,200,0.6)',
            borderDash: [],
            borderWidth: 1,
            label: {
                display: true,
                content: 'Audio cursor',
                position: 'end',
                yAdjust: -5,
                font: { size: '8' },
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: 3
            },
            callout: {
                display: true,
            }
        }
        } : {};

        const beatAnnotations = this.props.beatMarkerInterval > 0
            ? range(0, this.props.renderedData.rendered_frames.length - 1, this.props.beatMarkerInterval * this.props.renderedData.options.output_fps / (this.props.renderedData.options.bpm/60))
              .reduce((acc : any, x:number) => ({
                ...acc,
                ['beat' + x] : {
                    type: 'line',
                    xMin: x,
                    xMax: x,
                    borderColor: 'rgba(0,0,200,0.6)',
                    borderDash: [1],
                    borderWidth: 0.5,
                    label: {
                        display: true,
                        content: 'Beat ' + Math.round(x*frameToBeat(1, this.props.renderedData.options.output_fps, this.props.renderedData.options.bpm)),
                        position: 'start',
                        yAdjust: 5,
                        font: { size: '8' },
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        padding: 3
                    },
                    callout: {
                        display: true,
                    }
                }
            }), {})
            : {};
    
        const annotations = {
            ...promptAnnotations,
            ...audioCursorAnnotation,
            ...gridCursorAnnotation,
            ...beatAnnotations
        }

        if ((!this.props.renderedData.rendered_frames)) {
            //log.debug("Editable input not set.")
            return <></>;
        }

        const capturedThis = this;

        const xaxisLabel = (() => {
            switch (this.props.xaxisType) {
                case 'frames': return 'Frames';
                case 'seconds': return `Seconds (assuming ${this.props.renderedData.options.output_fps} fps)`;
                case 'beats': return `Beats (assuming ${this.props.renderedData.options.bpm} bpm and ${this.props.renderedData.options.output_fps} fps)`;
            }
        })();

        const onPanCompleteDebounced = debounce(function (chart: any) {
            const newScales = { xmin: Math.round(chart.chart.scales.x.min), xmax: Math.round(chart.chart.scales.x.max) };
            capturedThis.setState({
                xscales: newScales
            });
            capturedThis.props.onGraphScalesChanged(newScales);
        }, 100);


        const palette = this.props.theme.colorSchemes[this.props.colorScheme].palette;

        let options: ChartOptions<'line'> = {
            backgroundColor: palette.graphBackground.main,
            borderColor: palette.graphBorder.main,
            color: palette.graphFont.main,
            parsing: false,
            normalised: true,
            spanGaps: true,
            //aspectRatio: 4,
            maintainAspectRatio: false,
            responsive: true,
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
                        text: xaxisLabel
                    },
                    ticks: {
                        minRotation: 0,
                        maxRotation: 0,
                        callback: function (value, index, ticks) {
                            switch (capturedThis.props.xaxisType) {
                                case 'frames': return Number(value).toFixed(0);
                                case 'seconds': return frameToSec(Number(value), capturedThis.props.renderedData.options.output_fps).toFixed(3);
                                case 'beats': return frameToBeat(Number(value), capturedThis.props.renderedData.options.output_fps, capturedThis.props.renderedData.options.bpm).toFixed(2);
                            }
                        },
                        color: palette.graphFont.main,
                    },
                    grid: {
                        color: palette.graphBorder.main,
                    }
                },
                y: {
                    type: 'linear',
                    ticks: {
                        minRotation: 0,
                        maxRotation: 0,
                        color: palette.graphFont.main,
                    },
                    grid: {
                        color: palette.graphBorder.main,
                    }

                },
            },
            onClick: (event: any, elements: any, chart: any) => {
                if (!capturedThis.props.editingDisabled && !capturedThis.isDecimating() && elements[0] && event.native.shiftKey) {
                    const datasetIndex = elements[0].datasetIndex;
                    const field = chart.data.datasets[datasetIndex].label;
                    const index = Math.round(chart.scales.x.getValueForPixel(event.x));
                    this.props.clearKeyframe(field, index);
                }
            },
            plugins: {
                legend: {
                    position: 'top' as const,
                    display: !this.props.hideLegend,
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
                // detectDecimation: {
                //     onDecimation: this.props.onDecimation
                // },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'x',
                        //modifierKey: 'alt',
                        onPanComplete: onPanCompleteDebounced
                    },
                    limits: {
                        x: { min: 0, max: capturedThis.props.renderedData.rendered_frames.length - 1, minRange: 10 },
                    },
                    zoom: {
                        drag: {
                            enabled: false,
                            modifierKey: 'shift',
                        },
                        wheel: {
                            enabled: true,
                            modifierKey: 'alt',
                            speed: 0.05,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                        onZoomComplete: function (chart: any) {
                            const newScales = { xmin: Math.round(chart.chart.scales.x.min), xmax: Math.round(chart.chart.scales.x.max) };
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
                            return `Frame ${frame.toString()} [beat ${frameToBeat(frame, fps, bpm).toFixed(2)}; ${frameToSec(frame, fps).toFixed(2)}s]`
                        }
                    }

                },
                //@ts-ignore - additional plugin config data is not declated in type.
                dragData: {
                    round: 4,
                    showTooltip: true,
                    onDragStart: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        return !this.props.editingDisabled && !this.isDecimating() && this.isKeyframe(point.x);
                    },
                    onDrag: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        return !this.props.editingDisabled && !this.isDecimating() && this.isKeyframe(point.x);
                    },
                    onDragEnd: (e: MouseEvent, datasetIndex: number, index: number, point: { x: number, y: number }) => {
                        if (this.props.editingDisabled || this.isDecimating() || !this.isKeyframe(point.x)) {
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

        return <div style={{height:this.props.height, width:'100%', position:"relative"}}><Line options={options} data={chartData} /></div>;
    }
}

// Wrap class component to be able to access theme - see https://reactnavigation.org/docs/use-theme/#using-with-class-component
export const ParseqGraph = function(props : any) {
  const theme = extendTheme(themeFactory());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { colorScheme, setColorScheme } = useColorScheme();
  return <ParseqGraphRaw {...props} theme={theme} colorScheme={colorScheme} />;
}