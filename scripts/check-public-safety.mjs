import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

const allowedEnvFiles = new Set(['.env.example']);
const ignoredContentPaths = [
  /^docs\//,
  /^package-lock\.json$/,
  /^backlog\.md$/,
  /^scripts\/check-public-safety\.mjs$/,
];
const forbiddenFilePatterns = [
  { test: (file) => /^\.env(?:\..+)?$/.test(basename(file)) && !allowedEnvFiles.has(basename(file)), label: '.env file' },
  { test: (file) => /\.(?:pem|key)$/i.test(file), label: 'private key file' },
  { test: (file) => ['id_rsa', 'id_ed25519'].includes(basename(file)), label: 'ssh private key file' },
];
const secretPatterns = [
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: 'private key block' },
  { pattern: /\bAWS_ACCESS_KEY_ID\s*=/, label: 'AWS_ACCESS_KEY_ID assignment' },
  { pattern: /\bAWS_SECRET_ACCESS_KEY\s*=/, label: 'AWS_SECRET_ACCESS_KEY assignment' },
  { pattern: /\bGITHUB_TOKEN\s*=/, label: 'GITHUB_TOKEN assignment' },
  { pattern: /\b(?:SECRET|PASSWORD|TOKEN)\s*=/, label: 'secret-like assignment' },
  { pattern: /\bAKIA[0-9A-Z]{16}\b/, label: 'AWS access key id' },
  { pattern: /\bghp_[A-Za-z0-9_]{36}\b/, label: 'GitHub personal access token' },
  { pattern: /\bgithub_pat_[A-Za-z0-9_]{80,}\b/, label: 'GitHub fine-grained token' },
];

const output = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
const files = output.split('\n').filter(Boolean);
const failures = [];

for (const file of files) {
  for (const { test, label } of forbiddenFilePatterns) {
    if (test(file)) failures.push(file + ': forbidden ' + label);
  }
  if (ignoredContentPaths.some((pattern) => pattern.test(file))) continue;
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const { pattern, label } of secretPatterns) {
    if (pattern.test(content)) failures.push(file + ': possible ' + label);
  }
}

if (failures.length > 0) {
  console.error('Public safety check failed:');
  for (const failure of failures) console.error('- ' + failure);
  process.exit(1);
}
console.log('Public safety check passed.');
