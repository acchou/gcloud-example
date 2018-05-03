import { google } from "googleapis";
import { poll, logFields } from "./shared";
import humanStringify from "human-stringify";

const storage = google.storage("v1");
