/// <reference types="vitest" />
// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { db } from './lib/db/schema';

afterEach(async () => {
  cleanup();
  await db.playLogs.clear();
  await db.machines.clear();
});

describe('log form', () => {
  it('shows validation errors for missing required fields', async () => {
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.click(screen.getByRole('button', { name: /保存/ }));

    expect(await screen.findByText('ホール名を入力してください。')).toBeInTheDocument();
    expect(screen.getByText('機種を選択してください。')).toBeInTheDocument();
    expect(screen.getAllByText('0以上の数値を入力してください。')).toHaveLength(2);
  });

  it('updates profit preview as investment and payout change', async () => {
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.type(screen.getByLabelText('投資'), '10000');
    await user.type(screen.getByLabelText('回収'), '15000');

    expect(screen.getByLabelText('収支プレビュー')).toHaveTextContent('￥5,000');
  });

  it('saves a valid log and shows it in the log list', async () => {
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.clear(screen.getByLabelText('日付'));
    await user.type(screen.getByLabelText('日付'), '2026-06-11');
    await user.type(screen.getByLabelText('ホール名'), '駅前ホール');
    const machineSelect = await screen.findByLabelText('機種');
    await within(machineSelect).findByRole('option', { name: 'スマートパチンコ A' });
    await user.selectOptions(machineSelect, 'machine-smart-pachinko-a');
    await user.type(screen.getByLabelText('投資'), '10000');
    await user.type(screen.getByLabelText('回収'), '15500');
    await user.click(screen.getByRole('button', { name: /保存/ }));

    await waitFor(() => expect(screen.getByText(/駅前ホール/)).toBeInTheDocument());
    expect(screen.getByText('スマートパチンコ A')).toBeInTheDocument();
    expect(screen.getAllByText('￥5,500').length).toBeGreaterThan(0);
  });


  it('saves rotation memos, excludes empty rows, and shows a list excerpt', async () => {
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.clear(screen.getByLabelText('日付'));
    await user.type(screen.getByLabelText('日付'), '2026-06-11');
    await user.type(screen.getByLabelText('ホール名'), '駅前ホール');
    const machineSelect = await screen.findByLabelText('機種');
    await within(machineSelect).findByRole('option', { name: 'スマートパチンコ A' });
    await user.selectOptions(machineSelect, 'machine-smart-pachinko-a');
    await user.type(screen.getByLabelText('投資'), '10000');
    await user.type(screen.getByLabelText('回収'), '15500');
    await user.type(screen.getByLabelText('投資額'), '10000');
    await user.type(screen.getByLabelText('回転数'), '162');
    await user.type(screen.getByLabelText('メモ', { selector: '#rotation-note-0' }), '最初は良好');
    await user.click(screen.getByRole('button', { name: /^追加$/ }));
    await user.click(screen.getByRole('button', { name: /保存/ }));

    await waitFor(() => expect(screen.getByText(/駅前ホール/)).toBeInTheDocument());
    expect(screen.getByText('回転メモ ￥10,000=162回')).toBeInTheDocument();

    const savedLogs = await db.playLogs.toArray();
    expect(savedLogs[0]?.rotationMemos).toEqual([{ investment: 10000, spins: 162, note: '最初は良好' }]);
  });

  it('does not save an empty rotation memo row', async () => {
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.type(screen.getByLabelText('ホール名'), '駅前ホール');
    const machineSelect = await screen.findByLabelText('機種');
    await within(machineSelect).findByRole('option', { name: 'スマートパチンコ A' });
    await user.selectOptions(machineSelect, 'machine-smart-pachinko-a');
    await user.type(screen.getByLabelText('投資'), '10000');
    await user.type(screen.getByLabelText('回収'), '15500');
    await user.click(screen.getByRole('button', { name: /保存/ }));

    await waitFor(() => expect(screen.getByText(/駅前ホール/)).toBeInTheDocument());

    const savedLogs = await db.playLogs.toArray();
    expect(savedLogs[0]?.rotationMemos).toBeUndefined();
    expect(screen.queryByText(/^回転メモ/)).not.toBeInTheDocument();
  });

  it('restores rotation memos on the edit form', async () => {
    const id = 'log-with-rotation';
    await db.playLogs.add({
      id,
      date: '2026-06-11',
      hallName: '駅前ホール',
      machineId: 'machine-smart-pachinko-a',
      investment: 12000,
      payout: 18000,
      rotationMemos: [{ investment: 10000, spins: 162, note: '最初は良好' }],
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    });

    renderApp(`/logs/${id}/edit`);

    expect(await screen.findByDisplayValue('10000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('162')).toBeInTheDocument();
    expect(screen.getByDisplayValue('最初は良好')).toBeInTheDocument();
  });
});

function renderApp(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
