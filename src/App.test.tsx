/// <reference types="vitest" />
// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { db } from './lib/db/schema';

afterEach(async () => {
  vi.restoreAllMocks();
  cleanup();
  await db.playLogs.clear();
  await db.machines.clear();
});

describe('log form', () => {
  it('shows local storage guidance on the logs page', async () => {
    renderApp('/logs');

    expect(await screen.findByText('端末内保存')).toBeInTheDocument();
    expect(screen.getByText('GitHub Pages 公開中')).toBeInTheDocument();
  });

  it('returns from the new log form to the log list without a confirmation dialog', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    renderApp('/logs/new');

    await user.type(screen.getByLabelText('ホール名'), '入力途中ホール');
    await user.click(screen.getByRole('link', { name: 'ログ一覧へ戻る' }));

    expect(await screen.findByRole('heading', { name: '最近の実戦' })).toBeInTheDocument();
    expect(screen.queryByText('入力途中ホール')).not.toBeInTheDocument();
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('returns from the edit log form to the log list', async () => {
    const id = 'log-to-edit-back';
    await db.playLogs.add({
      id,
      date: '2026-06-11',
      hallName: '駅前ホール',
      machineId: 'machine-smart-pachinko-a',
      investment: 12000,
      payout: 18000,
      createdAt: '2026-06-11T00:00:00.000Z',
      updatedAt: '2026-06-11T00:00:00.000Z',
    });

    const user = userEvent.setup();
    renderApp(`/logs/${id}/edit`);

    expect(await screen.findByDisplayValue('駅前ホール')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'ログ一覧へ戻る' }));

    expect(await screen.findByRole('heading', { name: '最近の実戦' })).toBeInTheDocument();
    expect(screen.getByText(/駅前ホール/)).toBeInTheDocument();
  });

  it('keeps native date and time controls constrained to the form field', () => {
    renderApp('/logs/new');

    expect(screen.getByLabelText('日付')).toHaveClass('min-w-0', 'max-w-full', 'appearance-none', 'overflow-hidden');
    expect(screen.getByLabelText('開始時刻')).toHaveClass('min-w-0', 'max-w-full', 'appearance-none', 'overflow-hidden');
    expect(screen.getByLabelText('終了時刻')).toHaveClass('min-w-0', 'max-w-full', 'appearance-none', 'overflow-hidden');
  });

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

  it('shows a DMM detail link only in the selected machine preview', async () => {
    const user = userEvent.setup();
    renderApp('/machines');

    await user.click(await screen.findByRole('button', { name: /海物語シリーズ/ }));

    const dmmLink = screen.getByRole('link', { name: 'DMMで詳細を見る' });
    expect(dmmLink).toHaveAttribute('href', 'https://p-town.dmm.com/machines/5001');
    expect(dmmLink).toHaveAttribute('target', '_blank');

    await user.click(screen.getByRole('button', { name: /eリコリス・リコイル/ }));
    expect(screen.getByRole('link', { name: 'DMMで詳細を見る' })).toHaveAttribute(
      'href',
      'https://p-town.dmm.com/machines/4982',
    );

    await user.click(screen.getByRole('button', { name: /e 東京喰種/ }));
    expect(screen.getByRole('link', { name: 'DMMで詳細を見る' })).toHaveAttribute(
      'href',
      'https://p-town.dmm.com/machines/4782',
    );

    await user.click(screen.getByRole('button', { name: /スマートパチンコ A/ }));
    expect(screen.queryByRole('link', { name: 'DMMで詳細を見る' })).not.toBeInTheDocument();
  });

  it('does not show DMM URLs in the log machine select', async () => {
    renderApp('/logs/new');

    const machineSelect = await screen.findByLabelText('機種');
    expect(within(machineSelect).getByRole('option', { name: 'スマートパチンコ A' })).toBeInTheDocument();
    expect(await within(machineSelect).findByRole('option', { name: 'eリコリス・リコイル' })).toBeInTheDocument();
    expect(within(machineSelect).getByRole('option', { name: 'e 東京喰種' })).toBeInTheDocument();
    expect(within(machineSelect).queryByText(/p-town\.dmm\.com/)).not.toBeInTheDocument();
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
