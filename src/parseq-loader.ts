//@ts-ignore
import _ from 'lodash';
import { DEFAULT_OPTIONS } from './utils/consts';
import { addDoc, loadVersion, makeDocId, saveVersion } from "./DocManager";
import { DocId, ParseqDocVersion, VersionId } from "./ParseqUI";
import { defaultFields } from './data/fields';
import { templates } from './data/templates';
import { navigateToDocId, deleteQsParams } from "./utils/utils";

const fillWithDefaults = (possiblyIncompleteContent: ParseqDocVersion, defaultTemplate: string): ParseqDocVersion => {
    if (!possiblyIncompleteContent.prompts) {
        possiblyIncompleteContent.prompts = _.cloneDeep(templates[defaultTemplate].template.prompts);
    }
    if (!possiblyIncompleteContent.keyframes) {
        possiblyIncompleteContent.keyframes = _.cloneDeep(templates[defaultTemplate].template.keyframes);
    }
    if (!possiblyIncompleteContent.managedFields) {
        console.log("Document does not specify managed fields. Assuming all fields are managed.");
        possiblyIncompleteContent.managedFields = defaultFields.map(f => f.name);
    }
    if (!possiblyIncompleteContent.displayedFields) {
        possiblyIncompleteContent.displayedFields = possiblyIncompleteContent.managedFields.length <= 5
            ? _.cloneDeep(possiblyIncompleteContent.managedFields)
            : possiblyIncompleteContent.managedFields.slice(0, 5);
    }
    if (!possiblyIncompleteContent.timeSeries) {
        possiblyIncompleteContent.timeSeries = [];
    }
    if (!possiblyIncompleteContent.keyframeLock) {
        possiblyIncompleteContent.keyframeLock = "frames";
    }

    // For options we want to merge the defaults with the existing options.
    possiblyIncompleteContent.options = { ...DEFAULT_OPTIONS, ...(possiblyIncompleteContent.options || {}) };
    return possiblyIncompleteContent;
};

const validateAndMassageContent = (loadedContent: ParseqDocVersion | undefined, defaultTemplate: string): ParseqDocVersion => {
    if (!loadedContent) {
        console.log("Falling back to default template:", defaultTemplate);
        loadedContent = templates[defaultTemplate].template as ParseqDocVersion;
    }
    const filledContent = fillWithDefaults(loadedContent, defaultTemplate);
    return filledContent
};

type ParseqLoadResult = {
    loadedDoc: ParseqDocVersion,
    redirect: string,
    status: {}
}

export const parseqLoad = async (docId: DocId, defaultTemplate: string, keepQs : boolean=false): Promise<ParseqLoadResult> => {
    const qps = new URLSearchParams(window.location.search);
    const qsLegacyContent = qps.get("parseq") || qps.get("parsec");
    const qsTemplate = qps.get("templateId");
    const [qsImportRemote, qsRemoteImportToken] = [qps.get("importRemote"), qps.get("token")];
    const [qsCopyLocalDoc, qsCopyLocalVersion] = [qps.get("copyLocalDoc"), qps.get("copyLocalVersion")];

    let loadedDoc: ParseqDocVersion | undefined = undefined;
    let redirect = "";
    let status = {};

    if (qsLegacyContent) {
        // Attempt to load content from querystring 
        // NOTE: This is mostly to support small test cases and legacy parseq URLs.
        // Doesn't work in all browsers with large data.
        try {
            loadedDoc = JSON.parse(qsLegacyContent);
            status = { severity: "info", message: "Started new document from Parseq data in query string." };
        } catch (e: any) {
            status = { severity: "error", message: "Could not parse Parseq data from query string: " + e.toString() + ". Using default starting template." };
        } finally {
            keepQs || deleteQsParams(['parsec', 'parseq']);
        }
    } else if (qsTemplate) {
        // Load from a template 
        try {
            if (templates[qsTemplate]) {
                loadedDoc = validateAndMassageContent(templates[qsTemplate].template as ParseqDocVersion, defaultTemplate);
                status = { severity: "info", message: `Started new document from template "${qsTemplate}".` };
            } else {
                throw new Error(`Could not find template "${qsTemplate}"`);
            }
        } catch (e: any) {
            status = { severity: "error", message: `Error loading from template: ${e.toString()}. Using default starting template.` };
        } finally {
            keepQs || deleteQsParams(['templateId']);
        }
    } else if (qsImportRemote && qsRemoteImportToken) {
        // Import from a remote document
        //setInitStatus({ severity: "warning", message: "Importing remote document..." });
        const encodedImport = encodeURIComponent(qsImportRemote);
        const importUrl = `https://firebasestorage.googleapis.com/v0/b/sd-parseq.appspot.com/o/shared%2F${encodedImport}?alt=media&token=${qsRemoteImportToken}`
        try {
            const response = await fetch(importUrl);
            if (response.ok) {
                const json = await response.json();
                loadedDoc = validateAndMassageContent(json, defaultTemplate);
                status = { severity: "success", message: "Successfully imported remote document." };
            } else {
                throw new Error(`${importUrl} returned ${response.status} ${response.statusText}`);
            }
        } catch (error: any) {
            console.error(error);
            status = { severity: "error", message: `Failed to import document: ${error.toString()}. Using default starting template.` };
        } finally {
            keepQs || deleteQsParams(['importRemote', 'token']);
        }
    } else if (qsCopyLocalDoc || qsCopyLocalVersion) {
        // Clone local doc        
        //setInitStatus({ severity: "warning", message: "Cloning local doc..." });
        try {
            const loadedVersion = await loadVersion(qsCopyLocalDoc as (DocId | undefined), qsCopyLocalVersion as (VersionId | undefined));
            if (!loadedVersion) {
                throw new Error(`Couldn't load doc/version ${qsCopyLocalDoc}/${qsCopyLocalVersion} for copying.`);
            }

            // Rather than just loading the content into the current view, we're going to create a new doc, save it, and then navigate to it.
            // We do this so that we can control the document title.
            const newDoc = {
                name: `${loadedVersion.meta.docName} (cloned ${new Date().toLocaleString("en-GB", { dateStyle: 'short', timeStyle: 'short' })})`,
                docId: makeDocId(),
                timestamp: Date.now(),
                latestVersionId: undefined
            };
            await addDoc(newDoc);
            await saveVersion(newDoc.docId, loadedVersion);
            navigateToDocId(newDoc.docId, [{ k: "successMessage", v: `New document cloned from ${loadedVersion.meta.docName}.` }]);

        } catch (error: any) {
            console.error(error);
            status = { severity: "error", message: `Failed to clone local document ${qsCopyLocalDoc}: ${error.toString()}. Using default starting template.` };
        } finally {
            keepQs || deleteQsParams(['copyLocalDoc', 'copyLocalVersion']);
        };
    } else {
        loadedDoc = await loadVersion(docId);
        if (!loadedDoc) {
            status = { severity: "info", message: `Started a new Parseq document.` };
        }
    }

    if (qps.get("successMessage")) {
        status = { severity: "success", message: qps.get("successMessage") };
        keepQs || deleteQsParams(['successMessage']);
    }

    return {
        loadedDoc: validateAndMassageContent(loadedDoc, defaultTemplate),
        redirect,
        status
    }
}


