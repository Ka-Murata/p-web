import type { Machine } from '@/domain';

export const seedMachines: Machine[] = [
  {
    id: 'machine-smart-pachinko-a',
    name: 'スマートパチンコ A',
    maker: 'PWT Seed',
    category: 'pachinko',
    memo: 'MVP seed machine',
  },
  {
    id: 'machine-umi-series',
    name: '海物語シリーズ',
    maker: 'SANYO',
    category: 'pachinko',
    memo: '定番シリーズ',
  },
  {
    id: 'machine-eva-series',
    name: 'エヴァンゲリオン系',
    maker: 'Bisty',
    category: 'pachinko',
    memo: '人気シリーズ',
  },
  {
    id: 'machine-hokuto-series',
    name: '北斗シリーズ',
    maker: 'Sammy',
    category: 'pachinko',
    memo: 'バトル系シリーズ',
  },
];
