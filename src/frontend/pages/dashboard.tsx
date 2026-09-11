import React from 'react';
import { commit, revalidate } from '../commit';
import { inject } from '../inject';
import { Island } from '../island';
import { load } from '../load';
import { loadKeys } from '../load-keys';
import { DashboardService } from '../../dashboard.service';
import { GreetingService } from '../../greeting.service';
import { UsersService } from '../../users.service';

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
    <html>
      <head>
        <title>Dashboard | Nest can React</title>
      </head>

      <body>
        <nav>
          <a href="/">Home</a> | <a href="/users">Users</a> |{' '}
          <a href="/dashboard">Dashboard</a>
        </nav>

        <main>
          <h1>Dashboard</h1>
          <p>
            This page is server-rendered, then the dashboard controls run as a
            client React island.
          </p>

          <Island
            name="DashboardControls"
            props={{
              initialSummary: summary,
              summaryLoadKey: dashboardSummaryLoad.key,
              refreshDashboard: refreshDashboardCommit.ref,
            }}
          />
        </main>
      </body>
    </html>
  );
}
