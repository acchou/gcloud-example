import Storage = require("@google-cloud/storage");
import Compute from "./compute.js";

const compute = new Compute();

const storage = Storage();

async function main() {
    try {
        const [bucket] = await storage.createBucket("foo");
        console.log(`created bucket ${bucket}`);
    } catch (err) {
        console.warn(`EXCEPTION: `);
        console.warn(err);
    }
}

main();
