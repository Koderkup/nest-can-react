import React, { useEffect, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../hooks';
import { CommitRef } from '../runtime';

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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClientTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section>
      <label>
        Client-only filter
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="all">All</option>
          <option value="team">Team</option>
          <option value="projects">Projects</option>
        </select>
      </label>

      <div>
        <p>Greeting: {summary.greeting}</p>
        <p>Users: {summary.users}</p>
        <p>Active projects: {summary.activeProjects}</p>
        <p>Manual refreshes: {summary.manualRefreshes}</p>
        <p>
          Server generated: {new Date(summary.generatedAt).toLocaleTimeString()}
        </p>
        <p>Client clock: {clientTime}</p>
        <p>Selected filter: {filter}</p>
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
