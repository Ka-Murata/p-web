import { Suspense, lazy, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  CircleDollarSign,
  Cpu,
  ExternalLink,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  calculateProfit,
  getProfitRanking,
  groupLogsByHall,
  groupLogsByMachine,
  groupLogsByMonth,
  summarizeCurrentMonth,
  summarizePlayLogs,
  type CreatePlayLogInput,
  type Machine,
  type PlayLog,
  type RotationMemo,
  type SummaryBucket,
} from '@/domain';
import { useCreatePlayLog, useDeletePlayLog, useMachines, usePlayLog, usePlayLogs, useUpdatePlayLog } from '@/hooks';
import './App.css';

type TabItem = {
  path: string;
  label: string;
  icon: LucideIcon;
};

type RotationMemoFormState = {
  investment: string;
  spins: string;
  note: string;
};

type LogFormState = {
  date: string;
  hallName: string;
  machineId: string;
  investment: string;
  payout: string;
  startTime: string;
  endTime: string;
  exchangeRate: string;
  tags: string;
  memo: string;
  rotationMemos: RotationMemoFormState[];
};

type RotationMemoErrorKey = `rotationMemos.${number}.investment` | `rotationMemos.${number}.spins`;
type LogFormErrorKey = keyof LogFormState | RotationMemoErrorKey;
type LogFormErrors = Partial<Record<LogFormErrorKey, string>>;

const tabs: TabItem[] = [
  { path: '/logs', label: 'ログ', icon: ListChecks },
  { path: '/analytics', label: '分析', icon: BarChart3 },
  { path: '/machines', label: '機種', icon: Cpu },
];

const defaultMachineOptions: Machine[] = [
  { id: 'machine-smart-pachinko-a', name: 'スマートパチンコ A', maker: 'PWT Seed', category: 'pachinko' },
  { id: 'machine-umi-series', name: '海物語シリーズ', maker: 'SANYO', category: 'pachinko' },
];

const currencyFormatter = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('ja-JP', {
  maximumFractionDigits: 0,
});

const MonthlyProfitChart = lazy(() =>
  import('@/components/analytics/MonthlyProfitChart').then((module) => ({ default: module.MonthlyProfitChart })),
);

function AppShell() {
  const { pathname } = useLocation();
  const showsTabNav = !pathname.startsWith('/logs/');

  useMachines();

  return (
    <div className="min-h-svh bg-pwt-background text-pwt-text">
      <div className="mx-auto flex min-h-svh w-full max-w-md flex-col sm:max-w-xl">
        <header className="px-4 pb-3 pt-5">
          <p className="text-sm font-bold text-pwt-muted">Pachinko Wallet Tracker</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-normal text-pwt-primary">
            パチンコ収支管理
          </h1>
        </header>

        <div className={showsTabNav ? 'flex-1 px-4 pb-28' : 'flex-1 px-4 pb-6'}>
          <Routes>
            <Route path="/" element={<Navigate to="/logs" replace />} />
            <Route path="/logs" element={<LogsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/machines" element={<MachinesPage />} />
            <Route path="/logs/new" element={<NewLogPage />} />
            <Route path="/logs/:id/edit" element={<EditLogPage />} />
          </Routes>
        </div>

        {showsTabNav ? <BottomTabNav /> : null}
      </div>
    </div>
  );
}

function BottomTabNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-pwt-primary-soft bg-pwt-surface/95 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_32px_rgb(20_83_45_/_0.08)] backdrop-blur"
      aria-label="主要画面"
    >
      <div className="mx-auto grid max-w-md grid-cols-3 gap-2 sm:max-w-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                [
                  'flex min-h-12 items-center justify-center gap-1.5 rounded-[8px] px-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-pwt-primary-soft',
                  isActive
                    ? 'bg-pwt-primary text-white shadow-sm'
                    : 'bg-pwt-surface-muted text-pwt-muted hover:bg-pwt-primary-soft hover:text-pwt-primary',
                ].join(' ')
              }
            >
              <Icon aria-hidden="true" className="size-4" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

