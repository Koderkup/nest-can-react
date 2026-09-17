import React from 'react';
import { useCommit, useLoad, usePendingLoad } from '../../core/client/hooks';
import { CommitRef } from '../../core/client/runtime';
import { useTheme } from '../../runtime/theme';
import type { PulseStatus } from '../pulse-status';

type PulseBeatProps = {
  initialStatus: PulseStatus;
  loadKey: string;
  beatPulse: CommitRef;
};

export function PulseBeat({
  initialStatus,
  loadKey,
  beatPulse,
}: PulseBeatProps) {
  const status = useLoad<PulseStatus>(loadKey) ?? initialStatus;
  const refreshing = usePendingLoad(loadKey);
  const beat = useCommit<Record<string, never>>(beatPulse);
  const { theme } = useTheme();
  

  return (
    <section className="island-card stack">
      <span className="pill">mount island</span>
      <p className="muted">
        Beats: {status.beats}. Theme from context: {theme}.
      </p>
      <button
        disabled={beat.pending}
        onClick={() => {
          void beat.execute({});
        }}
        type="button"
      >
        {beat.pending ? 'Beating...' : 'Beat'}
      </button>
      {refreshing ? <p className="status">Refreshing...</p> : null}
      {beat.error ? <p className="error">{beat.error.message}</p> : null}
    </section>
  );
}
