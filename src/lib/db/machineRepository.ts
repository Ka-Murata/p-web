import type { Machine } from '@/domain';
import { seedMachines } from '@/data/machines';
import { db, type PachinkoWalletDb } from './schema';

export function createMachineRepository(database: PachinkoWalletDb = db) {
  return {
    async getAll() {
      return database.machines.orderBy('name').toArray();
    },

    async getById(id: string) {
      return database.machines.get(id);
    },

    async upsertMany(machines: Machine[]) {
      await database.machines.bulkPut(machines);
      return machines;
    },

    async syncSeeds() {
      await database.machines.bulkPut(seedMachines);
      return database.machines.orderBy('name').toArray();
    },
  };
}

export const machineRepository = createMachineRepository();
