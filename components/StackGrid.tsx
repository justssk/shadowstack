import type { ScanResult, Signal } from "@/lib/types";

const groups = {
  Framework: (s: Signal) => s.category === "framework" || s.category === "rendering",
  Infrastructure: (s: Signal) => s.category === "infrastructure",
  Performance: (s: Signal) => s.category === "performance",
  Security: (s: Signal) => s.category === "security",
  API: (s: Signal) => s.category === "api",
};

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export default function StackGrid({ data }: { data: ScanResult }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 py-6 text-center">
        <span className="text-lg font-bold">{data.domain}</span>
        <span className="text-xs text-muted-foreground">
          Scanned in {data.durationMs}ms · {data.architecture.length} signals · {data.inferences.length} inferences
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <ScoreCard label="Overall" value={data.scores.overall} />
        <ScoreCard label="Architecture" value={data.scores.architecture.value} />
        <ScoreCard label="Performance" value={data.scores.performance.value} />
        <ScoreCard label="Security" value={data.scores.security.value} />
        <ScoreCard label="Delivery" value={data.scores.delivery.value} />
      </div>

      {data.inferences.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm text-muted-foreground">Architecture inference</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {data.inferences.map((inference) => (
              <div key={inference.id} className="rounded-lg border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">{inference.key}</p>
                    <p className="text-lg font-semibold">{inference.value}</p>
                  </div>
                  <span className="text-sm font-medium">{Math.round(inference.confidence * 100)}%</span>
                </div>
                {inference.evidence.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {inference.evidence.map((evidence) => <li key={evidence}>✓ {evidence}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.entries(groups).map(([group, predicate]) => {
        const items = data.architecture.filter(predicate);
        if (!items.length) return null;
        return (
          <section key={group}>
            <h3 className="mb-3 text-sm text-muted-foreground">{group}</h3>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {items.map((s) => (
                <div key={s.id} className="rounded-lg border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{s.key}</p>
                  <p className="text-lg font-semibold">{String(s.value)}</p>
                  {s.evidence && <p className="mt-2 text-xs text-muted-foreground">{s.evidence}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {data.warnings.length > 0 && (
        <section className="rounded-lg border bg-muted p-5">
          <p className="text-sm font-semibold">Analysis limitations</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {data.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
