import { ParseqDoc, VersionId } from './ParseqUI';
import { db } from './db';

const run = async () => {
    const totalDocs = await db.parseqDocs.count();
    const docsToProcress = await db.parseqDocs
        .filter((doc: ParseqDoc) => doc.timestamp === undefined || doc.latestVersionId === undefined)
        .toArray();
    
    console.log(`DB upgrade: docs without timestamp ${docsToProcress.length}/${totalDocs}`);

    let processedDocs = 0;
    try {
        docsToProcress.forEach((doc: ParseqDoc) => {
            let lastModified: number | undefined = undefined;
            let latestVersionId: VersionId | undefined = undefined;
            db.parseqVersions.where('docId').equals(doc.docId).each((version) => {
                if (doc.docId !== version.docId) {
                    throw new Error(`DB upgrade: version ${version.versionId} has docId ${version.docId} but should have docId ${doc.docId}`);
                };
                if (lastModified === undefined || version.timestamp > lastModified) {
                    lastModified = version.timestamp;
                    latestVersionId = version.versionId;
                }
            }).catch((error) => {
                console.error("DB upgrade: Error running DB task for doc: ", doc.name, error);
            }).then(() => {
                if (lastModified) {
                    console.log(`DB upgrade: storing timestamp for '${doc.name}': ${new Date(lastModified).toLocaleString("en-GB", { dateStyle: 'full', timeStyle: 'medium' })} (${latestVersionId})`);
                    db.parseqDocs.update(doc.docId, { timestamp: lastModified, latestVersionId: latestVersionId  });
                } else {
                    console.log(`DB upgrade: '${doc.name}' has no versions. Consider running DB cleanup to delete docs with no versions`);
                }
                const progress = ++processedDocs / docsToProcress.length;
                postMessage({
                    status: (progress === 1) ? "done" : "processing",
                    progress: progress,
                });
            });
        })
    } catch (error) {
        console.error("DB upgrade: Error running DB task: ", error);
    }
}

onmessage = (e) => {
    run();
}