import { GoogleApis } from "googleapis";
import {
    Schema$Operation,
    Servicemanagement as GoogleServiceManagement
} from "googleapis/build/src/apis/servicemanagement/v1";
import humanStringify from "human-stringify";
import {
    googlePagedIterator,
    initializeGoogleAPIs,
    poll,
    unwrap,
    PollConfig
} from "./shared";
import { AxiosResponse } from "axios";

const zone = "us-west1-a";

class ServiceManagement {
    gServiceManagement: GoogleServiceManagement;
    project: string;

    constructor(google: GoogleApis, project: string) {
        this.gServiceManagement = google.servicemanagement("v1");
        this.project = project;
    }

    async *listOperations() {
        yield* googlePagedIterator(pageToken =>
            this.gServiceManagement.operations.list({ pageSize: 100, pageToken })
        );
    }

    async *listServices() {
        yield* googlePagedIterator(pageToken =>
            this.gServiceManagement.services.list({ pageSize: 100, pageToken })
        );
    }

    async getService(serviceName: string) {
        return unwrap(this.gServiceManagement.services.get({ serviceName }));
    }

    async enableService(serviceName: string) {
        const operation = await unwrap(
            this.gServiceManagement.services.enable({
                serviceName,
                resource: {
                    consumerId: `project:${this.project}`
                }
            })
        );

        return this.serviceOperation(operation);
    }

    async disableService(serviceName: string) {
        const operation = await unwrap(
            this.gServiceManagement.services.disable({
                serviceName,
                resource: {
                    consumerId: `project:${this.project}`
                }
            })
        );

        await this.serviceOperation(operation);
    }

    async serviceOperation(operation: string | Schema$Operation) {
        const name = typeof operation === "string" ? operation : operation.name;

        let retries = 0;

        const result = await poll({
            request: () => this.gServiceManagement.operations.get({ name }),
            checkDone: (result: AxiosResponse<Schema$Operation>) =>
                result.data && result.data.done,
            describe: result => `${humanStringify(result.data)}`,
            operation: name,
            verbose: true
        });

        if (!result) {
            console.log(`Operation timed out after ${retries} attempts`);
        }
        return result;
    }
}

export async function main() {
    const google = await initializeGoogleAPIs();
    const project = await google.auth.getDefaultProjectId();
    const servicemanagement = new ServiceManagement(google, project);
    let i = 0;
    for await (const response of servicemanagement.listServices()) {
        console.log(`Service response: ${i++}`);
        for (const service of response.services) {
            console.log(`Service: ${service.serviceName}`);
        }
    }

    const serviceName = "cloudfunctions.googleapis.com";
    const operation = await servicemanagement.enableService(serviceName);
    if (!operation) {
        console.log(`Cold not enable service ${serviceName}`);
        return;
    }
    console.log(`Result: ${humanStringify(operation.data)}`);
}
