import { google } from "googleapis";
import humanStringify from "human-stringify";

const compute = google.compute("v1");

//const zone = compute.zone("us-west1-a");
const vmName = "derivative-instance-1";

const zone = "us-west1-a";

async function main() {
    try {
        const auth = await google.auth.getClient({
            scopes: ["https://www.googleapis.com/auth/compute"]
        });

        const project = await google.auth.getDefaultProjectId();

        const response = await compute.instances.list({ auth, project, zone });
        console.log(`Instances list response: ${humanStringify(response)}`);
        for (const instance of response.data.items) {
            console.log(instance);
        }
    } catch (err) {
        console.warn(`EXCEPTION: `);
        console.warn(err);
    }
}

main();
