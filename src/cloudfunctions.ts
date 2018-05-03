import { google } from "googleapis";
import { logFields } from "./shared";
import humanStringify from "human-stringify";

const cloudFunctions = google.cloudfunctions("v1");

const zone = "us-west1-a";

async function main() {
    const operation = await cloudFunctions.projects.locations.functions.create({
        location: "foo",
        resource: {
            name: "foo",
            entryPoint: "foo",
            sourceRespository: {}
        }
    });

    const list = await cloudFunctions.projects.locations.functions.list({ parent: "" });
    for (const fn of list.data.functions) {
        logFields(fn, ["name", "status", "entryPoint", "timeout"]);
    }
}
