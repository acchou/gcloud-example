import Storage = require("@google-cloud/storage");

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
