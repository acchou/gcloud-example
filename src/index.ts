import Storage = require("@google-cloud/storage");
import Compute from "@google-cloud/compute";

const compute = new Compute();

const zone = compute.zone("us-west1");
const vmName = "derivative-instance-1";

const storage = Storage();

async function main() {
    try {
        const [vm, operation] = await zone.createVM(vmName);
        await operation;

        const [bucket] = await storage.createBucket("foo");
        console.log(`created bucket ${bucket}`);
    } catch (err) {
        console.warn(`EXCEPTION: `);
        console.warn(err);
    }
}

main();
