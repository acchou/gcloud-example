import { google } from "googleapis";
import { poll, logFields, googlePagedIterator, unwrap } from "./shared";
import humanStringify from "human-stringify";

const cloudRepository = google.sourcerepo({ version: "v1" });

async function* listRepositories(project: string) {
    yield* googlePagedIterator(pageToken =>
        cloudRepository.projects.repos.list({
            name: project,
            pageSize: 500,
            pageToken
        })
    );
}

export async function main() {
    const project = await google.auth.getDefaultProjectId();

    for await (const repo of listRepositories(`projects/${project}`)) {
        if (repo && repo.repos) {
            console.log(`Repos: ${repo.repos.map(r => r.name).join(", ")}`);
        }
    }
}
