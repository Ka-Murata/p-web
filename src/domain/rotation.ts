import type { PlayLog, RotationMemo } from './types';

export type RotationRateSummary = {
  totalSpins: number;
  adjustedInvestment: number;
  ratePerThousandYen: number | undefined;
  isAdjusted: boolean;
};

export type MachineUnitRotationBucket = RotationRateSummary & {
  key: string;
  label: string;
  hallName: string;
  machineId: string;
  machineName: string;
  machineUnitMemo?: string;
  playCount: number;
};

export function calculateAdjustedInvestment(
  investment: number,
  ballRateYen?: number,
  reinvestedPayoutBalls?: number,
) {
  if (ballRateYen === undefined || reinvestedPayoutBalls === undefined) {
    return investment;
  }

  return investment + ballRateYen * reinvestedPayoutBalls;
}

export function calculateRotationRatePerThousandYen(totalSpins: number, adjustedInvestment: number) {
  if (totalSpins <= 0 || adjustedInvestment <= 0) {
    return undefined;
  }

  return (totalSpins / adjustedInvestment) * 1000;
}

export function summarizeRotationRate(logs: PlayLog[]): RotationRateSummary {
  let totalSpins = 0;
  let adjustedInvestment = 0;
  let isAdjusted = false;

  for (const log of logs) {
    totalSpins += sumRotationMemoSpins(log.rotationMemos);
    adjustedInvestment += calculateAdjustedInvestment(log.investment, log.ballRateYen, log.reinvestedPayoutBalls);
    isAdjusted = isAdjusted || hasReinvestmentAdjustment(log);
  }

  return {
    totalSpins,
    adjustedInvestment,
    ratePerThousandYen: calculateRotationRatePerThousandYen(totalSpins, adjustedInvestment),
    isAdjusted,
  };
}

export function groupLogsByMachineUnit(playLogs: PlayLog[], machineNameById = new Map<string, string>()) {
  const groups = new Map<string, PlayLog[]>();

  for (const log of playLogs) {
    const key = getMachineUnitKey(log);
    const group = groups.get(key);

    if (group) {
      group.push(log);
    } else {
      groups.set(key, [log]);
    }
  }

  return Array.from(groups.entries())
    .map(([key, logs]) => createMachineUnitBucket(key, logs, machineNameById))
    .sort(compareByRotationRateDesc);
}

function createMachineUnitBucket(
  key: string,
  logs: PlayLog[],
  machineNameById: Map<string, string>,
): MachineUnitRotationBucket {
  const firstLog = logs[0];
  const machineName = machineNameById.get(firstLog.machineId) ?? '未登録機種';
  const machineUnitMemo = firstLog.machineUnitMemo?.trim() || undefined;

  return {
    key,
    label: machineUnitMemo ? `${machineName} / ${machineUnitMemo}` : machineName,
    hallName: firstLog.hallName,
    machineId: firstLog.machineId,
    machineName,
    machineUnitMemo,
    playCount: logs.length,
    ...summarizeRotationRate(logs),
  };
}

function getMachineUnitKey(log: PlayLog) {
  const unit = log.machineUnitMemo?.trim();
  return unit ? `${log.hallName}::${log.machineId}::${unit}` : `${log.hallName}::${log.machineId}`;
}

function sumRotationMemoSpins(rotationMemos: RotationMemo[] | undefined) {
  if (!rotationMemos || rotationMemos.length === 0) {
    return 0;
  }

  return rotationMemos.reduce((sum, memo) => sum + memo.spins, 0);
}

function hasReinvestmentAdjustment(log: PlayLog) {
  return log.ballRateYen !== undefined && log.reinvestedPayoutBalls !== undefined && log.reinvestedPayoutBalls > 0;
}

function compareByRotationRateDesc(left: MachineUnitRotationBucket, right: MachineUnitRotationBucket) {
  return (right.ratePerThousandYen ?? 0) - (left.ratePerThousandYen ?? 0);
}
