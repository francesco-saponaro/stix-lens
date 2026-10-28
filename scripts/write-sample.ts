// Writes the sample bundle to public/feeds so the app can fetch it like any other feed.
import { writeFileSync, mkdirSync } from "node:fs";
import { SAMPLE_BUNDLE, SAMPLE_BUNDLE_NAME } from "../src/stix/sample-bundle.ts";

mkdirSync("public/feeds", { recursive: true });
writeFileSync(`public/feeds/${SAMPLE_BUNDLE_NAME}`, JSON.stringify(SAMPLE_BUNDLE, null, 2) + "\n");
console.log(`wrote public/feeds/${SAMPLE_BUNDLE_NAME} with ${SAMPLE_BUNDLE.objects.length} objects`);
