import _ from "lodash";
import { loadVersion } from "./DocManager";
import { DocId, ParseqDocVersion, VersionId } from "./ParseqUI";
import {compareParseqDocState} from "./utils/utils";

export class ParseqUndoManager {

    docId : DocId;
    versionStack: {versionId: VersionId, changes: string[]}[] = []; //Most recent version at index 0.
    lastRecovered: ParseqDocVersion | undefined;

    constructor(docId : DocId) {
        this.docId = docId;
    }

    trackVersion(versionId : VersionId, changes: string[]) : void {
        this.versionStack.unshift({versionId, changes});
        this.lastRecovered = undefined;
    }

    undo(doRecovery : (version: ParseqDocVersion) => void) : void {
        let idxToRecover = this.versionStack.findIndex((v) => v.versionId === this.lastRecovered?.versionId) + 1;
        if (idxToRecover === 0) {
            // If this is the first undo, don't recover to current version, recover to previous version.
            idxToRecover = 1;
        }
        console.log("idxToRecover: " + idxToRecover);
        if (idxToRecover >= this.versionStack.length) {
          console.log("Cannot undo any further - try using the revert dialog.")
          return;
        }
        this.recoverIndex(idxToRecover, doRecovery);
    }

    redo(doRecovery : (version: ParseqDocVersion) => void) {
        const idxToRecover = this.versionStack.findIndex((v) => v.versionId === this.lastRecovered?.versionId) - 1;
        console.log("idxToRecover: " + idxToRecover);
        if (idxToRecover < 0) {
          console.log("Cannot redo any further - try using the revert dialog.")
          return;
        }
        this.recoverIndex(idxToRecover, doRecovery);
    }

    compareToLastRecovered(newVersion : ParseqDocVersion) : string[] {
        if (this.lastRecovered) {
            return compareParseqDocState(this.lastRecovered, newVersion);
        } else {
            return ['All fields changed'];
        }
    }    

    private recoverIndex(idxToRecover : number, doRecovery : (version: ParseqDocVersion) => void) {
        const versionToRecover = this.versionStack[idxToRecover];
        loadVersion(this.docId, versionToRecover.versionId).then((loaded) => {
            if (loaded) {
                this.lastRecovered  = _.cloneDeep(loaded);
                doRecovery(loaded)
            } else {
                console.log("Could not load version " + versionToRecover);
            }
          });         
    }

    confessUndoStack() : {versionId: VersionId, changes: string[], current : boolean}[] {
        return this.versionStack.map((v, idx) => {
            return {
                versionId: v.versionId,
                changes: v.changes,
                current: this.lastRecovered ? idx === this.versionStack.findIndex((v) => v.versionId === this.lastRecovered?.versionId) : false
            }
        });
    }

}