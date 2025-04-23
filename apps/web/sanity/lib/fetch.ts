import "server-only";

import type { QueryParams } from "@sanity/client";
import { draftMode } from "next/headers";
import { client } from "./client";

const DEFAULT_PARAMS = {} as QueryParams;
const DEFAULT_TAGS = [] as string[];

export const token = process.env.SANITY_API_READ_TOKEN;

export async function sanityFetch<QueryResponse>({
  query,
  params = DEFAULT_PARAMS,
  tags = DEFAULT_TAGS,
}: {
  query: string;
  params?: QueryParams;
  tags?: string[];
}): Promise<QueryResponse> {

  // Check if we are running in a build environment with dummy Sanity credentials
  if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID === 'dummy-sanity-project-id-for-build') {
    // console.warn("Sanity fetch skipped during dummy build."); // Optional: Log warning
    return undefined as unknown as QueryResponse; // Return undefined immediately
  }

  const isDraftMode = (await draftMode()).isEnabled;
  if (isDraftMode && !token) {
    throw new Error(
      "The `SANITY_API_READ_TOKEN` environment variable is required.",
    );
  }
  const isDevelopment = process.env.NODE_ENV === "development";

  return client
    .withConfig({ useCdn: true })
    .fetch<QueryResponse>(query, params, {
      // cache: isDevelopment || isDraftMode ? undefined : "force-cache",
      ...(isDraftMode && {
        token: token,
        perspective: "previewDrafts",
      }),
      next: {
        ...(isDraftMode && { revalidate: 30 }),
        tags,
      },
    });
}
