import * as d3 from 'd3';
import * as _ from 'lodash';


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
        return new TimeSeries(_.cloneDeep(points), timestampType);
    }

    public static loadSingleSeries(
        rawData: number[],
        intervalMs: number
    ): TimeSeries {

        const decimationFactor = Math.ceil(rawData.length / TimeSeries.MAX_DATA_POINTS);

        const data: TimeSeriesData[] = rawData
            .filter((_, index) => index % decimationFactor === 0)
            .map((value, idx) => ({
                x: idx * decimationFactor * intervalMs,
                y: value,
            }));

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

                const decimationFactor = Math.ceil(tempData.length / TimeSeries.MAX_DATA_POINTS);
                const data = tempData.filter((_, index) => index % decimationFactor === 0);

                //const truncatedData = TimeSeries.truncateData(data, maxOffset);

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

    public normalize(targetMin: number = 0, targetMax: number = 1): TimeSeries {
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