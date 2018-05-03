import { google } from "googleapis";
import { poll, logFields } from "./shared";
import humanStringify from "human-stringify";

const cloudRepository = google.sourcerepo({ version: "v1" });

async function* listRepositories(project: string) {
    let pageToken: string | undefined;
    console.log(`List repositories: ${project}`);
    do {
        const op = await cloudRepository.projects.repos.list({
            name: project,
            pageSize: 500,
            pageToken
        });
        console.log(`${humanStringify(op)}`);
        pageToken = op.data.nextPageToken;
        yield op.data.repos;
    } while (pageToken);
}

export async function main() {
    const project = await google.auth.getDefaultProjectId();

    // const {
    //     params: { zone, project, ...otherParams },
    //     ...rest
    // } = google._options;
    // google.options({ params: otherParams, ...rest });

    for await (const repo of listRepositories(`projects/${project}`)) {
        if (repo) {
            console.log(`Repos: ${repo.map(r => r.name).join(", ")}`);
        }
    }
}