function LogsPage() {
  const { data: playLogs = [], isError: isPlayLogsError, isLoading } = usePlayLogs();
  const { data: machines = [], isError: isMachinesError } = useMachines();
  const machineNameById = useMemo(() => new Map(machines.map((machine) => [machine.id, machine.name])), [machines]);
  const summary = useMemo(() => summarizeCurrentMonth(playLogs), [playLogs]);

  return (
    <main aria-labelledby="logs-title" className="space-y-5">
      <section className="rounded-[8px] bg-pwt-surface p-5 shadow-pwt-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-pwt-muted">今月の収支</p>
            <h2 id="logs-title" className="mt-2 text-4xl font-extrabold tracking-normal text-pwt-text">
              {formatCurrency(summary.totalProfit)}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className="rounded-[8px] bg-pwt-accent-soft px-3 py-2 text-sm font-bold text-pwt-primary">
              {summary.playCount}戦
            </span>
            <span className="rounded-[8px] bg-pwt-primary-soft px-3 py-1.5 text-xs font-extrabold text-pwt-primary">
              端末内保存
            </span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm leading-6 text-pwt-muted">
          <SummaryValue label="投資" value={formatCurrency(summary.totalInvestment)} />
          <SummaryValue label="回収" value={formatCurrency(summary.totalPayout)} />
          <SummaryValue label="勝率" value={`${Math.round(summary.winRate * 100)}%`} />
          <SummaryValue label="平均" value={formatCurrency(summary.averageProfit)} />
        </div>
      </section>

      <section className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-amber-950" aria-labelledby="publish-safety-title">
        <div className="flex items-start gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-pwt-primary" />
          <div className="min-w-0">
            <h2 id="publish-safety-title" className="text-sm font-extrabold tracking-normal">
              GitHub Pages 公開中
            </h2>
            <p className="mt-1 text-sm font-bold leading-6">
              実戦ログはこの端末のブラウザにだけ保存されます。
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="recent-logs-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="recent-logs-title" className="text-lg font-extrabold tracking-normal text-pwt-text">
            最近の実戦
          </h2>
          <Button asChild size="sm">
            <NavLink to="/logs/new">
              <Plus aria-hidden="true" />
              追加
            </NavLink>
          </Button>
        </div>

        {isPlayLogsError || isMachinesError ? <StatusCard tone="danger" text="ログの読み込みに失敗しました。時間をおいて再度開いてください。" /> : null}
        {isLoading ? <StatusCard text="ログを読み込み中です。" /> : null}
        {!isLoading && !isPlayLogsError && playLogs.length === 0 ? <StatusCard text="まだ実戦ログがありません。追加ボタンから最初の実戦を記録できます。" /> : null}

        <div className="space-y-3">
          {playLogs.map((log) => {
            const profit = calculateProfit(log.investment, log.payout);
            const rotationMemoExcerpt = formatRotationMemoExcerpt(log.rotationMemos);

            return (
              <article key={log.id} className="rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-pwt-primary">
                      {machineNameById.get(log.machineId) ?? '未登録機種'}
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-pwt-muted">
                      {log.date} / {log.hallName}
                    </p>
                    <p className="mt-1 text-xs font-bold text-pwt-muted">
                      投資 {formatCurrency(log.investment)} / 回収 {formatCurrency(log.payout)}
                    </p>
                    {rotationMemoExcerpt ? (
                      <p className="mt-2 break-words text-xs font-bold leading-5 text-pwt-primary">
                        回転メモ {rotationMemoExcerpt}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className={profit >= 0 ? 'text-base font-extrabold text-pwt-primary' : 'text-base font-extrabold text-red-700'}>
                      {formatCurrency(profit)}
                    </p>
                    <Button asChild variant="ghost" size="sm">
                      <NavLink to={`/logs/${log.id}/edit`}>
                        <Pencil aria-hidden="true" />
                        編集
                      </NavLink>
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function AnalyticsPage() {
  const { data: playLogs = [], isError: isPlayLogsError } = usePlayLogs();
  const { data: machines = [], isError: isMachinesError } = useMachines();
  const machineNameById = useMemo(() => new Map(machines.map((machine) => [machine.id, machine.name])), [machines]);
  const summary = useMemo(() => summarizePlayLogs(playLogs), [playLogs]);
  const monthlyBuckets = useMemo(() => groupLogsByMonth(playLogs), [playLogs]);
  const hallBuckets = useMemo(() => groupLogsByHall(playLogs), [playLogs]);
  const machineBuckets = useMemo(() => groupLogsByMachine(playLogs, machineNameById), [playLogs, machineNameById]);
  const bestHalls = useMemo(() => getProfitRanking(hallBuckets, 'best', 3), [hallBuckets]);
  const worstHalls = useMemo(() => getProfitRanking(hallBuckets, 'worst', 3), [hallBuckets]);
  const bestMachines = useMemo(() => getProfitRanking(machineBuckets, 'best', 3), [machineBuckets]);
  const worstMachines = useMemo(() => getProfitRanking(machineBuckets, 'worst', 3), [machineBuckets]);
  const recoveryRate = summary.totalInvestment > 0 ? summary.totalPayout / summary.totalInvestment : 0;

  return (
    <main aria-labelledby="analytics-title" className="space-y-4">
      <section className="rounded-[8px] bg-pwt-surface p-5 shadow-pwt-card">
        <p className="text-sm font-bold text-pwt-muted">Analytics</p>
        <h2 id="analytics-title" className="mt-2 text-3xl font-extrabold tracking-normal text-pwt-primary">
          分析
        </h2>
        <p className="mt-3 text-base leading-7 text-pwt-muted">
          保存済みログから月別推移、ホール別、機種別の傾向を確認できます。
        </p>
      </section>

      {isPlayLogsError || isMachinesError ? <StatusCard tone="danger" text="分析データの読み込みに失敗しました。" /> : null}
      {!isPlayLogsError && playLogs.length === 0 ? <StatusCard text="分析できるログがまだありません。ログを追加すると月別推移とランキングが表示されます。" /> : null}

      <section className="grid grid-cols-2 gap-3" aria-label="KPI">
        <MetricCard label="総収支" value={formatCurrency(summary.totalProfit)} />
        <MetricCard label="勝率" value={`${Math.round(summary.winRate * 100)}%`} />
        <MetricCard label="回収率" value={`${Math.round(recoveryRate * 100)}%`} />
        <MetricCard label="平均収支" value={formatCurrency(summary.averageProfit)} />
      </section>

      <section className="rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card" aria-labelledby="monthly-chart-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-pwt-muted">Monthly</p>
            <h3 id="monthly-chart-title" className="mt-1 text-lg font-extrabold tracking-normal text-pwt-text">
              月別推移
            </h3>
          </div>
          <span className="rounded-[8px] bg-pwt-surface-muted px-3 py-2 text-xs font-bold text-pwt-muted">
            {monthlyBuckets.length}ヶ月
          </span>
        </div>
        <Suspense fallback={<StatusCard text="グラフを読み込み中です。" />}>
          <MonthlyProfitChart buckets={monthlyBuckets} />
        </Suspense>
      </section>

      <section className="space-y-3" aria-labelledby="ranking-title">
        <h3 id="ranking-title" className="text-lg font-extrabold tracking-normal text-pwt-text">
          ランキング
        </h3>
        <RankingGroup title="ホール別" bestItems={bestHalls} worstItems={worstHalls} emptyText="ホール別ランキングはまだありません。" />
        <RankingGroup title="機種別" bestItems={bestMachines} worstItems={worstMachines} emptyText="機種別ランキングはまだありません。" />
      </section>
    </main>
  );
}

function MachinesPage() {
  const { data: machines = [], isError, isLoading } = useMachines();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>();
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredMachines = useMemo(() => {
    if (normalizedQuery === '') {
      return machines;
    }

    return machines.filter((machine) =>
      [machine.name, machine.maker, machine.category].some((value) => value.toLowerCase().includes(normalizedQuery)),
    );
  }, [machines, normalizedQuery]);
  const selectedMachine = useMemo(
    () => machines.find((machine) => machine.id === selectedMachineId),
    [machines, selectedMachineId],
  );

  return (
    <main aria-labelledby="machines-title" className="space-y-4">
      <section className="rounded-[8px] bg-pwt-surface p-5 shadow-pwt-card">
        <p className="text-sm font-bold text-pwt-muted">Machines</p>
        <h2 id="machines-title" className="mt-2 text-3xl font-extrabold tracking-normal text-pwt-primary">
          機種
        </h2>
        <p className="mt-3 text-base leading-7 text-pwt-muted">登録済み機種を確認し、ログ入力で使う機種を探せます。</p>
      </section>

      <MachinePreview machine={selectedMachine} />

      <section className="rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card" aria-labelledby="machine-search-title">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-pwt-muted">Search</p>
            <h3 id="machine-search-title" className="mt-1 text-lg font-extrabold tracking-normal text-pwt-text">
              機種検索
            </h3>
          </div>
          <span className="rounded-[8px] bg-pwt-surface-muted px-3 py-2 text-xs font-bold text-pwt-muted">
            {filteredMachines.length}件
          </span>
        </div>
        <div className="mt-3 space-y-2">
          <label htmlFor="machine-search" className="flex items-center gap-1.5 text-sm font-bold text-pwt-muted">
            <Search aria-hidden="true" className="size-4" />
            機種名・メーカー・カテゴリ
          </label>
          <Input
            id="machine-search"
            type="search"
            placeholder="海物語 / SANYO / pachinko"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </section>

      {isError ? <StatusCard tone="danger" text="機種の読み込みに失敗しました。" /> : null}
      {isLoading ? <StatusCard text="機種を読み込み中です。" /> : null}
      {!isLoading && !isError && machines.length === 0 ? <StatusCard text="機種がまだ登録されていません。seed 同期後に一覧が表示されます。" /> : null}
      {!isLoading && !isError && machines.length > 0 && filteredMachines.length === 0 ? <StatusCard text="検索条件に一致する機種がありません。入力を消すと一覧に戻ります。" /> : null}

      <section className="space-y-3" aria-label="機種一覧">
        {filteredMachines.map((machine) => (
          <MachineListItem
            key={machine.id}
            machine={machine}
            isSelected={machine.id === selectedMachineId}
            onSelect={() => setSelectedMachineId(machine.id)}
          />
        ))}
      </section>
    </main>
  );
}

function MachinePreview({ machine }: { machine: Machine | undefined }) {
  if (!machine) {
    return (
      <section className="rounded-[8px] border border-dashed border-pwt-primary-soft bg-pwt-surface p-5" aria-label="機種詳細">
        <p className="text-sm font-bold text-pwt-muted">Preview</p>
        <h3 className="mt-2 text-xl font-extrabold tracking-normal text-pwt-text">機種を選択</h3>
        <p className="mt-2 break-words text-sm leading-6 text-pwt-muted">一覧から機種を選ぶと、メーカー、カテゴリ、メモをここで確認できます。</p>
      </section>
    );
  }

  return (
    <section className="rounded-[8px] bg-pwt-primary p-5 text-white shadow-pwt-card" aria-label="機種詳細">
      <p className="text-sm font-bold text-white/75">Selected Machine</p>
      <h3 className="mt-2 break-words text-2xl font-extrabold tracking-normal">{machine.name}</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <DetailPill label="メーカー" value={machine.maker} />
        <DetailPill label="カテゴリ" value={getMachineCategoryLabel(machine.category)} />
      </div>
      {machine.memo ? <p className="mt-4 break-words text-sm leading-6 text-white/80">{machine.memo}</p> : null}
      {machine.dmmUrl ? (
        <Button asChild variant="accent" size="sm" className="mt-4 w-full text-pwt-primary sm:w-auto">
          <a href={machine.dmmUrl} target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            DMMで詳細を見る
          </a>
        </Button>
      ) : null}
    </section>
  );
}

function MachineListItem({
  machine,
  isSelected,
  onSelect,
}: {
  machine: Machine;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        'w-full rounded-[8px] p-4 text-left shadow-pwt-card transition focus:outline-none focus:ring-4 focus:ring-pwt-primary-soft',
        isSelected ? 'bg-pwt-primary text-white' : 'bg-pwt-surface text-pwt-text hover:bg-pwt-primary-soft',
      ].join(' ')}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={isSelected ? 'truncate text-base font-extrabold text-white' : 'truncate text-base font-extrabold text-pwt-text'}>
            {machine.name}
          </p>
          <p className={isSelected ? 'mt-1 text-sm font-bold text-white/75' : 'mt-1 text-sm font-bold text-pwt-muted'}>
            {machine.maker} / {getMachineCategoryLabel(machine.category)}
          </p>
        </div>
        <span className={isSelected ? 'rounded-[8px] bg-white/15 px-3 py-1 text-xs font-bold text-white' : 'rounded-[8px] bg-pwt-surface-muted px-3 py-1 text-xs font-bold text-pwt-muted'}>
          詳細
        </span>
      </div>
      {machine.memo ? (
        <p className={isSelected ? 'mt-3 line-clamp-2 text-sm leading-6 text-white/80' : 'mt-3 line-clamp-2 text-sm leading-6 text-pwt-muted'}>
          {machine.memo}
        </p>
      ) : null}
    </button>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-white/15 px-3 py-2">
      <p className="text-xs font-bold text-white/70">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-white">{value}</p>
    </div>
  );
}

function getMachineCategoryLabel(category: Machine['category']) {
  const labels: Record<Machine['category'], string> = {
    pachinko: 'パチンコ',
    slot: 'スロット',
    other: 'その他',
  };

  return labels[category];
}

function NewLogPage() {
  const navigate = useNavigate();
  const createPlayLog = useCreatePlayLog();

  return (
    <LogFormPage
      title="ログ追加"
      description="ホール名、機種、投資、回収をすばやく残します。"
      submitLabel="保存"
      isSubmitting={createPlayLog.isPending}
      onSubmit={async (input) => {
        await createPlayLog.mutateAsync(input);
        navigate('/logs');
      }}
    />
  );
}

function EditLogPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: playLog, isLoading } = usePlayLog(id);
  const updatePlayLog = useUpdatePlayLog();
  const deletePlayLog = useDeletePlayLog();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  if (isLoading) {
    return <StatusCard text="ログを読み込み中です。" />;
  }

  if (!id || !playLog) {
    return <StatusCard text="ログが見つかりません。" />;
  }

  return (
    <>
      <LogFormPage
        title="ログ編集"
        description="入力ミスを直して保存できます。"
        initialLog={playLog}
        submitLabel="更新"
        isSubmitting={updatePlayLog.isPending}
        footer={
          <Button type="button" variant="outline" className="w-full text-red-700 hover:bg-red-50" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 aria-hidden="true" />
            削除
          </Button>
        }
        onSubmit={async (input) => {
          await updatePlayLog.mutateAsync({ id, input });
          navigate('/logs');
        }}
      />
      <Dialog open={isDeleteDialogOpen} title="ログを削除しますか" description="削除したログは元に戻せません。">
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
            キャンセル
          </Button>
          <Button
            type="button"
            className="bg-red-700 hover:bg-red-800"
            onClick={async () => {
              await deletePlayLog.mutateAsync(id);
              navigate('/logs');
            }}
          >
            <Trash2 aria-hidden="true" />
            削除
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function LogFormPage({
  title,
  description,
  initialLog,
  submitLabel,
  isSubmitting,
  footer,
  onSubmit,
}: {
  title: string;
  description: string;
  initialLog?: PlayLog;
  submitLabel: string;
  isSubmitting: boolean;
  footer?: ReactNode;
  onSubmit: (input: CreatePlayLogInput) => Promise<void>;
}) {
  const { data: machines = defaultMachineOptions } = useMachines();
  const [formState, setFormState] = useState(() => createInitialFormState(initialLog));
  const [errors, setErrors] = useState<LogFormErrors>({});
  const investment = parseCurrencyInput(formState.investment);
  const payout = parseCurrencyInput(formState.payout);
  const profit = calculateProfit(investment, payout);

  const updateField = (field: keyof Omit<LogFormState, 'rotationMemos'>, value: string) => {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const updateRotationMemo = (index: number, field: keyof RotationMemoFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      rotationMemos: current.rotationMemos.map((memo, memoIndex) => (memoIndex === index ? { ...memo, [field]: value } : memo)),
    }));
    setErrors((current) => ({
      ...current,
      [`rotationMemos.${index}.investment`]: undefined,
      [`rotationMemos.${index}.spins`]: undefined,
    }));
  };

  const addRotationMemo = () => {
    setFormState((current) => ({ ...current, rotationMemos: [...current.rotationMemos, createEmptyRotationMemo()] }));
  };

  const removeRotationMemo = (index: number) => {
    setFormState((current) => ({
      ...current,
      rotationMemos: current.rotationMemos.filter((_, memoIndex) => memoIndex !== index),
    }));
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateLogForm(formState);
    setErrors(validation.errors);

    if (!validation.input) {
      return;
    }

    await onSubmit(validation.input);
  };

  return (
    <main aria-labelledby="log-form-title" className="space-y-4 pb-3">
      <section className="rounded-[8px] bg-pwt-surface p-5 shadow-pwt-card">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-pwt-primary">
          <NavLink to="/logs" aria-label="ログ一覧へ戻る">
            <ChevronLeft aria-hidden="true" />
            戻る
          </NavLink>
        </Button>
        <p className="mt-3 text-sm font-bold text-pwt-muted">Play Log</p>
        <h2 id="log-form-title" className="mt-2 text-3xl font-extrabold tracking-normal text-pwt-primary">
          {title}
        </h2>
        <p className="mt-3 text-base leading-7 text-pwt-muted">{description}</p>
      </section>

      <form className="space-y-4 rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card" onSubmit={handleSubmit} noValidate>
        <Field label="日付" icon={CalendarDays} htmlFor="date" error={errors.date}>
          <Input
            id="date"
            name="date"
            type="date"
            className="appearance-none overflow-hidden text-left"
            value={formState.date}
            onChange={(event) => updateField('date', event.target.value)}
          />
        </Field>
        <Field label="ホール名" icon={MapPin} htmlFor="hall-name" error={errors.hallName}>
          <Input
            id="hall-name"
            name="hallName"
            placeholder="駅前ホール"
            value={formState.hallName}
            onChange={(event) => updateField('hallName', event.target.value)}
          />
        </Field>
        <Field label="機種" icon={Cpu} htmlFor="machine" error={errors.machineId}>
          <Select id="machine" name="machineId" value={formState.machineId} onChange={(event) => updateField('machineId', event.target.value)}>
            <option value="" disabled>
              機種を選択
            </option>
            {machines.map((machine) => (
              <option key={machine.id} value={machine.id}>
                {machine.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="投資" icon={CircleDollarSign} htmlFor="investment" error={errors.investment}>
            <Input
              id="investment"
              name="investment"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={formState.investment}
              onChange={(event) => updateField('investment', event.target.value)}
            />
          </Field>
          <Field label="回収" icon={CircleDollarSign} htmlFor="payout" error={errors.payout}>
            <Input
              id="payout"
              name="payout"
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="0"
              value={formState.payout}
              onChange={(event) => updateField('payout', event.target.value)}
            />
          </Field>
        </div>

        <ProfitPreview profit={profit} />

        <RotationMemoFields
          rows={formState.rotationMemos}
          errors={errors}
          onAdd={addRotationMemo}
          onRemove={removeRotationMemo}
          onChange={updateRotationMemo}
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="開始時刻" icon={CalendarDays} htmlFor="start-time">
            <Input
              id="start-time"
              name="startTime"
              type="time"
              className="appearance-none overflow-hidden text-left"
              value={formState.startTime}
              onChange={(event) => updateField('startTime', event.target.value)}
            />
          </Field>
          <Field label="終了時刻" icon={CalendarDays} htmlFor="end-time">
            <Input
              id="end-time"
              name="endTime"
              type="time"
              className="appearance-none overflow-hidden text-left"
              value={formState.endTime}
              onChange={(event) => updateField('endTime', event.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="交換率" icon={CircleDollarSign} htmlFor="exchange-rate" error={errors.exchangeRate}>
            <Input
              id="exchange-rate"
              name="exchangeRate"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="3.57"
              value={formState.exchangeRate}
              onChange={(event) => updateField('exchangeRate', event.target.value)}
            />
          </Field>
          <Field label="タグ" icon={ListChecks} htmlFor="tags">
            <Input
              id="tags"
              name="tags"
              placeholder="仕事帰り, 新台"
              value={formState.tags}
              onChange={(event) => updateField('tags', event.target.value)}
            />
          </Field>
        </div>
        <Field label="メモ" icon={ListChecks} htmlFor="memo">
          <Textarea
            id="memo"
            name="memo"
            placeholder="気づいたことをメモ"
            value={formState.memo}
            onChange={(event) => updateField('memo', event.target.value)}
          />
        </Field>
        <div className="sticky bottom-4 space-y-3 rounded-[8px] bg-pwt-surface/95 pt-1 backdrop-blur">
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            <Save aria-hidden="true" />
            {isSubmitting ? '保存中' : submitLabel}
          </Button>
          {footer}
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  icon: Icon,
  htmlFor,
  error,
  children,
}: {
  label: string;
  icon: LucideIcon;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-bold text-pwt-muted">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </label>
      {children}
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}

function ProfitPreview({ profit }: { profit: number }) {
  const tone = profit > 0 ? 'bg-pwt-primary text-white' : profit < 0 ? 'bg-red-50 text-red-700' : 'bg-pwt-surface-muted text-pwt-muted';

  return (
    <section className={`rounded-[8px] px-4 py-3 ${tone}`} aria-label="収支プレビュー">
      <p className="text-sm font-bold opacity-80">収支プレビュー</p>
      <p className="mt-1 text-2xl font-extrabold tracking-normal">{formatCurrency(profit)}</p>
    </section>
  );
}

function RotationMemoFields({
  rows,
  errors,
  onAdd,
  onRemove,
  onChange,
}: {
  rows: RotationMemoFormState[];
  errors: LogFormErrors;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof RotationMemoFormState, value: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-[8px] border border-pwt-primary-soft bg-pwt-surface-muted p-3" aria-labelledby="rotation-memos-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="rotation-memos-title" className="text-sm font-extrabold tracking-normal text-pwt-text">
            回転数メモ
          </h3>
          <p className="mt-1 text-xs font-bold leading-5 text-pwt-muted">
            投資額ごとの回転数を任意で記録できます。
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
          <Plus aria-hidden="true" />
          追加
        </Button>
      </div>

      {rows.length === 0 ? <p className="text-xs font-bold text-pwt-muted">メモ行はまだありません。</p> : null}

      <div className="space-y-3">
        {rows.map((memo, index) => {
          const investmentId = `rotation-investment-${index}`;
          const spinsId = `rotation-spins-${index}`;
          const noteId = `rotation-note-${index}`;
          const investmentError = errors[`rotationMemos.${index}.investment`];
          const spinsError = errors[`rotationMemos.${index}.spins`];

          return (
            <div key={index} className="space-y-3 rounded-[8px] bg-pwt-surface p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-extrabold text-pwt-muted">メモ {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  aria-label={`回転数メモ ${index + 1} を削除`}
                >
                  <Trash2 aria-hidden="true" />
                  削除
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="投資額" icon={CircleDollarSign} htmlFor={investmentId} error={investmentError}>
                  <Input
                    id={investmentId}
                    name={investmentId}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="10000"
                    value={memo.investment}
                    onChange={(event) => onChange(index, 'investment', event.target.value)}
                  />
                </Field>
                <Field label="回転数" icon={ListChecks} htmlFor={spinsId} error={spinsError}>
                  <Input
                    id={spinsId}
                    name={spinsId}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="162"
                    value={memo.spins}
                    onChange={(event) => onChange(index, 'spins', event.target.value)}
                  />
                </Field>
              </div>
              <Field label="メモ" icon={ListChecks} htmlFor={noteId}>
                <Input
                  id={noteId}
                  name={noteId}
                  placeholder="ペースや気づき"
                  value={memo.note}
                  onChange={(event) => onChange(index, 'note', event.target.value)}
                />
              </Field>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] bg-pwt-surface-muted px-3 py-2">
      <p className="text-xs font-bold text-pwt-muted">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-pwt-text">{value}</p>
    </div>
  );
}

function RankingGroup({
  title,
  bestItems,
  worstItems,
  emptyText,
}: {
  title: string;
  bestItems: SummaryBucket[];
  worstItems: SummaryBucket[];
  emptyText: string;
}) {
  const hasItems = bestItems.length > 0 || worstItems.length > 0;

  return (
    <section className="rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card" aria-label={title}>
      <h4 className="text-base font-extrabold tracking-normal text-pwt-text">{title}</h4>
      {hasItems ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RankingList title="上位" items={bestItems} />
          <RankingList title="下位" items={worstItems} />
        </div>
      ) : (
        <div className="mt-3">
          <StatusCard text={emptyText} />
        </div>
      )}
    </section>
  );
}

function RankingList({ title, items }: { title: string; items: SummaryBucket[] }) {
  return (
    <div className="rounded-[8px] bg-pwt-surface-muted p-3">
      <p className="text-sm font-bold text-pwt-muted">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${title}-${item.key}`} className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="break-words font-bold text-pwt-text">{index + 1}. {item.label}</p>
              <p className="text-xs font-bold text-pwt-muted">{item.playCount}戦 / 勝率 {Math.round(item.winRate * 100)}%</p>
            </div>
            <p className={item.totalProfit >= 0 ? 'shrink-0 font-extrabold text-pwt-primary' : 'shrink-0 font-extrabold text-red-700'}>
              {formatCurrency(item.totalProfit)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[8px] bg-pwt-surface p-4 shadow-pwt-card">
      <p className="text-sm font-bold text-pwt-muted">{label}</p>
      <p className="mt-2 text-xl font-extrabold tracking-normal text-pwt-text">{value}</p>
    </article>
  );
}

function StatusCard({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'danger' }) {
  const className =
    tone === 'danger'
      ? 'rounded-[8px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700'
      : 'rounded-[8px] bg-pwt-surface-muted px-4 py-3 text-sm font-bold text-pwt-muted';

  return <div className={className}>{text}</div>;
}

function createInitialFormState(log?: PlayLog): LogFormState {
  const rotationMemos = log?.rotationMemos?.map((memo) => ({
    investment: String(memo.investment),
    spins: String(memo.spins),
    note: memo.note ?? '',
  }));

  return {
    date: log?.date ?? getTodayDateValue(),
    hallName: log?.hallName ?? '',
    machineId: log?.machineId ?? '',
    investment: log ? String(log.investment) : '',
    payout: log ? String(log.payout) : '',
    startTime: log?.startTime ?? '',
    endTime: log?.endTime ?? '',
    exchangeRate: log?.exchangeRate === undefined ? '' : String(log.exchangeRate),
    tags: log?.tags?.join(', ') ?? '',
    memo: log?.memo ?? '',
    rotationMemos: rotationMemos && rotationMemos.length > 0 ? rotationMemos : [createEmptyRotationMemo()],
  };
}

function createEmptyRotationMemo(): RotationMemoFormState {
  return { investment: '', spins: '', note: '' };
}

function validateLogForm(formState: LogFormState): { errors: LogFormErrors; input?: CreatePlayLogInput } {
  const errors: LogFormErrors = {};
  const investment = parseNumberField(formState.investment);
  const payout = parseNumberField(formState.payout);
  const exchangeRate = formState.exchangeRate.trim() === '' ? undefined : parseNumberField(formState.exchangeRate);
  const rotationMemos = normalizeRotationMemos(formState.rotationMemos, errors);

  if (!formState.date) {
    errors.date = '日付を入力してください。';
  }

  if (!formState.hallName.trim()) {
    errors.hallName = 'ホール名を入力してください。';
  }

  if (!formState.machineId) {
    errors.machineId = '機種を選択してください。';
  }

  if (investment === undefined) {
    errors.investment = '0以上の数値を入力してください。';
  }

  if (payout === undefined) {
    errors.payout = '0以上の数値を入力してください。';
  }

  if (formState.exchangeRate.trim() !== '' && exchangeRate === undefined) {
    errors.exchangeRate = '0以上の数値を入力してください。';
  }

  if (Object.keys(errors).length > 0 || investment === undefined || payout === undefined) {
    return { errors };
  }

  const tags = formState.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    errors,
    input: {
      date: formState.date,
      hallName: formState.hallName.trim(),
      machineId: formState.machineId,
      investment,
      payout,
      startTime: emptyToUndefined(formState.startTime),
      endTime: emptyToUndefined(formState.endTime),
      exchangeRate,
      memo: emptyToUndefined(formState.memo.trim()),
      tags: tags.length > 0 ? tags : undefined,
      rotationMemos: rotationMemos.length > 0 ? rotationMemos : undefined,
    },
  };
}

function normalizeRotationMemos(rows: RotationMemoFormState[], errors: LogFormErrors): RotationMemo[] {
  return rows.flatMap((row, index) => {
    const hasInvestment = row.investment.trim() !== '';
    const hasSpins = row.spins.trim() !== '';
    const note = row.note.trim();

    if (!hasInvestment && !hasSpins && !note) {
      return [];
    }

    const investment = parseNumberField(row.investment);
    const spins = parseIntegerField(row.spins);

    if (investment === undefined) {
      errors[`rotationMemos.${index}.investment`] = '0以上の数値を入力してください。';
    }

    if (spins === undefined) {
      errors[`rotationMemos.${index}.spins`] = '0以上の整数を入力してください。';
    }

    if (investment === undefined || spins === undefined) {
      return [];
    }

    return [{ investment, spins, note: emptyToUndefined(note) }];
  });
}

function parseNumberField(value: string) {
  if (value.trim() === '') {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
}

function parseIntegerField(value: string) {
  const numberValue = parseNumberField(value);
  return numberValue !== undefined && Number.isInteger(numberValue) ? numberValue : undefined;
}

function parseCurrencyInput(value: string) {
  return parseNumberField(value) ?? 0;
}

function emptyToUndefined(value: string) {
  return value === '' ? undefined : value;
}

function getTodayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatRotationMemoExcerpt(rotationMemos: RotationMemo[] | undefined) {
  if (!rotationMemos || rotationMemos.length === 0) {
    return '';
  }

  const excerpt = rotationMemos
    .slice(0, 2)
    .map((memo) => `${formatCurrency(memo.investment)}=${numberFormatter.format(memo.spins)}回`)
    .join(' / ');

  return rotationMemos.length > 2 ? `${excerpt} ほか${rotationMemos.length - 2}件` : excerpt;
}

export function App() {
  return <AppShell />;
}
