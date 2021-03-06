import { GoogleApis, compute_v1 as gcompute } from "googleapis";
import {
    logFields,
    googlePagedIterator,
    PollConfig,
    unwrap,
    poll,
    PollOptions,
    sleep,
    initializeGoogleAPIs
} from "./shared";
import humanStringify from "human-stringify";

import { AxiosPromise } from "axios";

type Schema$Operation = gcompute.Schema$Operation;

class Compute {
    project: string;
    zone: string;
    gCompute: gcompute.Compute;

    constructor(google: GoogleApis, project: string, zone: string) {
        this.project = project;
        this.zone = zone;
        this.gCompute = google.compute({
            version: "v1",
            params: { zone, project }
        });
    }

    async waitFor(op: string | Schema$Operation, options: PollOptions = {}) {
        const operation = typeof op === "string" ? op : op.name!;

        const result = await poll({
            request: () => this.gCompute.zoneOperations.get({ operation }),
            checkDone: result => result.data && result.data.status === "DONE",
            describe: ({ data: { status, operationType } }) =>
                `operationType: "${operationType}", status: "${status}"`,
            verbose: true,
            operation,
            ...options
        });

        if (!result) {
            return;
        }
        console.log(
            `Completed operation "${result.data.operationType}" on ${
                result.data.targetLink
            }`
        );
        return result.data;
    }

    async getDisk(disk: string) {
        return unwrap(this.gCompute.disks.get({ disk }));
    }

    async insertDisk(
        name: string,
        sizeGb: number,
        diskType: "pd-ssd" | "pd-standard" = "pd-ssd"
    ) {
        const type = await unwrap(this.gCompute.diskTypes.get({ diskType }));

        const disk = {
            name,
            sizeGb: `${sizeGb}`,
            type: type.selfLink,
            sourceImage: "projects/debian-cloud/global/images/family/debian-8"
        };

        const operation = await unwrap(this.gCompute.disks.insert({ requestBody: disk }));
        return this.waitFor(operation.name!);
    }

    async insertInstance(name: string) {
        const diskType = await unwrap(
            this.gCompute.diskTypes.get({
                diskType: "pd-ssd"
            })
        );
        const instance = {
            name,
            machineType: "zones/us-west1-a/machineTypes/g1-small",
            disks: [
                {
                    initializeParams: {
                        sourceImage:
                            "projects/debian-cloud/global/images/family/debian-8",
                        diskSizeGb: "10",
                        diskType: diskType.selfLink
                    },
                    autoDelete: true,
                    boot: true
                }
            ],
            scheduling: { preemptible: false },
            networkInterfaces: [{ network: "global/networks/default" }]
        } as gcompute.Schema$Instance;
        console.log(`Inserting Instance: ${humanStringify(instance, { maxDepth: 4 })}`);
        const operation = await unwrap(
            this.gCompute.instances.insert({
                requestBody: instance
            })
        );

        await this.waitFor(operation);
    }

    async *listInstances() {
        yield* googlePagedIterator(pageToken =>
            this.gCompute.instances.list({ pageToken })
        );
    }

    async stopInstance(instance: string) {
        function delay(retries: number) {
            if (retries === 0) {
                return sleep(20 * 1000);
            }
            return sleep(5 * 1000);
        }
        const operation = await unwrap(this.gCompute.instances.delete({ instance }));
        await this.waitFor(operation, { delay });
    }

    async deleteDisk(diskName: string) {
        const operation = await unwrap(this.gCompute.disks.delete({ disk: diskName }));
        console.log(`disk delete status: ${operation.status}`);
        await this.waitFor(operation);
    }

    async *listDisks() {
        yield* googlePagedIterator(pageToken => this.gCompute.disks.list({ pageToken }));
    }
}

export async function main() {
    try {
        const google = await initializeGoogleAPIs();
        const zone = "us-west1-a";
        const project = await google.auth.getDefaultProjectId();

        const compute = new Compute(google, project, zone);

        const instanceName = "instance-1";
        await compute.insertInstance(instanceName);

        console.log(`Running instances:`);
        for await (let instances of compute.listInstances()) {
            instances = instances || [];
            for (const instance of instances.items || []) {
                console.log(humanStringify(instance, { maxDepth: 1 }));
            }
        }

        console.log(`Disks:`);
        for await (let disks of compute.listDisks()) {
            disks = disks || [];
            for (const disk of disks.items || []) {
                console.log(humanStringify(disk, { maxDepth: 1 }));
            }
        }

        await compute.stopInstance(instanceName);
    } catch (err) {
        console.error(`Exception: ${err}`);
    }
}
