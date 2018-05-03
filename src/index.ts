import { google } from "googleapis";
import humanStringify from "human-stringify";

const compute = google.compute("v1");
const storage = google.storage("v1");
const zone = "us-west1-a";

function logFields<O, K extends keyof O>(obj: O, keys: K[]) {
    console.group();
    for (const key of keys) {
        console.log(`${key}: ${humanStringify(obj[key])}`);
    }
    console.groupEnd();
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

interface PollOptions {
    initialDelay?: number;
    maxRetries?: number;
    retryDelayMs?: number;
}

async function poll<T>(
    f: () => Promise<T>,
    checkDone: (result: T) => boolean,
    beforeSleep?: (last: T) => void,
    {
        initialDelay = 10 * 1000,
        maxRetries = 10,
        retryDelayMs = 5 * 1000
    }: PollOptions = {}
) {
    let retries = 0;
    await sleep(initialDelay);
    while (true) {
        const result = await f();
        if (checkDone(result)) {
            return result;
        }
        if (retries++ >= maxRetries) {
            return;
        }
        beforeSleep && beforeSleep(result);
        await sleep(retryDelayMs);
    }
}

interface ZoneOperationOptions {
    operation: string;
}

async function zoneOperation({ operation }: ZoneOperationOptions) {
    let retries = 0;
    const result = await poll(
        () => compute.zoneOperations.get({ operation }),
        result => result.data && result.data.status === "DONE",
        result => {
            retries++;
            if (!result.data) {
                console.log(`No data in response, retrying...`);
                return;
            }
            const { status, progress, startTime, operationType } = result.data;
            console.log(`Operation "${operationType}" status: ${status}, retrying...`);
        }
    );

    if (!result) {
        console.log(`Timeout after ${retries} attempts.`);
        return;
    }
    console.log(
        `Completed operation "${result.data.operationType}" on ${result.data.targetLink}`
    );
    return result.data;
}

async function getDisk(disk: string) {
    const response = await compute.disks.get({ disk });
    return response.data;
}

async function insertDisk(
    name: string,
    sizeGb: number,
    type: "pd-ssd" | "pd-standard" = "pd-ssd"
) {
    const diskTypeResponse = await compute.diskTypes.get({ type });

    const disk = {
        name,
        sizeGb,
        type: diskTypeResponse.data.selfLink,
        sourceImage: "projects/debian-cloud/global/images/family/debian-8"
    };

    const op = await compute.disks.insert({ resource: disk });
    console.log(`disk insert status: ${op.statusText}`);
    logFields(op.data, ["id", "endTime", "selfLink", "status", "warnings"]);

    const operation = op.data.name;
    return await zoneOperation({ operation });
}

const diskName = "disk-1";

async function insertInstance(name: string) {
    const diskTypeResponse = await compute.diskTypes.get({ diskType: "pd-ssd" });
    const instance = {
        name,
        machineType: "zones/us-west1-a/machineTypes/g1-small",
        disks: [
            {
                initializeParams: {
                    sourceImage: "projects/debian-cloud/global/images/family/debian-8",
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
    const result = await compute.instances.insert({
        resource: instance
    });

    await zoneOperation({ operation: result.data.name });
}

interface DeleteDiskOptions {
    diskName: string;
}

async function deleteDisk({ diskName }: DeleteDiskOptions) {
    const op = await compute.disks.delete({ disk: diskName });
    console.log(`disk delete status: ${op.data.status}`);
    await zoneOperation({ operation: op.data.name });
}

async function stopInstance(instance: string) {
    const result = await compute.instances.delete({ instance });
    await zoneOperation({ operation: result.data.name });
}

async function main() {
    try {
        const auth = await google.auth.getClient({
            scopes: ["https://www.googleapis.com/auth/compute"]
        });

        const project = await google.auth.getDefaultProjectId();
        google.options({ auth, params: { project, zone } });
        console.log(`params: ${humanStringify(google._options.params)}`);

        const instanceName = "instance-1";
        await insertInstance(instanceName);

        const response = await compute.instances.list();
        console.log(`Instances list response: ${response.statusText}`);
        console.log(`Response data kind: ${response.data.kind}`);
        const instances = response.data.items || [];
        for (const instance of instances) {
            logFields(instance, [
                "name",
                "kind",
                "id",
                "cpuPlatform",
                "creationTimestamp",
                "machineType",
                "selfLink",
                "status",
                "zone"
            ]);
        }
        const disksResponse = await compute.disks.list();
        console.log(`Disks list response: ${disksResponse.statusText}`);
        console.log(`Response data kind: ${disksResponse.data.kind}`);
        const disks = disksResponse.data.items || [];
        for (const disk of disks) {
            logFields(disk, [
                "name",
                "id",
                "kind",
                "status",
                "type",
                "sizeGb",
                "selfLink",
                "creationTimestamp",
                "sourceImage",
                "zone"
            ]);
        }
        await stopInstance(instanceName);
    } catch (err) {
        console.error(`${err}`);
    }
}

main();
