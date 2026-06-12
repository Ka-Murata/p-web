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
    dmmUrl: 'https://p-town.dmm.com/machines/5001',
    memo: '定番シリーズ',
  },
  {
    id: 'dmm-pachinko-4982',
    name: 'eリコリス・リコイル',
    maker: 'ニューギン',
    category: 'pachinko',
    dmmUrl: 'https://p-town.dmm.com/machines/4982',
    memo: 'DMMぱちタウン参照',
  },
  {
    id: 'dmm-pachinko-4782',
    name: 'e 東京喰種',
    maker: 'ビスティ',
    category: 'pachinko',
    dmmUrl: 'https://p-town.dmm.com/machines/4782',
    memo: 'DMMぱちタウン参照',
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
