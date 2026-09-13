import type { ScanScores, Score, Signal } from "@/lib/types";

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function scoreWithReasons(value: number, reasons: string[]): Score {
  return { value: clamp(value), reasons };
}

export function computeScores(signals: Signal[]): ScanScores {
  const has = (key: string, value: string) => signals.some((s) => s.key === key && s.value === value);
  const present = (key: string) => has(key, "Present");

  const architectureReasons: string[] = [];
  let architecture = 50;
  if (signals.some((s) => s.category === "framework")) {
    architecture += 20;
    architectureReasons.push("A recognizable framework signal was detected.");
  }
  if (signals.some((s) => s.key === "rendering")) {
    architecture += 10;
    architectureReasons.push("Rendering characteristics were observable from the initial response.");
  }
  if (signals.some((s) => s.key === "apiSurface")) {
    architecture += 5;
    architectureReasons.push("An API surface was detected; this is evidence of application integration, not proof of a monolith or microservice architecture.");
  }

  const performanceReasons: string[] = [];
  let performance = 70;
  const response = signals.find((s) => s.key === "responseTimeMs");
  const htmlBytes = signals.find((s) => s.key === "htmlBytes");
  if (response && typeof response.value === "number") {
    if (response.value <= 200) performance += 15;
    else if (response.value > 1000) performance -= 20;
    else performance -= 5;
    performanceReasons.push(`Initial response measured at ${response.value}ms.`);
  }
  if (htmlBytes && typeof htmlBytes.value === "number") {
    if (htmlBytes.value <= 50_000) performance += 10;
    else if (htmlBytes.value > 500_000) performance -= 15;
    performanceReasons.push(`Initial HTML payload measured at ${Math.round(htmlBytes.value / 1024)}KB.`);
  }
  if (signals.some((s) => s.key === "compression" && ["br", "gzip"].includes(String(s.value)))) {
    performance += 5;
    performanceReasons.push("Response compression is enabled.");
  }

  const securityReasons: string[] = [];
  const securityKeys = [
    "header:strict-transport-security",
    "header:content-security-policy",
    "header:x-content-type-options",
    "header:x-frame-options",
    "header:referrer-policy",
    "header:permissions-policy",
  ];
  let security = 40;
  for (const key of securityKeys) {
    if (present(key)) security += 10;
  }
  if (signals.some((s) => s.key === "serverDisclosure" && s.value === "Minimal")) security += 5;
  securityReasons.push(`${securityKeys.filter((key) => present(key)).length}/${securityKeys.length} recommended security headers were detected.`);

  const deliveryReasons: string[] = [];
  let delivery = 50;
  if (signals.some((s) => s.key === "platform")) {
    delivery += 20;
    deliveryReasons.push("A hosting/platform signal was detected.");
  }
  if (signals.some((s) => s.key === "cacheControl" && s.value !== "Missing")) {
    delivery += 15;
    deliveryReasons.push("Cache-Control is explicitly configured.");
  }
  if (signals.some((s) => s.key === "compression" && s.value !== "identity")) delivery += 10;

  const scores = {
    architecture: scoreWithReasons(architecture, architectureReasons),
    performance: scoreWithReasons(performance, performanceReasons),
    security: scoreWithReasons(security, securityReasons),
    delivery: scoreWithReasons(delivery, deliveryReasons),
  };

  return {
    ...scores,
    overall: clamp(
      scores.architecture.value * 0.3 +
        scores.performance.value * 0.3 +
        scores.security.value * 0.25 +
        scores.delivery.value * 0.15,
    ),
  };
}
