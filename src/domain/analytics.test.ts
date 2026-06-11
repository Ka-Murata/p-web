import { describe, expect, it } from 'vitest';
import {
  filterLogsByMonth,
  getCurrentMonthLogs,
  getProfitRanking,
  groupLogsByHall,
  groupLogsByMachine,
  groupLogsByMonth,
  summarizeCurrentMonth,
} from './analytics';
import type { PlayLog } from './types';

describe('analytics aggregations', () => {
  const logs: PlayLog[] = [
    createLog({ id: '1', date: '2026-06-02', hallName: '駅前ホール', machineId: 'machine-a', investment: 10000, payout: 18000 }),
    createLog({ id: '2', date: '2026-06-15', hallName: '中央店', machineId: 'machine-b', investment: 15000, payout: 5000 }),
    createLog({ id: '3', date: '2026-05-20', hallName: '駅前ホール', machineId: 'machine-a', investment: 8000, payout: 8000 }),
    createLog({ id: '4', date: '2026-05-25', hallName: '郊外店', machineId: 'machine-c', investment: 5000, payout: 15000 }),
  ];

  it('filters and summarizes the selected/current month', () => {
    expect(filterLogsByMonth(logs, '2026-06')).toHaveLength(2);
    expect(getCurrentMonthLogs(logs, new Date('2026-06-11T00:00:00.000Z'))).toHaveLength(2);
    expect(summarizeCurrentMonth(logs, new Date('2026-06-11T00:00:00.000Z'))).toMatchObject({
      totalInvestment: 25000,
      totalPayout: 23000,
      totalProfit: -2000,
      winCount: 1,
      loseCount: 1,
      winRate: 0.5,
      averageProfit: -1000,
    });
  });

  it('groups logs by month', () => {
    expect(groupLogsByMonth(logs)).toMatchObject([
      { key: '2026-05', totalProfit: 10000, playCount: 2 },
      { key: '2026-06', totalProfit: -2000, playCount: 2 },
    ]);
  });

  it('groups logs by hall', () => {
    expect(groupLogsByHall(logs)).toMatchObject([
      { key: '郊外店', totalProfit: 10000, playCount: 1 },
      { key: '駅前ホール', totalProfit: 8000, playCount: 2 },
      { key: '中央店', totalProfit: -10000, playCount: 1 },
    ]);
  });

  it('groups logs by machine with labels', () => {
    const machineNames = new Map([
      ['machine-a', '機種A'],
      ['machine-b', '機種B'],
      ['machine-c', '機種C'],
    ]);

    expect(groupLogsByMachine(logs, machineNames)).toMatchObject([
      { key: 'machine-c', label: '機種C', totalProfit: 10000 },
      { key: 'machine-a', label: '機種A', totalProfit: 8000 },
      { key: 'machine-b', label: '機種B', totalProfit: -10000 },
    ]);
  });

  it('returns best and worst rankings without mutating input', () => {
    const buckets = groupLogsByHall(logs);

    expect(getProfitRanking(buckets, 'best', 2).map((bucket) => bucket.key)).toEqual(['郊外店', '駅前ホール']);
    expect(getProfitRanking(buckets, 'worst', 2).map((bucket) => bucket.key)).toEqual(['中央店', '駅前ホール']);
    expect(buckets.map((bucket) => bucket.key)).toEqual(['郊外店', '駅前ホール', '中央店']);
  });

  it('handles empty analytics boundaries', () => {
    expect(groupLogsByMonth([])).toEqual([]);
    expect(groupLogsByHall([])).toEqual([]);
    expect(groupLogsByMachine([])).toEqual([]);
    expect(summarizeCurrentMonth([], new Date('2026-06-11T00:00:00.000Z'))).toMatchObject({
      winRate: 0,
      averageProfit: 0,
      totalProfit: 0,
    });
  });
});

function createLog(overrides: Partial<PlayLog>): PlayLog {
  return {
    id: 'log',
    date: '2026-06-11',
    hallName: '駅前ホール',
    machineId: 'machine-a',
    investment: 0,
    payout: 0,
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}
