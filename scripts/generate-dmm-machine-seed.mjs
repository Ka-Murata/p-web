#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const DEFAULT_SOURCES = {
  pachinko: 'https://p-town.dmm.com/machines/pachinko',
  slot: 'https://p-town.dmm.com/machines/slot',
};

const args = parseArgs(process.argv.slice(2));
const category = args.category ?? 'pachinko';
const sourceUrl = args.url ?? DEFAULT_SOURCES[category];
const outFile = args.out ?? 'tmp/dmm-machines.seed.ts';

if (!sourceUrl) {
  exitWithError('Unsupported category: ' + category);
}

try {
  const response = await fetch(sourceUrl, {
    headers: {
      'user-agent': 'pachinko-wallet-tracker seed updater',
      accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error('DMM request failed: ' + response.status + ' ' + response.statusText);
  }

  const html = await response.text();
  const machines = extractMachines(html, sourceUrl, category);

  if (machines.length === 0) {
    throw new Error('No machines were found in the fetched DMM page. The page structure may have changed.');
  }

  const output = formatSeedFile(machines, sourceUrl);
  const resolvedOutFile = resolve(outFile);

  await mkdir(dirname(resolvedOutFile), { recursive: true });
  await writeFile(resolvedOutFile, output, 'utf8');
  console.log('Generated ' + machines.length + ' machine seed candidates: ' + resolvedOutFile);
} catch (error) {
  exitWithError(error instanceof Error ? error.message : String(error));
}

function parseArgs(values) {
  const parsed = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === '--category') {
      parsed.category = values[index + 1];
      index += 1;
    } else if (value === '--url') {
      parsed.url = values[index + 1];
      index += 1;
    } else if (value === '--out') {
      parsed.out = values[index + 1];
      index += 1;
    } else if (value === '--help') {
      printHelp();
      process.exit(0);
    } else {
      exitWithError('Unknown argument: ' + value);
    }
  }

  return parsed;
}

function extractMachines(html, sourceUrl, category) {
  const baseUrl = new URL(sourceUrl);
  const anchors = [...html.matchAll(/<a\b[^>]*href=["']([^"']*\/machines\/[^"'#?]+(?:\?[^"'#]*)?)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const machines = new Map();

  for (const match of anchors) {
    const href = decodeHtml(match[1]);
    const rawLabel = cleanText(stripTags(match[2]));

    if (!rawLabel || rawLabel.length < 2) {
      continue;
    }

    const dmmUrl = new URL(href, baseUrl).toString().replace(/[?#].*$/, '');

    if (!isDetailUrl(dmmUrl)) {
      continue;
    }

    const name = normalizeMachineName(rawLabel);

    if (!name) {
      continue;
    }

    const context = getContext(html, match.index ?? 0, match[0].length);
    const maker = extractMaker(context);
    const id = createMachineId(dmmUrl, name, category);

    if (!machines.has(id)) {
      machines.set(id, { id, name, maker, category, dmmUrl });
    }
  }

  return [...machines.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

function isDetailUrl(url) {
  const pathname = new URL(url).pathname;
  return /^\/machines\/(?:\d+|[a-z0-9-]+)$/i.test(pathname) && !pathname.endsWith('/pachinko') && !pathname.endsWith('/slot');
}

function normalizeMachineName(label) {
  const lines = label
    .split('\n')
    .map((line) => cleanText(line))
    .filter(Boolean)
    .filter((line) => !/^(詳細|もっと見る|DMMぱちタウン)$/i.test(line));

  return lines[0] ?? '';
}

function extractMaker(context) {
  const text = cleanText(stripTags(context));
  const patterns = [
    /(?:メーカー|メーカ)\s*[:：]?\s*([^\s/｜|]+)/,
    /(?:製造|販売)\s*[:：]?\s*([^\s/｜|]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return 'Unknown';
}

function getContext(html, index, length) {
  const start = Math.max(0, index - 800);
  const end = Math.min(html.length, index + length + 800);
  return html.slice(start, end);
}

function createMachineId(dmmUrl, name, category) {
  const pathname = new URL(dmmUrl).pathname;
  const urlId = pathname.split('/').filter(Boolean).at(-1);
  const source = urlId && urlId !== 'machines' ? urlId : name;
  return 'dmm-' + category + '-' + slugify(source);
}

function slugify(value) {
  const normalized = value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || Buffer.from(value).toString('hex').slice(0, 16);
}

function stripTags(value) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, '\n');
}

function cleanText(value) {
  return decodeHtml(value).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function formatSeedFile(machines, sourceUrl) {
  const body = machines
    .map((machine) =>
      '  {\n' +
        "    id: '" + escapeTs(machine.id) + "',\n" +
        "    name: '" + escapeTs(machine.name) + "',\n" +
        "    maker: '" + escapeTs(machine.maker) + "',\n" +
        "    category: '" + escapeTs(machine.category) + "',\n" +
        "    dmmUrl: '" + escapeTs(machine.dmmUrl) + "',\n" +
        '  },',
    )
    .join('\n');

  return "import type { Machine } from '@/domain';\n\n" +
    '// Generated by npm run seed:dmm -- --out tmp/dmm-machines.seed.ts\n' +
    '// Source: ' + sourceUrl + '\n' +
    '// Review before copying entries into src/data/machines.ts.\n' +
    'export const dmmMachineSeedCandidates: Machine[] = [\n' +
    body +
    '\n];\n';
}

function escapeTs(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function printHelp() {
  console.log('Usage: npm run seed:dmm -- [--category pachinko] [--url URL] [--out tmp/dmm-machines.seed.ts]');
}

function exitWithError(message) {
  console.error('DMM seed generation failed: ' + message);
  process.exit(1);
}
