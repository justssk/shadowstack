import type { Signal } from "@/lib/types";
import type { CollectedPage } from "@/lib/scanner/collector";
import { signalId } from "@/lib/scanner/collector";

function add(
  signals: Signal[],
  source: Signal["source"],
  category: Signal["category"],
  key: string,
  value: Signal["value"],
  confidence?: number,
  evidence?: string,
  metadata?: Signal["metadata"],
) {
  signals.push({
    id: signalId(source, key, value),
    source,
    category,
    key,
    value,
    confidence,
    evidence,
    metadata,
  });
}

export function extractSignals(page: CollectedPage): Signal[] {
  const signals: Signal[] = [];
  const html = page.html;
  const headers = page.headers;
  const lowerHtml = html.toLowerCase();

  // Framework evidence. Avoid generic substring matches such as `react` in arbitrary content.
  if (html.includes("__next_f") || html.includes("__NEXT_DATA__") || html.includes("/_next/")) {
    add(signals, "html", "framework", "framework", "Next.js", 0.97, "Next.js runtime markers detected in the HTML");
  }
  if (html.includes("/_nuxt/") || html.includes("__NUXT__")) {
    add(signals, "html", "framework", "framework", "Nuxt", 0.97, "Nuxt runtime markers detected in the HTML");
  }
  if (/<html[^>]*ng-version=/i.test(html)) {
    add(signals, "html", "framework", "framework", "Angular", 0.98, "ng-version attribute detected");
  }
  if (html.includes("astro-island") || html.includes("/_astro/")) {
    add(signals, "html", "framework", "framework", "Astro", 0.97, "Astro runtime markers detected in the HTML");
  }
  if (html.includes("data-sveltekit") || html.includes("__sveltekit")) {
    add(signals, "html", "framework", "framework", "SvelteKit", 0.95, "SvelteKit runtime markers detected in the HTML");
  }
  if (html.includes("data-reactroot")) {
    add(signals, "html", "framework", "framework", "React", 0.92, "React root marker detected");
  }

  // Rendering evidence.
  if (html.includes("__next_f")) {
    add(signals, "html", "rendering", "rendering", "RSC", 0.94, "React Server Components payload marker detected");
  }
  const meaningfulHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (meaningfulHtml.length >= 300) {
    add(signals, "html", "rendering", "serverContent", "Present", 0.8, "Substantial text content is present in the initial HTML");
  } else {
    add(signals, "html", "rendering", "serverContent", "Minimal", 0.75, "Very little meaningful content is present in the initial HTML");
  }

  // Infrastructure / delivery headers.
  const server = headers.get("server") ?? "";
  const poweredBy = headers.get("x-powered-by") ?? "";
  if (headers.get("x-vercel-id")) {
    add(signals, "headers", "infrastructure", "platform", "Vercel", 0.99, "x-vercel-id response header detected");
  }
  if (headers.get("cf-ray")) {
    add(signals, "headers", "infrastructure", "platform", "Cloudflare", 0.99, "cf-ray response header detected");
  }
  if (headers.get("x-netlify")) {
    add(signals, "headers", "infrastructure", "platform", "Netlify", 0.99, "x-netlify response header detected");
  }
  if (/vercel/i.test(server)) {
    add(signals, "headers", "infrastructure", "providerSignal", "Vercel", 0.85, `server header: ${server}`);
  }
  if (/cloudflare/i.test(server)) {
    add(signals, "headers", "infrastructure", "providerSignal", "Cloudflare", 0.9, `server header: ${server}`);
  }
  if (/next/i.test(poweredBy)) {
    add(signals, "headers", "framework", "framework", "Next.js", 0.8, `x-powered-by: ${poweredBy}`);
  }

  // Security.
  const securityHeaders: Array<[string, string]> = [
    ["strict-transport-security", "HSTS"],
    ["content-security-policy", "CSP"],
    ["x-content-type-options", "X-Content-Type-Options"],
    ["x-frame-options", "X-Frame-Options"],
    ["referrer-policy", "Referrer-Policy"],
    ["permissions-policy", "Permissions-Policy"],
  ];
  for (const [header, name] of securityHeaders) {
    if (headers.has(header)) {
      add(signals, "headers", "security", `header:${header}`, "Present", 1, `${name} response header detected`);
    } else {
      add(signals, "headers", "security", `header:${header}`, "Missing", 1, `${name} response header not detected`);
    }
  }
  add(
    signals,
    "headers",
    "security",
    "serverDisclosure",
    server || poweredBy ? "Present" : "Minimal",
    0.95,
    server || poweredBy ? "Server-identifying response headers are exposed" : "No obvious server-identifying response header was exposed",
  );

  // API indicators are evidence only; they do not imply a monolith/microservice architecture.
  if (/\/api\//i.test(html) || /api\./i.test(html)) {
    add(signals, "html", "api", "apiSurface", "Detected", 0.65, "API-like URL patterns found in initial HTML");
  }
  if (/graphql/i.test(html)) {
    add(signals, "html", "api", "apiProtocol", "GraphQL", 0.75, "GraphQL reference detected in initial HTML");
  }

  // Basic response/performance measurements.
  add(signals, "performance", "performance", "responseTimeMs", page.responseTimeMs, 1, "Measured server response time from the scanner");
  add(signals, "performance", "performance", "htmlBytes", Buffer.byteLength(html, "utf8"), 1, "Measured response body size");

  const encoding = headers.get("content-encoding") ?? "identity";
  add(signals, "headers", "performance", "compression", encoding, 1, "content-encoding response header");

  const cacheControl = headers.get("cache-control");
  add(signals, "headers", "performance", "cacheControl", cacheControl ?? "Missing", 1, "cache-control response header");

  // Keep this intentionally small. Browser-level network and Web Vitals arrive in the next milestone.
  if (lowerHtml.includes("<script")) {
    add(signals, "html", "performance", "scriptTagCount", (html.match(/<script\b/gi) ?? []).length, 1, "Number of script tags in initial HTML");
  }

  return signals;
}
