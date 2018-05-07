import humanStringify from "human-stringify";
import { main as computeMain } from "./compute";
import { main as sourceRepoMain } from "./sourcerepo";
import { main as serviceManagementMain } from "./servicemanagement";
import { main as cloudFunctionsMain } from "./cloudfunctions";
import { initializeGoogleAPIs } from "./shared";
import Axios, { AxiosResponse, AxiosPromise } from "axios";

async function main() {
    // await computeMain();
    // await sourceRepoMain();
    // await serviceManagementMain();
    await cloudFunctionsMain().catch(err => {
        if (err.response && err.response.data) {
            console.error(humanStringify(err.response.data, { maxDepth: 5 }));
            const response = err as AxiosResponse;
            console.error(humanStringify(response.statusText, { maxDepth: 5 }));
        } else {
            console.error(err.stack);
        }
    });
}

main();
