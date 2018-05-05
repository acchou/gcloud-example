import {
    logFields,
    initializeGoogleAPIs,
    googlePagedIterator,
    unwrap,
    poll
} from "./shared";
import humanStringify from "human-stringify";
import { GoogleApis, google } from "googleapis";
import {
    Cloudfunctions as GoogleCloudFunctions,
    Schema$Operation
} from "googleapis/build/src/apis/cloudfunctions/v1";

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
        // XXX
        const operation = await this.gCloudFunctions.projects.locations.functions.create({
            location: "foo",
            resource: {
                name: "foo",
                entryPoint: "foo",
                sourceRespository: {}
            }
        });
    }

    callFunction(name: string, data: string) {
        return unwrap(
            this.gCloudFunctions.projects.locations.functions.call({
                name,
                resource: { data }
            })
        );
    }

    async deleteFunction(name: string) {
        const response = await this.gCloudFunctions.projects.locations.functions.delete({
            name
        });

        return this.waitFor(response.data);
    }

    async waitFor(operation: string | Schema$Operation) {
        const name = typeof operation === "string" ? operation : operation.name;
        return poll({
            request: () => this.getOperation(name),
            checkDone: result => result.done
        });
    }

    getOperation(name: string) {
        return unwrap(this.gCloudFunctions.operations.get({ name }));
    }

    async *listOperations(name: string) {
        yield* googlePagedIterator(pageToken =>
            this.gCloudFunctions.operations.list({ name, pageToken })
        );
    }

    async *listLocations(name: string) {
        yield* googlePagedIterator(pageToken =>
            this.gCloudFunctions.projects.locations.list({ name, pageToken })
        );
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
