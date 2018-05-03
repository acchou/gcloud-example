import { google } from "googleapis";
import humanStringify from "human-stringify";

export async function initializeGoogleAPIs() {
    const auth = await google.auth.getClient({
        scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });

    const project = await google.auth.getDefaultProjectId();
    google.options({ auth });
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
    request: () => Promise<T>,
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
        const result = await request();
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

interface HasNextPageToken {
    nextPageToken: string;
}

interface HasStatus {
    status: string;
}

interface HasOperationType {
    operationType: string;
}

type Operation = HasStatus & HasOperationType;

interface HasData<T> {
    data: T;
}

export function googlePollOperation<T extends HasData<Operation>>(
    request: () => Promise<T>,
    options: PollOptions = {}
) {
    let retries = 0;
    return poll(
        request,
        result => result.data && result.data.status === "DONE",
        result => {
            retries++;
            if (!result.data) {
                console.log(`No data in response, retrying...`);
                return;
            }
            const { status, operationType } = result.data;
            console.log(`Operation "${operationType}" status: ${status}, retrying...`);
        },
        options
    );
}

export async function* googlePagedIterator<T extends HasNextPageToken>(
    request: (token: string | undefined) => Promise<HasData<T>>
): AsyncIterableIterator<T> {
    let pageToken: string | undefined;
    do {
        const result = await request(pageToken);
        pageToken = result.data.nextPageToken;
        yield result.data;
    } while (pageToken);
}
