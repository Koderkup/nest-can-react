import React from 'react';
import { Island, setLayoutMeta } from '../core';
import { PulseBeat } from './islands/PulseBeat.island';
import { PulseStatus } from './pulse-status';

export default function PulsePage({ status }: { status: PulseStatus }) {
  setLayoutMeta({
    active: 'pulse',
    description:
      'Delete src/pulse when you have a real live view.',
    eyebrow: 'Island fetch',
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
        <Island mode="mount" name={PulseBeat} props={{ status }} />
      </section>
    </>
  );
}
