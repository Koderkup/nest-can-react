import React, { useEffect, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../../core/client/hooks';
import { CommitRef } from '../../core/client/runtime';
import { useSession } from '../context/session';

type DashboardSummary = {
  greeting: string;
  users: number;
  activeProjects: number;
  manualRefreshes: number;
  generatedAt: string;
};

type DashboardControlsProps = {
  initialSummary: DashboardSummary;
  summaryLoadKey: string;
  refreshDashboard: CommitRef;
};

export function DashboardControls({
  initialSummary,
  summaryLoadKey,
  refreshDashboard,
}: DashboardControlsProps) {
  const summary = useLoad<DashboardSummary>(summaryLoadKey) ?? initialSummary;
  const refreshing = usePendingLoad(summaryLoadKey);
  const refresh = useCommit<Record<string, never>>(refreshDashboard);
  const [filter, setFilter] = useState('all');
  const [clientTime, setClientTime] = useState(() =>
    new Date().toLocaleTimeString(),
  );
  const session = useSession();

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClientTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="stack">
      <p className="muted">Shared runtime visits: {session.visits}</p>
      <label className="field">
        <span>Client-only filter</span>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All</option>
          <option value="team">Team</option>
          <option value="projects">Projects</option>
        </select>
      </label>

      <div className="metric-grid">
        <article className="metric-card">
          <strong>Greeting</strong>
          <span className="muted">{summary.greeting}</span>
        </article>
        <article className="metric-card">
          <strong>Users</strong>
          <span className="muted">{summary.users}</span>
        </article>
        <article className="metric-card">
          <strong>Active projects</strong>
          <span className="muted">{summary.activeProjects}</span>
        </article>
        <article className="metric-card">
          <strong>Manual refreshes</strong>
          <span className="muted">{summary.manualRefreshes}</span>
        </article>
        <article className="metric-card">
          <strong>Server generated</strong>
          <span className="muted">
            {new Date(summary.generatedAt).toLocaleTimeString()}
          </span>
        </article>
        <article className="metric-card">
          <strong>Client clock</strong>
          <span className="muted">{clientTime}</span>
        </article>
        <article className="metric-card">
          <strong>Selected filter</strong>
          <span className="muted">{filter}</span>
        </article>
      </div>

      <button
        disabled={refresh.pending || refreshing}
        onClick={() => void refresh.execute({})}
        type="button"
      >
        {refresh.pending || refreshing ? 'Refreshing...' : 'Refresh dashboard'}
      </button>
    </section>
  );
}
