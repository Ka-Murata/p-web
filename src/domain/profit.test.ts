import { describe, expect, it } from 'vitest';
import {
  calculateAverageProfit,
  calculateProfit,
  calculateWinRate,
  getProfitResult,
  summarizePlayLogs,
} from './profit';
import type { PlayLog } from './types';

describe('profit calculations', () => {
  it('calculates payout minus investment', () => {
    expect(calculateProfit(10000, 18500)).toBe(8500);
    expect(calculateProfit(20000, 12000)).toBe(-8000);
    expect(calculateProfit(5000, 5000)).toBe(0);
  });

  it('classifies positive, negative, and zero profit', () => {
    expect(getProfitResult(1)).toBe('win');
    expect(getProfitResult(-1)).toBe('lose');
    expect(getProfitResult(0)).toBe('draw');
  });

  it('calculates win rate and average profit', () => {
    expect(calculateWinRate(['win', 'lose', 'draw', 'win'])).toBe(0.5);
    expect(calculateWinRate([])).toBe(0);
    expect(calculateAverageProfit([1000, -500, 0])).toBeCloseTo(166.6666667);
    expect(calculateAverageProfit([])).toBe(0);
  });

  it('summarizes play logs without using rotation memos', () => {
    const logs: PlayLog[] = [
      createLog({
        id: '1',
        investment: 10000,
        payout: 15000,
        rotationMemos: [{ investment: 10000, spins: 162 }],
      }),
      createLog({ id: '2', investment: 8000, payout: 3000 }),
      createLog({ id: '3', investment: 5000, payout: 5000 }),
    ];

    expect(summarizePlayLogs(logs)).toMatchObject({
      totalInvestment: 23000,
      totalPayout: 23000,
      totalProfit: 0,
      playCount: 3,
      winCount: 1,
      loseCount: 1,
      drawCount: 1,
      winRate: 1 / 3,
      averageProfit: 0,
    });
  });
});

function createLog(overrides: Partial<PlayLog>): PlayLog {
  return {
    id: 'log',
    date: '2026-06-11',
    hallName: '駅前ホール',
    machineId: 'machine-1',
    investment: 0,
    payout: 0,
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
    ...overrides,
  };
}
