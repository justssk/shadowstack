import type { Inference, Signal } from "@/lib/types";

export function inferArchitecture(signals: Signal[]): Inference[] {
  const inferences: Inference[] = [];
  const by = (key: string, value?: string) => signals.filter((s) => s.key === key && (value === undefined || s.value === value));
  const frameworkSignals = by("framework");
  const bestFramework = [...frameworkSignals].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))[0];

  if (bestFramework) {
    inferences.push({
      id: "framework",
      category: "framework",
      key: "framework",
      value: String(bestFramework.value),
      confidence: bestFramework.confidence ?? 0.5,
      evidence: frameworkSignals.map((s) => s.evidence).filter(Boolean) as string[],
    });
  }

  const rsc = by("rendering", "RSC");
  const serverContent = by("serverContent", "Present");
  let rendering = "Unknown";
  let confidence = 0.45;
  const evidence: string[] = [];

  if (rsc.length) {
    rendering = "SSR + RSC";
    confidence = Math.max(...rsc.map((s) => s.confidence ?? 0.5));
    evidence.push(...(rsc.map((s) => s.evidence).filter(Boolean) as string[]));
  } else if (serverContent.length) {
    rendering = "Server-rendered content likely";
    confidence = Math.max(...serverContent.map((s) => s.confidence ?? 0.5));
    evidence.push(...(serverContent.map((s) => s.evidence).filter(Boolean) as string[]));
  }

  inferences.push({
    id: "rendering",
    category: "rendering",
    key: "rendering",
    value: rendering,
    confidence,
    evidence,
  });

  return inferences;
}
