#!/usr/bin/env node
// Simple local load test for /api/dashboard using autocannon.
import autocannon from 'autocannon';

const url = process.env.LOADTEST_URL ?? 'http://localhost:3000/api/dashboard';
const connections = Number(process.env.LOADTEST_CONN ?? 20);
const duration = Number(process.env.LOADTEST_DURATION ?? 20);

const headers = {
  'x-winoe-request-id': `load-${Date.now()}`,
};

const cookie = process.env.LOADTEST_COOKIE;
const authHeader = process.env.LOADTEST_AUTH_HEADER;

const writeStderr = (message) => {
  process.stderr.write(`${message}\n`);
};

if (cookie) headers.Cookie = cookie;
if (authHeader) headers.Authorization = authHeader;

const run = () =>
  new Promise((resolve, reject) => {
    autocannon(
      {
        url,
        method: 'GET',
        connections,
        duration,
        headers,
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        autocannon.printResult(result);
        resolve(result);
      },
    );
  });

if (!cookie && !authHeader) {
  writeStderr(
    'Warning: no LOADTEST_COOKIE or LOADTEST_AUTH_HEADER provided; results may just reflect 401/403 responses.',
  );
}

run().catch((err) => {
  writeStderr(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
