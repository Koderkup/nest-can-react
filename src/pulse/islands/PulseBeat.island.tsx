import React from 'react';
import { useCommit } from '../../core/client/use-commit';
import { useTheme } from '../../runtime/theme';
import type { PulseStatus } from '../pulse-status';

type PulseBeatProps = {
  status: PulseStatus;
};

export function PulseBeat({ status }: PulseBeatProps) {
  const { commit, pending, error } = useCommit('/pulse/beat');
  const { theme } = useTheme();

  return (
    <section className="island-card stack">
      <span className="pill">useCommit POST /pulse/beat</span>
      <p className="muted">
        Beats: {status.beats}. Theme from context: {theme}.
      </p>
      <button
        disabled={pending}
        onClick={() => {
          void commit().catch(() => undefined);
        }}
        type="button"
      >
        {pending ? 'Beating...' : 'Beat'}
      </button>
      {error ? <p className="error">{error.message}</p> : null}
    </section>
  );
}
