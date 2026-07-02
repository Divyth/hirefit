const telemetry = {
  resumeParseMs: [],
  skillScoreMs: [],
  geminiExplainMs: [],
  requestMs: [],
  malformedOutputCount: 0,
  retryCount: 0,
  fallbackCount: 0
};

function recordSample(bucket, value) {
  if (!Number.isFinite(value)) return;
  bucket.push(value);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

export function nowMs() {
  return Number(process.hrtime.bigint()) / 1e6;
}

export function measure(label, fn, onSample) {
  const start = nowMs();
  return Promise.resolve(fn()).then((result) => {
    const ms = nowMs() - start;
    onSample?.(ms);
    return { result, ms };
  });
}

export function recordMetric(name, ms) {
  if (name === 'resumeParseMs') recordSample(telemetry.resumeParseMs, ms);
  if (name === 'skillScoreMs') recordSample(telemetry.skillScoreMs, ms);
  if (name === 'geminiExplainMs') recordSample(telemetry.geminiExplainMs, ms);
  if (name === 'requestMs') recordSample(telemetry.requestMs, ms);
}

export function incrementMetric(name, amount = 1) {
  if (name in telemetry && typeof telemetry[name] === 'number') {
    telemetry[name] += amount;
  }
}

export function snapshotMetrics() {
  const summarize = (values) => ({
    count: values.length,
    avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
    p95: percentile(values, 95),
    p99: percentile(values, 99)
  });
  return {
    resumeParseMs: summarize(telemetry.resumeParseMs),
    skillScoreMs: summarize(telemetry.skillScoreMs),
    geminiExplainMs: summarize(telemetry.geminiExplainMs),
    requestMs: summarize(telemetry.requestMs),
    malformedOutputCount: telemetry.malformedOutputCount,
    retryCount: telemetry.retryCount,
    fallbackCount: telemetry.fallbackCount
  };
}

export function resetMetrics() {
  telemetry.resumeParseMs = [];
  telemetry.skillScoreMs = [];
  telemetry.geminiExplainMs = [];
  telemetry.requestMs = [];
  telemetry.malformedOutputCount = 0;
  telemetry.retryCount = 0;
  telemetry.fallbackCount = 0;
}
