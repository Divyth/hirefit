import fs from 'fs/promises';
import path from 'path';

const baseUrl = process.env.BASE_URL || 'http://localhost:5050/api';
const email = process.env.TEST_EMAIL || `metrics.${Date.now()}@example.com`;
const password = process.env.TEST_PASSWORD || 'MetricsPass123!';
const name = process.env.TEST_NAME || 'Metrics User';
const resumePath =
  process.env.RESUME_PATH ||
  path.resolve('server/uploads/resumes/1782865197597-37051199-DIVY_RESUME.pdf');

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const avg = values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
  const pick = (p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)] : 0;
  return { count: values.length, avg, p95: pick(95), p99: pick(99) };
}

async function requestJson(url, options = {}) {
  const started = performance.now();
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  const payload = await response.json().catch(() => ({}));
  return { ms: performance.now() - started, ok: response.ok, status: response.status, payload };
}

async function uploadResume(token) {
  const started = performance.now();
  const form = new FormData();
  const file = await fs.readFile(resumePath);
  form.append('resume', new Blob([file], { type: 'application/pdf' }), path.basename(resumePath));
  const response = await fetch(`${baseUrl}/resume/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form
  });
  const payload = await response.json();
  return { ms: performance.now() - started, status: response.status, payload };
}

async function main() {
  const register = await requestJson(`${baseUrl}/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
  const token = register.payload.token || (await requestJson(`${baseUrl}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })).payload.token;

  if (!token) {
    throw new Error(`Unable to authenticate: ${JSON.stringify(register.payload)}`);
  }

  const job = await requestJson(`${baseUrl}/jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      title: 'SDE New Grad',
      description:
        'Build backend and frontend features in Node.js, React, TypeScript, MongoDB, SQL, and AI-assisted workflows. Work on APIs, observability, reliability, and product quality improvements.'
    })
  });

  const jobId = job.payload.job?._id;
  const uploadLatencies = [];
  let resumeId;
  for (let i = 0; i < 10; i += 1) {
    const upload = await uploadResume(token);
    uploadLatencies.push(upload.ms);
    resumeId = upload.payload.resume?._id;
  }

  const metricsBefore = await requestJson(`${baseUrl}/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const before = metricsBefore.payload;

  const matchLatencies = [];
  const questionLatencies = [];
  const enhanceLatencies = [];
  const requestLatencies = [];
  const failureStatuses = [];

  for (let i = 0; i < 10; i += 1) {
    const match = await requestJson(`${baseUrl}/ai/match`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resumeId, jobId })
    });
    matchLatencies.push(match.ms);
    requestLatencies.push(match.ms);
    if (!match.ok) failureStatuses.push({ endpoint: 'match', status: match.status });

    const questions = await requestJson(`${baseUrl}/ai/questions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ resumeId, jobId })
    });
    questionLatencies.push(questions.ms);
    requestLatencies.push(questions.ms);
    if (!questions.ok) failureStatuses.push({ endpoint: 'questions', status: questions.status });

    const enhance = await requestJson(`${baseUrl}/ai/enhance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bullet: 'Built an internal workflow tracking tool using Angular, TypeScript, and PostgreSQL.' })
    });
    enhanceLatencies.push(enhance.ms);
    requestLatencies.push(enhance.ms);
    if (!enhance.ok) failureStatuses.push({ endpoint: 'enhance', status: enhance.status });
  }

  const metricsAfter = await requestJson(`${baseUrl}/metrics`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  console.log(JSON.stringify({
    authMs: register.ms,
    uploadMs: stats(uploadLatencies),
    jobMs: job.ms,
    before,
    after: metricsAfter.payload,
    latency: {
      match: stats(matchLatencies),
      questions: stats(questionLatencies),
      enhance: stats(enhanceLatencies),
      request: stats(requestLatencies)
    },
    failures: failureStatuses
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
