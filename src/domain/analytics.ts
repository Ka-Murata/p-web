import type { PlayLog, ProfitSummary } from './types';
import { summarizePlayLogs } from './profit';

export type SummaryBucket = ProfitSummary & {
  key: string;
  label: string;
};

export type RankingDirection = 'best' | 'worst';

const monthFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
});

export function getMonthKey(date: string) {
  return date.slice(0, 7);
}

export function getCurrentMonthKey(now = new Date()) {
  return now.toISOString().slice(0, 7);
}

export function filterLogsByMonth(playLogs: PlayLog[], monthKey: string) {
  return playLogs.filter((log) => getMonthKey(log.date) === monthKey);
}

export function getCurrentMonthLogs(playLogs: PlayLog[], now = new Date()) {
  return filterLogsByMonth(playLogs, getCurrentMonthKey(now));
}

export function summarizeCurrentMonth(playLogs: PlayLog[], now = new Date()) {
  return summarizePlayLogs(getCurrentMonthLogs(playLogs, now));
}

export function groupLogsByMonth(playLogs: PlayLog[]) {
  const groups = groupBy(playLogs, (log) => getMonthKey(log.date));

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, logs]) => createBucket(key, formatMonthLabel(key), logs));
}

export function groupLogsByHall(playLogs: PlayLog[]) {
  const groups = groupBy(playLogs, (log) => log.hallName);

  return Array.from(groups.entries())
    .map(([key, logs]) => createBucket(key, key, logs))
    .sort(compareByProfitDesc);
}

export function groupLogsByMachine(playLogs: PlayLog[], machineNameById = new Map<string, string>()) {
  const groups = groupBy(playLogs, (log) => log.machineId);

  return Array.from(groups.entries())
    .map(([key, logs]) => createBucket(key, machineNameById.get(key) ?? '未登録機種', logs))
    .sort(compareByProfitDesc);
}

export function getProfitRanking(buckets: SummaryBucket[], direction: RankingDirection, limit = 3) {
  const sorted = [...buckets].sort((left, right) => {
    const diff = left.totalProfit - right.totalProfit;
    return direction === 'best' ? -diff : diff;
  });

  return sorted.slice(0, limit);
}

function createBucket(key: string, label: string, logs: PlayLog[]): SummaryBucket {
  return {
    key,
    label,
    ...summarizePlayLogs(logs),
  };
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = getKey(item);
    const group = groups.get(key);

    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return groups;
}

function compareByProfitDesc(left: SummaryBucket, right: SummaryBucket) {
  return right.totalProfit - left.totalProfit;
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number);
  return monthFormatter.format(new Date(year, month - 1, 1));
}
