import Dexie, { type Table } from 'dexie';
import type { Machine, PlayLog } from '@/domain';

export type PlayLogRecord = PlayLog;
export type MachineRecord = Machine;

export class PachinkoWalletDb extends Dexie {
  playLogs!: Table<PlayLogRecord, string>;
  machines!: Table<MachineRecord, string>;

  constructor(name = 'pachinko-wallet-tracker') {
    super(name);

    this.version(1).stores({
      playLogs: 'id, date, machineId, hallName, createdAt',
      machines: 'id, name, maker, category',
    });

    this.version(2).stores({
      playLogs: 'id, date, machineId, hallName, createdAt',
      machines: 'id, name, maker, category',
    });
  }
}

export const db = new PachinkoWalletDb();
