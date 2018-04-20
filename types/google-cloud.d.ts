declare module "google-cloud" {
    interface GoogleConfig {
        projectId?: string;
        keyFilename?: string;
    }
    interface Compute {}
    function gcloud(config?: GoogleConfig): any;
    export = gcloud;
}
