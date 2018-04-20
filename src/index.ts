import Storage = require("@google-cloud/storage");
import Compute = require("@google-cloud/compute");

const storage = Storage();
const compute = new Compute();

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
