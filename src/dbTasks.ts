// exports a function that kicks off the dbWorker worker threads.
export default function runDbTasks() {

    //@ts-ignore - vs code complaining about import.meta, but it works.
    const docTimestampWorker = new Worker(new URL('dbWorker-docLastModified.ts', import.meta.url));
    docTimestampWorker.onmessage = (e: any) => {
        console.log(`DB task progress: ${(100 * e.data.progress).toFixed(2)}%`);
    };
    docTimestampWorker.onerror = (e: any) => {
        console.error("DB task error: ", e);
    }

    docTimestampWorker.postMessage({});
}