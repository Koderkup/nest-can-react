import React from 'react';
import { commit, inject, Island, load, revalidate } from '../../core';
import { DemoShell } from '../components/layout';
import { loadKeys } from '../load-keys';
import { DashboardService } from '../services/dashboard.service';
import { GreetingService } from '../services/greeting.service';
import { UsersService } from '../services/users.service';

export const dashboardSummaryLoad = load(loadKeys.dashboard, async () => {
  const users = inject<UsersService>(UsersService).findAll();
  const greeting = inject<GreetingService>(GreetingService).sayHello();

  return inject<DashboardService>(DashboardService).summarize(users, greeting);
});

export const refreshDashboardCommit = commit('dashboard.refresh', async () => {
  inject<DashboardService>(DashboardService).touch();
  return revalidate(loadKeys.dashboard);
});

export default async function Dashboard() {
  const summary = await dashboardSummaryLoad();

  return (
    <DemoShell
      active="dashboard"
      description="A production-style dashboard shell rendered by Nest and React on the server, with focused client React islands for live controls."
      eyebrow="SSR dashboard with CSR controls"
      title="Dashboard"
    >
      <section className="card span-4">
        <span className="pill">Server summary</span>
        <p className="metric">{summary.users}</p>
        <p className="muted">active demo users in Nest state.</p>
      </section>

      <section className="card span-4">
        <span className="pill">Projects</span>
        <p className="metric">{summary.activeProjects}</p>
        <p className="muted">loaded through dashboard `load()`.</p>
      </section>

      <section className="card span-4">
        <span className="pill">Refreshes</span>
        <p className="metric">{summary.manualRefreshes}</p>
        <p className="muted">mutated through `commit()`.</p>
      </section>

      <section className="card span-12">
        <Island
          mode="mount"
          name="DashboardControls"
          props={{
            initialSummary: summary,
            summaryLoadKey: dashboardSummaryLoad.key,
            refreshDashboard: refreshDashboardCommit.ref,
          }}
        />
      </section>
    </DemoShell>
  );
}
