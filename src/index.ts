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

async function main() {
    try {
        const auth = await google.auth.getClient({
            scopes: ["https://www.googleapis.com/auth/compute"]
        });

        const project = await google.auth.getDefaultProjectId();
        google.options({ auth, params: { project, zone } });
        console.log(`params: ${humanStringify(google._options.params)}`);

        const response = await compute.instances.list();
        console.log(`Instances list response: ${response.statusText}`);
        console.log(`Response kind: ${response.data.kind}`);
        let instances = response.data.items || [];
        for (const instance of instances) {
            console.log(`instance: ${instance.name}`);
            console.log(`  kind: ${instance.kind}`);
            console.log(`  id: ${instance.id}`);
            console.log(`  cpu: ${instance.cpuPlatform}`);
            console.log(`  created: ${instance.creationTimestamp}`);
            console.log(`  machineType: ${instance.machineType}`);
            console.log(`  selfLink: ${instance.selfLink}`);
            console.log(`  status: ${instance.status}`);
            console.log(`  zone: ${instance.zone}`);
        }
    } catch (err) {
        console.warn(`EXCEPTION: `);
        console.warn(err);
    }
}

main();
