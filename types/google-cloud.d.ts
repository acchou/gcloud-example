declare module "google-cloud" {
    interface GoogleConfig {
        projectId?: string;
        keyFilename?: string;
    }
    export default function(config: GoogleConfig): any;
}
