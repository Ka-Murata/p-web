export type MachineCategory = 'pachinko' | 'slot' | 'other';

export type RotationMemo = {
  investment: number;
  spins: number;
  note?: string;
};

export type PlayLog = {
  id: string;
  date: string;
  hallName: string;
  machineId: string;
  investment: number;
  payout: number;
  startTime?: string;
  endTime?: string;
  exchangeRate?: number;
  memo?: string;
  tags?: string[];
  rotationMemos?: RotationMemo[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePlayLogInput = Omit<PlayLog, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdatePlayLogInput = Partial<CreatePlayLogInput>;

export type Machine = {
  id: string;
  name: string;
  maker: string;
  category: MachineCategory;
  dmmUrl?: string;
  memo?: string;
};

export type ProfitResult = 'win' | 'lose' | 'draw';

export type ProfitSummary = {
  totalInvestment: number;
  totalPayout: number;
  totalProfit: number;
  playCount: number;
  winCount: number;
  loseCount: number;
  drawCount: number;
  winRate: number;
  averageProfit: number;
};
