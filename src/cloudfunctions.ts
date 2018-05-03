import { logFields, initializeGoogleAPIs, googlePagedIterator } from "./shared";
import humanStringify from "human-stringify";
import { GoogleApis, google } from "googleapis";
import { Cloudfunctions as GoogleCloudFunctions } from "googleapis/build/src/apis/cloudfunctions/v1";

const zone = "us-west1-a";

class CloudFunctions {
    gCloudFunctions: GoogleCloudFunctions;
    constructor(google: GoogleApis) {
        this.gCloudFunctions = google.cloudfunctions("v1");
    }

    async *listFunctions(parent: string) {
        yield* googlePagedIterator(pageToken =>
            this.gCloudFunctions.projects.locations.functions.list({
                parent,
                pageToken
            })
        );
    }

    async createFunction() {
        const operation = await this.gCloudFunctions.projects.locations.functions.create({
            location: "foo",
            resource: {
                name: "foo",
                entryPoint: "foo",
                sourceRespository: {}
            }
        });
    }
}

async function main() {
    const google = await initializeGoogleAPIs();
    const project = await google.auth.getDefaultProjectId();
    const cloudFunctions = new CloudFunctions(google);

    const responses = cloudFunctions.listFunctions(`projects/${project}/locations/-`);
    for await (const response of responses) {
        for (const func of response.functions) {
            console.log(humanStringify(func, { maxDepth: 1 }));
        }
    }
}
