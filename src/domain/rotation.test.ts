import { describe, expect, it } from 'vitest';
import {
  calculateAdjustedInvestment,
  calculateRotationRatePerThousandYen,
  groupLogsByMachineUnit,
  summarizeRotationRate,
} from './rotation';
import type { PlayLog } from './types';

describe('rotation rate calculations', () => {
  it('calculates adjusted investment from cash and reinvested payout balls', () => {
    expect(calculateAdjustedInvestment(28000, 4, 2500)).toBe(38000);
    expect(calculateAdjustedInvestment(28000)).toBe(28000);
    expect(calculateAdjustedInvestment(28000, 4)).toBe(28000);
  });

  it('calculates rate per 1,000 yen safely', () => {
    expect(calculateRotationRatePerThousandYen(676, 38000)).toBeCloseTo(17.789);
    expect(calculateRotationRatePerThousandYen(0, 38000)).toBeUndefined();
    expect(calculateRotationRatePerThousandYen(676, 0)).toBeUndefined();
  });

  it('summarizes logs with and without payout ball adjustment', () => {
    const summary = summarizeRotationRate([
      createLog({
        investment: 28000,
        ballRateYen: 4,
        reinvestedPayoutBalls: 2500,
        rotationMemos: [{ investment: 10000, spins: 178 }],
      }),
      createLog({
        id: '2',
        investment: 10000,
        rotationMemos: [{ investment: 10000, spins: 170 }],
      }),
    ]);

    expect(summary).toMatchObject({
      totalSpins: 348,
      adjustedInvestment: 48000,
      isAdjusted: true,
    });
    expect(summary.ratePerThousandYen).toBeCloseTo(7.25);
  });

  it('groups logs by hall, machine, and optional machine unit memo', () => {
    const buckets = groupLogsByMachineUnit(
      [
        createLog({
          id: '1',
          hallName: '駅前ホール',
          machineId: 'machine-a',
          machineUnitMemo: '328番台',
          investment: 10000,
          rotationMemos: [{ investment: 10000, spins: 180 }],
        }),
        createLog({
          id: '2',
          hallName: '駅前ホール',
          machineId: 'machine-a',
          machineUnitMemo: '328番台',
          investment: 10000,
          rotationMemos: [{ investment: 10000, spins: 170 }],
        }),
        createLog({
          id: '3',
          hallName: '駅前ホール',
          machineId: 'machine-a',
          investment: 10000,
          rotationMemos: [{ investment: 10000, spins: 140 }],
        }),
      ],
      new Map([['machine-a', '機種A']]),
    );

    expect(buckets).toMatchObject([
      {
        key: '駅前ホール::machine-a::328番台',
        label: '機種A / 328番台',
        playCount: 2,
        totalSpins: 350,
      },
      {
        key: '駅前ホール::machine-a',
        label: '機種A',
        playCount: 1,
        totalSpins: 140,
      },
    ]);
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
