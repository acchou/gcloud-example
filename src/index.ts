import * as process from "process";
import gcloudFn = require("google-cloud");

console.log(gcloudFn);

const config = {
    projectId: process.env.GCLOUD_PROJECT
};

const gcloud = gcloudFn();
const arxiv = gcloud.bucket("arXiv");

console.log(`arxiv: ${arxiv}`);
