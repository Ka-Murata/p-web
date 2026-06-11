import type { PlayLog, ProfitResult, ProfitSummary } from './types';

export function calculateProfit(investment: number, payout: number) {
  return payout - investment;
}

export function getProfitResult(profit: number): ProfitResult {
  if (profit > 0) {
    return 'win';
  }

  if (profit < 0) {
    return 'lose';
  }

  return 'draw';
}

export function calculateWinRate(results: ProfitResult[]) {
  if (results.length === 0) {
    return 0;
  }

  const winCount = results.filter((result) => result === 'win').length;
  return winCount / results.length;
}

export function calculateAverageProfit(profits: number[]) {
  if (profits.length === 0) {
    return 0;
  }

  const total = profits.reduce((sum, profit) => sum + profit, 0);
  return total / profits.length;
}

export function summarizePlayLogs(playLogs: PlayLog[]): ProfitSummary {
  const initialSummary: ProfitSummary = {
    totalInvestment: 0,
    totalPayout: 0,
    totalProfit: 0,
    playCount: playLogs.length,
    winCount: 0,
    loseCount: 0,
    drawCount: 0,
    winRate: 0,
    averageProfit: 0,
  };

  const summary = playLogs.reduce((current, log) => {
    const profit = calculateProfit(log.investment, log.payout);
    const result = getProfitResult(profit);

    return {
      ...current,
      totalInvestment: current.totalInvestment + log.investment,
      totalPayout: current.totalPayout + log.payout,
      totalProfit: current.totalProfit + profit,
      winCount: current.winCount + (result === 'win' ? 1 : 0),
      loseCount: current.loseCount + (result === 'lose' ? 1 : 0),
      drawCount: current.drawCount + (result === 'draw' ? 1 : 0),
    };
  }, initialSummary);

  return {
    ...summary,
    winRate: calculateWinRate(playLogs.map((log) => getProfitResult(calculateProfit(log.investment, log.payout)))),
    averageProfit: calculateAverageProfit(playLogs.map((log) => calculateProfit(log.investment, log.payout))),
  };
}
