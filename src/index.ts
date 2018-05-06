import humanStringify from "human-stringify";
import { main as computeMain } from "./compute";
import { main as sourceRepoMain } from "./sourcerepo";
import { main as serviceManagementMain } from "./servicemanagement";
import { main as cloudFunctionsMain } from "./cloudfunctions";
import { initializeGoogleAPIs } from "./shared";

async function main() {
    // await computeMain();
    // await sourceRepoMain();
    // await serviceManagementMain();
    await cloudFunctionsMain().catch(err => console.error(`Error: ${err}`));
}

main();
