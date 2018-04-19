import * as process from "process";
import gcloudFn from "google-cloud";

console.log(gcloudFn);

const config = {
    projectId: process.env.GCLOUD_PROJECT
};

const gcloud = gcloudFn(config);
const arxiv = gcloud.bucket("arXiv");

console.log(`arxiv: ${arxiv}`);
