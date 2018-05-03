import { google } from "googleapis";
import humanStringify from "human-stringify";

export async function initializeGoogleAPIs(zone: string) {
    const auth = await google.auth.getClient({
        scopes: [
            "https://www.googleapis.com/auth/compute",
            "https://www.googleapis.com/auth/cloud-platform"
        ]
    });

    const project = await google.auth.getDefaultProjectId();
    google.options({ auth, params: { project, zone } });
    console.log(`params: ${humanStringify(google._options.params)}`);
}

export function logFields<O, K extends keyof O>(obj: O, keys: K[]) {
    console.group();
    for (const key of keys) {
        console.log(`${key}: ${humanStringify(obj[key])}`);
    }
    console.groupEnd();
}

export function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface PollOptions {
    initialDelay?: number;
    maxRetries?: number;
    retryDelayMs?: number;
}

export async function poll<T>(
    f: () => Promise<T>,
    checkDone: (result: T) => boolean,
    beforeSleep?: (last: T) => void,
    {
        initialDelay = 5 * 1000,
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
