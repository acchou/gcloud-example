import { google } from "googleapis";
import humanStringify from "human-stringify";

const compute = google.compute("v1");
const storage = google.storage("v1");
const vmName = "derivative-instance-1";
const zone = "us-west1-a";

interface RequestParameters {
    acceleratorType?: string;
    accessConfig?: string;
    address?: string;
    autoDelete?: string;
    autoscaler?: string;
    backendBucket?: string;
    backendService?: string;
    commitment?: string;
    deletionProtection?: string;
    deviceName?: string;
    discardLocalSsd?: string;
    disk?: string;
    diskType?: string;
    failoverRatio?: string;
    family?: string;
    filter?: string;
    firewall?: string;
    forceAttach?: string;
    forceCreate?: string;
    forwardingRule?: string;
    guestFlush?: string;
    healthCheck?: string;
    host?: string;
    hostType?: string;
    httpHealthCheck?: string;
    httpsHealthCheck?: string;
    image?: string;
    instance?: string;
    instanceGroup?: string;
    instanceGroupManager?: string;
    instanceTemplate?: string;
    interconnect?: string;
    interconnectAttachment?: string;
    interconnectLocation?: string;
    ipCidrRange?: string;
    keyName?: string;
    license?: string;
    licenseCode?: string;
    machineType?: string;
    maintenancePolicy?: string;
    maxResults?: string;
    network?: string;
    networkEndpointGroup?: string;
    networkInterface?: string;
    operation?: string;
    order_by?: string;
    orderBy?: string;
    ownerProjects?: string;
    ownerTypes?: string;
    pageToken?: string;
    port?: string;
    project?: string; // Project ID for this request.
    priority?: string;
    region?: string;
    requestId?: string;
    resource?: string;
    resource_?: string;
    route?: string;
    router?: string;
    securityPolicy?: string;
    size?: string;
    snapshot?: string;
    sourceImage?: string;
    sourceInstanceTemplate?: string;
    sslCertificate?: string;
    sslPolicy?: string;
    start?: string;
    subnetName?: string;
    subnetRegion?: string;
    subnetwork?: string;
    targetHttpProxy?: string;
    targetHttpsProxy?: string;
    targetInstance?: string;
    targetPool?: string;
    targetSslProxy?: string;
    targetTcpProxy?: string;
    targetVpnGateway?: string;
    urlMap?: string;
    validateOnly?: string;
    variableKey?: string;
    vpnTunnel?: string;
    zone?: string; //  The name of the zone for this request.
}

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

interface ZoneOperationOptions {
    operation: string;
    maxRetries?: number;
    retryDelayMs?: number;
}

async function zoneOperation({
    operation,
    maxRetries = 10,
    retryDelayMs = 5 * 1000
}: ZoneOperationOptions) {
    let retries = 0;
    while (retries++ < maxRetries) {
        const result = await compute.zoneOperations.get({ operation });
        const { status, progress, startTime, operationType } = result.data;
        console.log(`Operation "${operationType}" status: ${status}`);

        if (status === "DONE") {
            return result.data;
        }

        console.log(`  progress: ${progress}, retrying in in 5s...`);
        await sleep(retryDelayMs);
    }
    throw new Error(`Operation timeout after ${maxRetries} attempts`);
}

interface GetDiskOptions {
    diskName: string;
}

async function getDisk({ diskName }: GetDiskOptions) {
    const response = await compute.disks.get({ disk: diskName });
    return response.data;
}

interface CreateDiskOptions {
    diskName: string;
    sizeGb: number;
    diskType?: "pd-ssd" | "pd-standard";
    image?: string;
}

async function createDisk({
    diskName,
    sizeGb,
    diskType = "pd-ssd",
    image = "projects/debian-cloud/global/images/family/debian-8"
}: CreateDiskOptions) {
    const diskTypeResponse = await compute.diskTypes.get({ diskType });
    const op = await compute.disks.insert({
        resource: {
            name: diskName,
            sizeGb: String(sizeGb),
            sourceImage: image,
            type: diskTypeResponse.data.selfLink
        }
    });
    console.log(`disk insert status: ${op.statusText}`);
    logFields(op.data, ["id", "endTime", "selfLink", "status", "warnings"]);

    const operation = op.data.name;
    return await zoneOperation({ operation });
}

const diskName = "disk-1";

interface DiskInitializationOptions {
    diskName?: string;
    sourceImage?: string;
    diskSizeGb?: number;
    diskType?: "pd-ssd" | "pd-standard";
}

interface StartInstanceOptions {
    name: string;
    diskOptions?: DiskInitializationOptions;
    machineType?: string;
    preemptible?: boolean;
    autoDelete?: boolean;
}

async function startInstance({
    name,
    machineType = "zones/us-west1-a/machineTypes/g1-small",
    preemptible = false,
    diskOptions = {
        sourceImage: "projects/debian-cloud/global/images/family/debian-8",
        diskSizeGb: 10,
        diskType: "pd-ssd"
    },
    autoDelete = true
}: StartInstanceOptions) {
    // const sizeGb = 10;
    // await createDisk({ diskName, sizeGb });
    // console.log(`created disk ${diskName}`);

    const result = await compute.instances.insert({
        resource: {
            name,
            machineType,
            scheduling: { preemptible },
            disks: [{ initializeParams: diskOptions, autoDelete }],
            networkInterfaces: []
        }
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
        await startInstance({ name: instanceName });

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
