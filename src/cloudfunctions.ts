import { google } from "googleapis";
import { initializeGoogleAPIs, logFields } from "./shared";
import humanStringify from "human-stringify";

const cloudFunctions = google.cloudfunctions("v1");
const zone = "us-west1-a";

async function main() {
    const zone = "us-west1-a";
    await initializeGoogleAPIs(zone);
    console.log(`Initialized Google APIs`);
    const list = await cloudFunctions.projects.locations.functions.list({ parent: "" });
    for (const fn of list.data.functions) {
        logFields(fn, ["name", "status", "entryPoint", "timeout"]);
    }
}

main();
