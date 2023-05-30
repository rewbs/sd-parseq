import { useState } from "react";
import { DocId } from "./ParseqUI";
import { parseqLoad } from "./parseq-loader";
import { parseqRender } from "./parseq-renderer";
import { queryStringGetOrCreate } from "./utils/utils";

const Raw = () => {

    const [renderedJSON, setRenderedJSON] = useState("");
    const docId = queryStringGetOrCreate('docId', () => 'dummy-doc-id');

    parseqLoad(docId as DocId, "", true).then((loaded) => {
        const results = parseqRender(loaded.loadedDoc);
        setRenderedJSON( JSON.stringify(results.renderedData, null, 2) );
    });
    
    return renderedJSON;
}

export default Raw; 