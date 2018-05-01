import { google } from "googleapis";
import humanStringify from "human-stringify";

const compute = google.compute("v1");
const storage = google.storage("v1");
const vmName = "derivative-instance-1";
const zone = "us-west1-a";

let context;

interface RequestParameters {
    project: string; // Project ID for this request.
    zone: string; //  The name of the zone for this request.

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
}

async function main() {
    try {
        const auth = await google.auth.getClient({
            scopes: ["https://www.googleapis.com/auth/compute"]
        });

        google.options({ auth });
        const project = await google.auth.getDefaultProjectId();

        function request<T>(obj: object) {
            return {
                project,
                zone,
                ...obj
            };
        }

        const response = await compute.instances.list({ project, zone });
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
