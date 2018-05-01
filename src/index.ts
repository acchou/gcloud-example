import Storage = require("@google-cloud/storage");

import { google } from "googleapis";

const compute = google.compute("v1");

//const zone = compute.zone("us-west1-a");
const vmName = "derivative-instance-1";

const storage = Storage();

async function main() {
    try {
        // const instances = await compute.instances.();

        const [bucket] = await storage.createBucket("foo");
        console.log(`created bucket ${bucket}`);
    } catch (err) {
        console.warn(`EXCEPTION: `);
        console.warn(err);
    }
}

main();
