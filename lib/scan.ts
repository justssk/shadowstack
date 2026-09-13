import { redis } from "@/lib/redis";
import { parseDomain } from "@/lib/domain";
import type { ScanResult } from "@/lib/types";
import { collectPage } from "@/lib/scanner/collector";
import { extractSignals } from "@/lib/scanner/signals";
import { inferArchitecture } from "@/lib/analyzers/inference";
import { computeScores } from "@/lib/scoring";

export async function scan(rawInput: string): Promise<ScanResult> {
  const domain = parseDomain(rawInput);
  if (!domain) throw new Error("Invalid domain");

  const cacheKey = `scan:v2:${domain}`;
  const cached = await redis.get<ScanResult>(cacheKey);
  if (cached) return cached;

  const started = performance.now();
  let page;
  try {
    page = await collectPage(domain);
  } catch {
    throw new Error("Website not reachable");
  }

  if (!page.status || page.status >= 500) throw new Error("Website not reachable");

  const signals = extractSignals(page);
  if (!signals.length) throw new Error("No architecture signals found");

  const inferences = inferArchitecture(signals);
  const scores = computeScores(signals);
  const warnings: string[] = [];

  if (page.status >= 400) warnings.push(`The origin returned HTTP ${page.status}. Some signals may be incomplete.`);
  if (!signals.some((s) => s.category === "framework")) warnings.push("No high-confidence framework marker was detected. The framework may be hidden or unsupported.");
  if (!signals.some((s) => s.key === "rendering" && s.value === "RSC")) warnings.push("RSC was not detected. This does not prove that the application is not server-rendered.");

  const result: ScanResult = {
    domain,
    scannedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    architecture: signals,
    inferences,
    scores,
    warnings,
  };

  await redis.set(cacheKey, result, { ex: 60 * 60 * 24 });
  return result;
}
