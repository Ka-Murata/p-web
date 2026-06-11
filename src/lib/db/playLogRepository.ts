import type { CreatePlayLogInput, PlayLog, UpdatePlayLogInput } from '@/domain';
import { db, type PachinkoWalletDb } from './schema';

const sortByNewest = (a: PlayLog, b: PlayLog) => {
  const dateCompare = b.date.localeCompare(a.date);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return b.createdAt.localeCompare(a.createdAt);
};

export function createPlayLogRepository(database: PachinkoWalletDb = db) {
  return {
    async getAll() {
      const logs = await database.playLogs.toArray();
      return [...logs].sort(sortByNewest);
    },

    async getById(id: string) {
      return database.playLogs.get(id);
    },

    async add(input: CreatePlayLogInput) {
      const now = new Date().toISOString();
      const playLog: PlayLog = {
        ...input,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await database.playLogs.add(playLog);
      return playLog;
    },

    async update(id: string, input: UpdatePlayLogInput) {
      const existing = await database.playLogs.get(id);

      if (!existing) {
        return undefined;
      }

      const updated: PlayLog = {
        ...existing,
        ...input,
        id,
        updatedAt: new Date().toISOString(),
      };

      await database.playLogs.put(updated);
      return updated;
    },

    async delete(id: string) {
      await database.playLogs.delete(id);
    },
  };
}

export const playLogRepository = createPlayLogRepository();
