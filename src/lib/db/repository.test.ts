import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { seedMachines } from '@/data/machines';
import type { CreatePlayLogInput } from '@/domain';
import { createMachineRepository } from './machineRepository';
import { createPlayLogRepository } from './playLogRepository';
import { PachinkoWalletDb } from './schema';

let database: PachinkoWalletDb;

beforeEach(() => {
  database = new PachinkoWalletDb(`pwt-test-${crypto.randomUUID()}`);
});

afterEach(async () => {
  await database.delete();
});

describe('playLogRepository', () => {
  it('adds, reads, updates, and deletes play logs', async () => {
    const repository = createPlayLogRepository(database);
    const input: CreatePlayLogInput = {
      date: '2026-06-11',
      hallName: '駅前ホール',
      machineId: seedMachines[0].id,
      investment: 10000,
      payout: 15000,
      memo: '初当たり軽め',
      tags: ['仕事帰り'],
      rotationMemos: [{ investment: 10000, spins: 162, note: '最初は良好' }],
    };

    const created = await repository.add(input);
    expect(created).toMatchObject(input);
    expect(created.rotationMemos).toEqual([{ investment: 10000, spins: 162, note: '最初は良好' }]);

    await repository.add({
      ...input,
      date: '2026-06-12',
      investment: 20000,
      payout: 0,
    });

    const allLogs = await repository.getAll();
    expect(allLogs).toHaveLength(2);
    expect(allLogs[0].date).toBe('2026-06-12');

    const updated = await repository.update(created.id, {
      payout: 18000,
      rotationMemos: [{ investment: 20000, spins: 315 }],
    });
    expect(updated?.payout).toBe(18000);
    expect(updated?.rotationMemos).toEqual([{ investment: 20000, spins: 315 }]);
    expect(updated?.updatedAt).toEqual(expect.any(String));

    await repository.delete(created.id);
    expect(await repository.getById(created.id)).toBeUndefined();
  });
});

describe('machineRepository', () => {
  it('syncs machine seeds without duplicates', async () => {
    const repository = createMachineRepository(database);

    await repository.syncSeeds();
    await repository.syncSeeds();

    const machines = await repository.getAll();
    expect(machines).toHaveLength(seedMachines.length);
    expect(machines.map((machine) => machine.id).sort()).toEqual(
      seedMachines.map((machine) => machine.id).sort(),
    );
    expect(machines.find((machine) => machine.id === 'machine-umi-series')?.dmmUrl).toBe(
      'https://p-town.dmm.com/machines/5001',
    );
    expect(machines.find((machine) => machine.id === 'dmm-pachinko-4982')).toMatchObject({
      name: 'eリコリス・リコイル',
      maker: 'ニューギン',
      dmmUrl: 'https://p-town.dmm.com/machines/4982',
    });
    expect(machines.find((machine) => machine.id === 'dmm-pachinko-4782')).toMatchObject({
      name: 'e 東京喰種',
      maker: 'ビスティ',
      dmmUrl: 'https://p-town.dmm.com/machines/4782',
    });
  });

  it('keeps machines without DMM URLs readable', async () => {
    const repository = createMachineRepository(database);

    await repository.upsertMany([
      {
        id: 'machine-without-dmm',
        name: 'URLなし機種',
        maker: 'PWT Seed',
        category: 'pachinko',
      },
    ]);

    await expect(repository.getById('machine-without-dmm')).resolves.toMatchObject({
      id: 'machine-without-dmm',
      name: 'URLなし機種',
    });
  });
});
