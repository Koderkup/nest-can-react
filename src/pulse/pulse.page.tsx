import React from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from '../core';
import { PulseBeat } from './islands/PulseBeat.island';
import { loadKeys } from './load-keys';
import { PulseStatus } from './pulse-status';
import { PulseService } from './pulse.service';

type SlowPulseResource = {
  read: () => PulseStatus;
};

export const pulseLoad = load(loadKeys.status, () => {
  return inject<PulseService>(PulseService).getStatus();
});

export const beatPulseCommit = commit('pulse.beat', async () => {
  inject<PulseService>(PulseService).beat();
  return revalidate(loadKeys.status);
});

export default async function PulsePage() {
  const status = await pulseLoad();
  const slowPulse = createSlowPulseResource();

  setLayoutMeta({
    active: 'pulse',
    description:
      'Streaming shell first, then a delayed server block. Delete src/pulse when you have a real live view.',
    eyebrow: 'Stream',
    title: 'Pulse',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Server pulse</span>
        <p className="metric">{status.beats}</p>
        <p className="muted">beats recorded in PulseService.</p>
      </section>

      <section className="card span-7">
        <Island
          mode="mount"
          name={PulseBeat}
          props={{
            initialStatus: status,
            loadKey: pulseLoad.key,
            beatPulse: beatPulseCommit.ref,
          }}
        />
      </section>

      <React.Suspense
        fallback={
          <section className="card span-12">
            <span className="pill">Streaming fallback</span>
            <h2>Waiting on a slow server read...</h2>
            <p className="muted">
              The rest of the page can flush before this block finishes.
            </p>
          </section>
        }
      >
        <SlowPulseInsight resource={slowPulse} />
      </React.Suspense>
    </>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSlowPulseResource(): SlowPulseResource {
  let status: PulseStatus | undefined;
  const promise = delay(400).then(() => {
    status = inject<PulseService>(PulseService).getStatus();
  });

  return {
    read() {
      if (!status) {
        throw promise;
      }

      return status;
    },
  };
}

function SlowPulseInsight({ resource }: { resource: SlowPulseResource }) {
  const status = resource.read();
  const seconds = Math.max(1, Math.round(status.uptimeMs / 1000));

  return (
    <section className="card span-12">
      <span className="pill">Slow server component</span>
      <h2>Process up ~{seconds}s</h2>
      <p className="muted">
        Streamed after a short delay so you can see Nest hold the request while
        React flushes HTML in pieces.
      </p>
    </section>
  );
}
