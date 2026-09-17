import React, { useState } from 'react';
import { useTheme } from '../../runtime/theme';
import type { PulseStatus } from '../pulse-status';

type PulseBeatProps = {
  status: PulseStatus;
};

export function PulseBeat({ status: initialStatus }: PulseBeatProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { theme } = useTheme();

  return (
    <section className="island-card stack">
      <span className="pill">fetch POST /pulse/beat</span>
      <p className="muted">
        Beats: {status.beats}. Theme from context: {theme}.
      </p>
      <button
        disabled={pending}
        onClick={() => {
          setPending(true);
          setError(null);

          void fetch('/pulse/beat', {
            method: 'POST',
            headers: { accept: 'application/json' },
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error('Beat failed.');
              }

              setStatus((await response.json()) as PulseStatus);
            })
            .catch((cause) => {
              setError(
                cause instanceof Error ? cause : new Error('Beat failed.'),
              );
            })
            .finally(() => {
              setPending(false);
            });
        }}
        type="button"
      >
        {pending ? 'Beating...' : 'Beat'}
      </button>
      {error ? <p className="error">{error.message}</p> : null}
    </section>
  );
}
