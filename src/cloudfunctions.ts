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
    Schema$Operation,
    Schema$CloudFunction
} from "googleapis/build/src/apis/cloudfunctions/v1";
import * as fs from "fs";
import Axios from "axios";

const zone = "us-west1-a";

class CloudFunctions {
    gCloudFunctions: GoogleCloudFunctions;
    project: string;

    constructor(google: GoogleApis, project: string) {
        this.gCloudFunctions = google.cloudfunctions("v1");
        this.project = project;
    }

    async waitFor(operation: string | Schema$Operation) {
        const name = typeof operation === "string" ? operation : operation.name;
        return poll({
            request: () => this.getOperation(name),
            checkDone: result => result.done,
            operation: name,
            verbose: true
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

    callFunction(name: string, data: string) {
        return unwrap(
            this.gCloudFunctions.projects.locations.functions.call({
                name,
                resource: { data }
            })
        );
    }

    async createFunction(location: string, func: Partial<Schema$CloudFunction>) {
        const operation = await this.gCloudFunctions.projects.locations.functions.create({
            location,
            resource: func
        });

        return this.waitFor(operation.data);
    }

    async deleteFunction(name: string) {
        const response = await this.gCloudFunctions.projects.locations.functions.delete({
            name
        });

        return this.waitFor(response.data);
    }

    generateDownloadUrl(name: string, versionId?: string) {
        return unwrap(
            this.gCloudFunctions.projects.locations.functions.generateDownloadUrl({
                name,
                resource: { versionId }
            })
        );
    }

    generateUploaddUrl(parent: string) {
        return unwrap(
            this.gCloudFunctions.projects.locations.functions.generateUploadUrl({
                parent
            })
        );
    }

    getFunction(name: string) {
        return unwrap(this.gCloudFunctions.projects.locations.functions.get({ name }));
    }

    async *listFunctions(parent: string) {
        yield* googlePagedIterator(pageToken =>
            this.gCloudFunctions.projects.locations.functions.list({
                parent,
                pageToken
            })
        );
    }

    locationPath(location: string) {
        return `projects/${this.project}/locations/${location}`;
    }

    functionPath(location: string, funcname: string) {
        return `projects/${this.project}/locations/${location}/functions/${funcname}`;
    }

    async patchFunction(
        name: string,
        updateMask: string,
        func: Partial<Schema$CloudFunction>
    ) {
        const response = await this.gCloudFunctions.projects.locations.functions.patch({
            name,
            updateMask,
            resource: func
        });
        return this.waitFor(response.data);
    }
}

async function main() {
    const google = await initializeGoogleAPIs();
    const project = await google.auth.getDefaultProjectId();
    const cloudFunctions = new CloudFunctions(google, project);

    const locationName = "default";
    const locationPath = cloudFunctions.locationPath(locationName);
    const funcName = "foo";
    const zipFile = "foo.zip";

    const cloudFunc = await createCloudFunction(
        cloudFunctions,
        locationName,
        funcName,
        locationPath,
        zipFile
    );

    if (cloudFunc) {
    }

    const responses = cloudFunctions.listFunctions(cloudFunctions.locationPath("-"));
    for await (const response of responses) {
        for (const func of response.functions) {
            console.log(humanStringify(func, { maxDepth: 1 }));
        }
    }
}
async function createCloudFunction(
    cloudFunctions: CloudFunctions,
    locationName: string,
    funcName: string,
    locationPath: string,
    zipFile: string
) {
    const funcPath = cloudFunctions.functionPath(locationName, funcName);
    const uploadUrlResponse = await cloudFunctions.generateUploaddUrl(locationPath);
    // upload ZIP file to uploadUrlResponse.uploadUrl
    Axios.put(uploadUrlResponse.uploadUrl, fs.createReadStream(zipFile), {
        headers: {
            "content-type": "application/zip",
            "x-goog-content-length-range": "0,104857600"
        }
    });
    let func: Partial<Schema$CloudFunction> = {
        name: funcPath,
        description: `Example cloud function "foo"`,
        entryPoint: "foo",
        timeout: "60s",
        availableMemoryMb: 512,
        sourceUploadUrl: uploadUrlResponse.uploadUrl
    };
    return cloudFunctions.createFunction(locationPath, func);
}
