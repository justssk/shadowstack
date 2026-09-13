import type { SignalSource } from "@/lib/types";

export type CollectedPage = {
  url: string;
  finalUrl: string;
  status: number;
  headers: Headers;
  html: string;
  responseTimeMs: number;
};

export async function collectPage(domain: string): Promise<CollectedPage> {
  const url = `https://${domain}`;
  const started = performance.now();

  const response = await fetch(url, {
    redirect: "follow",
    cache: "no-store",
    headers: {
      "user-agent": "ShadowStack/2.0 (+https://shadowstack.justssk.dev)",
      accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });

  const html = await response.text();

  return {
    url,
    finalUrl: response.url,
    status: response.status,
    headers: response.headers,
    html,
    responseTimeMs: Math.round(performance.now() - started),
  };
}

export function signalId(source: SignalSource, key: string, value: string | number | boolean) {
  return `${source}:${key}:${String(value)}`;
}
