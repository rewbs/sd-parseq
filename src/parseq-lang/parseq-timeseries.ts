import * as d3 from 'd3';
import _ from 'lodash';
import { deflate } from 'pako';
import { base64_arraybuffer } from '../utils/utils';
import { LTTB } from 'downsample';
export interface TimeSeriesData {
    x: number;
    y: number;
}

export enum TimestampType {
    Frame,
    Millisecond,
}

export enum InterpolationType {
    Step,
    Linear,
    CubicSpline,
}

export class TimeSeries {

    private static readonly MAX_DATA_POINTS = 2000;

    readonly data: TimeSeriesData[] = [];
    readonly timestampType: TimestampType;

    constructor(data: TimeSeriesData[], timestampType: TimestampType) {
        this.data = data;
        this.timestampType = timestampType;
    }

    static fromPoints(points: { x: number; y: number; }[], timestampType: TimestampType) {
        const decimatedPoints = LTTB(points, this.MAX_DATA_POINTS);
        return new TimeSeries(Array.from(decimatedPoints) as TimeSeriesData[], timestampType);
    }

    public static loadSingleSeries(
        rawData: number[],
        intervalMs: number
    ): TimeSeries {

        const tempData: TimeSeriesData[] = rawData
            .map((value, idx) => ({
                x: idx * intervalMs,
                y: value,
            }));

        const data = Array.from(LTTB(tempData, this.MAX_DATA_POINTS)) as TimeSeriesData[];

        return new TimeSeries(data, TimestampType.Millisecond);
    }

    public static loadFromCSV(
        file: File,
        timestampType: TimestampType
    ): Promise<TimeSeries> {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader();
            fileReader.onload = async (event) => {
                const rawData = d3.csvParseRows(event.target?.result as string);

                const tempData: TimeSeriesData[] = rawData.map((row) => ({
                    x: Number(row[0]),
                    y: Number(row[1]),
                }));

                const data = Array.from(LTTB(tempData, this.MAX_DATA_POINTS)) as TimeSeriesData[];

                const timeSeries = new TimeSeries(data, timestampType);
                resolve(timeSeries);
                return timeSeries;
            };

            fileReader.onerror = () => {
                reject(new Error('Error reading CSV file.'));
            };

            fileReader.readAsText(file);
        });
    }

    public DEBUG_findNaNs() {
        const NaNs = this.data.filter(({x,y}) => isNaN(x) || isNaN(y) || x === null || y===null || x===undefined || y ===undefined);
        console.log("NaNs:", NaNs);
        return NaNs;
    }

    public normalize(targetMin: number, targetMax: number): TimeSeries {
        if (this.data.length === 0) {
            return this;
        }

        const minValue = Math.min(...this.data.map((point) => point.y));
        const maxValue = Math.max(...this.data.map((point) => point.y));

        const range = maxValue - minValue;
        const targetRange = targetMax - targetMin;

        if (range === 0) {
            return new TimeSeries(
                this.data.map(({ x }) => ({ x, y: targetMin })),
                this.timestampType
            );
        }

        const normalizedData = this.data.map(({ x, y }) => ({
            x,
            y: ((y - minValue) / range) * targetRange + targetMin,
        }));

        return new TimeSeries(normalizedData, this.timestampType);
    }

    // TODO: store timeseries as compressed binary data
    public compress() {
        console.time("binary");
        const xs = Float32Array.from(this.data.map(({ x }) => x)).buffer;
        const ys = Float32Array.from(this.data.map(({ y }) => y)).buffer;
        console.timeEnd("binary");

        console.time("b64-binary");
        Promise.all([base64_arraybuffer(new Uint8Array(xs)), base64_arraybuffer(new Uint8Array(ys))]).then((compressedData) => {
            console.timeEnd("b64-binary");
            console.log("Binary: ", JSON.stringify(this.data).length, JSON.stringify(compressedData).length);
        })

        console.time("compress");
        const compressedXs = deflate(xs);
        const compressedYs = deflate(ys);
        console.timeEnd("compress");

        console.time("b64-compress");
        Promise.all([base64_arraybuffer(compressedXs), base64_arraybuffer(compressedYs)]).then((compressedData) => {
            console.timeEnd("b64-compress");
            console.log("Compression: ", JSON.stringify(this.data).length, JSON.stringify(compressedData).length);
        }) 
    }

    public limit(minValue: number, maxValue: number): TimeSeries {
        const limitedData = this.data.map(({ x, y }) => ({
            x: x,
            y: Math.min(Math.max(y, minValue), maxValue),
        }));

        return new TimeSeries(limitedData, this.timestampType);
    }

    public abs(): TimeSeries {
        const absData = this.data.map(({ x, y }) => ({
            x: x,
            y: Math.abs(y),
        }));

        return new TimeSeries(absData, this.timestampType);
    }

    movingAverage(windowSize: number): TimeSeries {
        if (windowSize <= 1) {
            return this;
        }

        const smoothedData: { x: number, y: number }[] = [];
        const halfWindowSize = Math.floor(windowSize / 2);

        for (let i = 0; i < this.data.length; i++) {
            const windowStart = Math.max(0, i - halfWindowSize);
            const windowEnd = Math.min(this.data.length, i + halfWindowSize);
            const windowData = this.data.slice(windowStart, windowEnd);

            const sum = windowData.reduce((acc, dp) => acc + dp.y, 0);
            const average = sum / windowData.length;

            smoothedData.push({ x: this.data[i].x, y: average });
        }

        return new TimeSeries(smoothedData, this.timestampType);

    }

    public filter(minValue: number, maxValue: number): TimeSeries {
        const filteredData = this.data.filter(
            (datum) => datum.y >= minValue && datum.y <= maxValue
        );

        return new TimeSeries(filteredData, this.timestampType);
    }

    public getValueAt(
        frame: number,
        framesPerSecond: number,
        interpolation: InterpolationType
    ): number | undefined {
        if (this.timestampType === TimestampType.Millisecond) {
            frame = (frame / framesPerSecond) * 1000;
        }

        const dataIndex = _.findIndex(this.data, (datum) => datum.x >= frame);

        if (dataIndex === -1) {
            return _.last(this.data)?.y;
        }

        if (dataIndex === 0) {
            return this.data[dataIndex].y;
        }

        const prevDatum = this.data[dataIndex - 1];
        const nextDatum = this.data[dataIndex];

        if (interpolation === InterpolationType.Step) {
            return prevDatum.y;
        }

        if (interpolation === InterpolationType.Linear) {
            const t = (frame - prevDatum.x) / (nextDatum.x - prevDatum.x);
            return prevDatum.y + t * (nextDatum.y - prevDatum.y);
        }
        
        return undefined;
    }
}