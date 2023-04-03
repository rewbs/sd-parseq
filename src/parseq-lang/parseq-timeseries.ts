import * as d3 from 'd3';
import * as _ from 'lodash';

export interface TimeSeriesData {
    timestamp: number;
    value: number;
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
    readonly data: TimeSeriesData[] = [];
    private readonly timestampType: TimestampType;
    private static readonly MAX_DATA_POINTS = 2000;

    private constructor(data: TimeSeriesData[], timestampType: TimestampType) {
        this.data = data;
        this.timestampType = timestampType;
    }

      public static loadFromCSV(
        file: File,
        maxOffset: number,
        timestampType: TimestampType
      ): Promise<TimeSeries> {
        return new Promise((resolve, reject) => {
          const fileReader = new FileReader();
          fileReader.onload = async (event) => {
            const rawData = d3.csvParseRows(event.target?.result as string);
      

            const tempData: TimeSeriesData[] = rawData.map((row) => ({
                timestamp: Number(row[0]),
                value: Number(row[1]),
            }));
    
            const decimationFactor = Math.ceil(tempData.length / TimeSeries.MAX_DATA_POINTS);
            const data = tempData.filter((_, index) => index % decimationFactor === 0);
    
            const truncatedData = TimeSeries.truncateData(data, maxOffset);
      
            const timeSeries = new TimeSeries(truncatedData, timestampType);
            resolve(timeSeries);
            return timeSeries;
          };
      
          fileReader.onerror = () => {
            reject(new Error('Error reading CSV file.'));
          };
      
          fileReader.readAsText(file);
        });
      }
      

    private static truncateData(data: TimeSeriesData[], maxOffset: number): TimeSeriesData[] {
        return data.filter((datum) => datum.timestamp <= maxOffset);
    }

    public normalize(): TimeSeries {
        const minValue = _.minBy(this.data, (datum) => datum.value)?.value || 0;
        const maxValue = _.maxBy(this.data, (datum) => datum.value)?.value || 1;

        const normalizedData = this.data.map((datum) => ({
            timestamp: datum.timestamp,
            value: (datum.value - minValue) / (maxValue - minValue),
        }));

        return new TimeSeries(normalizedData, this.timestampType);
    }

    public limit(minValue: number, maxValue: number): TimeSeries {
        const limitedData = this.data.map((datum) => ({
            timestamp: datum.timestamp,
            value: Math.min(Math.max(datum.value, minValue), maxValue),
        }));

        return new TimeSeries(limitedData, this.timestampType);
    }

    public filter(minValue: number, maxValue: number): TimeSeries {
        const filteredData = this.data.filter(
            (datum) => datum.value >= minValue && datum.value <= maxValue
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

        const dataIndex = _.findIndex(this.data, (datum) => datum.timestamp >= frame);

        if (dataIndex === -1 || dataIndex === 0) {
            return undefined;
        }

        const prevDatum = this.data[dataIndex - 1];
        const nextDatum = this.data[dataIndex];

        if (interpolation === InterpolationType.Step) {
            return prevDatum.value;
        }

        if (interpolation === InterpolationType.Linear) {
            const t = (frame - prevDatum.timestamp) / (nextDatum.timestamp - prevDatum.timestamp);
            return prevDatum.value + t * (nextDatum.value - prevDatum.value);
        }

        // if (interpolation === InterpolationType.CubicSpline) {
        //     const prevPrevDatum = dataIndex > 1 ? this.data[dataIndex - 2] : prevDatum;
        //     const nextNextDatum = dataIndex < this.data.length - 1 ? this.data[dataIndex + 1] : nextDatum;

        //     const t = (frame - prevDatum.timestamp) / (nextDatum.timestamp - prevDatum.timestamp);

        //     return _.clamp(
        //         _.interpolateCubic(
        //             t,
        //             prevPrevDatum.value,
        //             prevDatum.value,
        //             nextDatum.value,
        //             nextNextDatum.value
        //         ),
        //         _.min([prevDatum.value, nextDatum.value]),
        //         _.max([prevDatum.value, nextDatum.value])
        //     );
        // }

        return undefined;
    }
}