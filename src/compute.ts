import { google, GoogleApis } from "googleapis";
import {
    logFields,
    googlePagedIterator,
    googlePollOperation,
    PollOptions
} from "./shared";
import humanStringify from "human-stringify";

import { Compute as GoogleCompute } from "googleapis/build/src/apis/compute/v1";

export interface DeleteDiskOptions {
    diskName: string;
}

class Compute {
    project: string;
    zone: string;
    compute: GoogleCompute;

    constructor(google: GoogleApis, project: string, zone: string) {
        this.project = project;
        this.zone = zone;
        this.compute = google.compute({
            version: "v1",
            params: { zone, project }
        });
    }

    async zoneOperation(operation: string, options: PollOptions = {}) {
        const result = await googlePollOperation(
            () => this.compute.zoneOperations.get({ operation }),
            options
        );

        if (!result) {
            console.log(`Timeout waiting for operation "${operation}".`);
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
        const response = await this.compute.disks.get({ disk });
        return response.data;
    }

    async insertDisk(
        name: string,
        sizeGb: number,
        type: "pd-ssd" | "pd-standard" = "pd-ssd"
    ) {
        const diskTypeResponse = await this.compute.diskTypes.get({ type });

        const disk = {
            name,
            sizeGb,
            type: diskTypeResponse.data.selfLink,
            sourceImage: "projects/debian-cloud/global/images/family/debian-8"
        };

        const op = await this.compute.disks.insert({ resource: disk });
        console.log(`disk insert status: ${op.statusText}`);
        logFields(op.data, ["id", "endTime", "selfLink", "status", "warnings"]);

        const operation = op.data.name;
        return await this.zoneOperation(operation);
    }

    async insertInstance(name: string) {
        const diskTypeResponse = await this.compute.diskTypes.get({ diskType: "pd-ssd" });
        const instance = {
            name,
            machineType: "zones/us-west1-a/machineTypes/g1-small",
            disks: [
                {
                    initializeParams: {
                        sourceImage:
                            "projects/debian-cloud/global/images/family/debian-8",
                        diskSizeGb: 10,
                        diskType: diskTypeResponse.data.selfLink
                    },
                    autoDelete: true,
                    boot: true
                }
            ],
            scheduling: { preemptible: false },
            networkInterfaces: [{ network: "global/networks/default" }]
        };
        console.log(`Inserting Instance: ${humanStringify(instance, { maxDepth: 4 })}`);
        const result = await this.compute.instances.insert({
            resource: instance
        });

        await this.zoneOperation(result.data.name);
    }

    async *listInstances() {
        yield* googlePagedIterator(pageToken =>
            this.compute.instances.list({ pageToken })
        );
    }

    async stopInstance(instance: string) {
        const result = await this.compute.instances.delete({ instance });
        await this.zoneOperation(result.data.name, { initialDelay: 20 * 1000 });
    }

    async deleteDisk(diskName: string) {
        const op = await this.compute.disks.delete({ disk: diskName });
        console.log(`disk delete status: ${op.data.status}`);
        await this.zoneOperation(op.data.name);
    }

    async *listDisks() {
        yield* googlePagedIterator(pageToken => this.compute.disks.list({ pageToken }));
    }
}

export async function main() {
    try {
        const zone = "us-west1-a";
        const project = await google.auth.getDefaultProjectId();

        const compute = new Compute(google, project, zone);

        const instanceName = "instance-1";
        await compute.insertInstance(instanceName);

        console.log(`Running instances:`);
        for await (let instances of compute.listInstances()) {
            //            instances = instances || [];
            for (const instance of instances.items) {
                console.log(humanStringify(instance, { maxDepth: 1 }));
            }
        }

        console.log(`Disks:`);
        for await (let disks of compute.listDisks()) {
            //           const disks = response.data.items || [];
            for (const disk of disks.items) {
                console.log(humanStringify(disk, { maxDepth: 1 }));
            }
        }

        await compute.stopInstance(instanceName);
    } catch (err) {
        console.error(`Exception: ${err}`);
    }
}
