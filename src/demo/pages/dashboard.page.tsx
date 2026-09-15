import React, { useState } from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from '../../core';
import { DashboardControls } from '../islands/DashboardControls.island';
import { loadKeys } from '../load-keys';
import { DashboardService } from '../services/dashboard.service';
import { delay } from '../services/delay';
import { GreetingService } from '../services/greeting.service';
import { UsersService } from '../services/users.service';

type SlowInsightResource = {
  read: () => void;
};

export const dashboardSummaryLoad = load(loadKeys.dashboard, async () => {
  const [users, greeting] = await Promise.all([
    inject<UsersService>(UsersService).findAll(),
    inject<GreetingService>(GreetingService).sayHello(),
  ]);

  return await inject<DashboardService>(DashboardService).summarize(
    users,
    greeting,
  );
});

export const refreshDashboardCommit = commit('dashboard.refresh', async () => {
  await inject<DashboardService>(DashboardService).touch();
  return revalidate(loadKeys.dashboard);
});

export default async function Dashboard() {
  // const [time, setTime] = useState(new Date().toLocaleTimeString());
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setTime(new Date().toLocaleTimeString());
  //   }, 1000);
  //   return () => clearInterval(interval);
  // }, []);
  const summary = await dashboardSummaryLoad();
  const slowInsight = createSlowInsightResource();

  setLayoutMeta({
    active: 'dashboard',
    description:
      'A production-style dashboard shell rendered by Nest and React on the server, with focused client React islands for live controls.',
    eyebrow: 'SSR dashboard with CSR controls',
    title: 'Dashboard',
  });

  return (
    <>
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
          name={DashboardControls}
          props={{
            initialSummary: summary,
            summaryLoadKey: dashboardSummaryLoad.key,
            refreshDashboard: refreshDashboardCommit.ref,
          }}
        />
      </section>
      <section className="card span-12">
        <Island
          mode="mount"
          name={DashboardControls}
          props={{
            initialSummary: summary,
            summaryLoadKey: dashboardSummaryLoad.key,
            refreshDashboard: refreshDashboardCommit.ref,
          }}
        />
      </section>
      <React.Suspense
        fallback={
          <section className="card span-12">
            <span className="pill">Streaming fallback</span>
            <h2>Loading slow server insight...</h2>
            <p className="muted">
              This block is intentionally delayed so the streaming route can
              send the shell first.
            </p>
          </section>
        }
      >
        <SlowServerInsight resource={slowInsight} />
      </React.Suspense>
    </>
  );
}

function createSlowInsightResource(): SlowInsightResource {
  let ready = false;
  const promise = delay(0).then(() => {
    ready = true;
  });

  return {
    read() {
      if (!ready) {
        throw promise;
      }
    },
  };
}

function SlowServerInsight({ resource }: { resource: SlowInsightResource }) {
  resource.read();

  return (
    <section className="card span-12">
      <span className="pill">Slow server component</span>
      <h2>Streamed after an intentional 2.5s delay</h2>
      <p className="muted">
        This proves Nest still owns the request while React can progressively
        reveal slow server-rendered UI.
      </p>
    </section>
  );
}
