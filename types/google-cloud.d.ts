// Property regex: @property {(.*)} \[(.*)\]

declare module "@google-cloud/compute" {
    /**
     * @typedef {object} ClientConfig
     * @property {string} [projectId] The project ID from the Google Developer's
     *     Console, e.g. 'grape-spaceship-123'. We will also check the environment
     *     variable `GCLOUD_PROJECT` for your project ID. If your app is running in
     *     an environment which supports {@link https://cloud.google.com/docs/authentication/production#providing_credentials_to_your_application Application Default Credentials},
     *     your project ID will be detected automatically.
     * @property {string} [keyFilename] Full path to the a .json, .pem, or .p12 key
     *     downloaded from the Google Developers Console. If you provide a path to a
     *     JSON file, the `projectId` option above is not necessary. NOTE: .pem and
     *     .p12 require you to specify the `email` option as well.
     * @property {string} [email] Account email address. Required when using a .pem
     *     or .p12 keyFilename.
     * @property {object} [credentials] Credentials object.
     * @property {string} [credentials.client_email]
     * @property {string} [credentials.private_key]
     * @property {boolean} [autoRetry=true] Automatically retry requests if the
     *     response is related to rate limits or certain intermittent server errors.
     *     We will exponentially backoff subsequent requests by default.
     * @property {number} [maxRetries=3] Maximum number of automatic retries
     *     attempted before returning the error.
     * @property {Constructor} [promise] Custom promise module to use instead of
     *     native Promises.
     */

    interface ClientConfig {}

    class Compute {
        constructor(options?: GoogleComputeOptions);
    }
    export = Compute;
}
