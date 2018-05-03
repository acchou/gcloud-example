import { logFields, initializeGoogleAPIs, googlePagedIterator } from "./shared";
import humanStringify from "human-stringify";
import { GoogleApis, google } from "googleapis";
import { Servicemanagement as GoogleServiceManagement } from "googleapis/build/src/apis/servicemanagement/v1";

const zone = "us-west1-a";

class ServiceManagement {
    gServiceManagement: GoogleServiceManagement;
    constructor(google: GoogleApis) {
        this.gServiceManagement = google.servicemanagement("v1");
    }
}

async function main() {
    const google = await initializeGoogleAPIs();
    const project = await google.auth.getDefaultProjectId();
    const cloudFunctions = new ServiceManagement(google);
}
