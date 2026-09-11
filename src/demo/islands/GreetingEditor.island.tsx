import React, { useEffect, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../../core/client/hooks';
import { CommitRef } from '../../core/client/runtime';
import { useSession } from '../app.runtime';

type GreetingEditorProps = {
  initialMessage: string;
  loadKey: string;
  updateGreeting: CommitRef;
};

export function GreetingEditor({
  initialMessage,
  loadKey,
  updateGreeting,
}: GreetingEditorProps) {
  const serverMessage = useLoad<string>(loadKey) ?? initialMessage;
  const refreshing = usePendingLoad(loadKey);
  const [message, setMessage] = useState(initialMessage);
  const saveGreeting = useCommit<{ message: string }>(updateGreeting);
  const session = useSession();

  useEffect(() => {
    setMessage(serverMessage);
  }, [serverMessage]);

  return (
    <section className="island-card">
      <span className="pill">useState + useCommit</span>
      <p className="muted">Shared runtime visits: {session.visits}</p>
      <button onClick={session.bump} type="button">
        Bump session
      </button>
      <h2>{serverMessage}</h2>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void saveGreeting.execute({ message });
        }}
      >
        <label className="field">
          <span>New greeting</span>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button disabled={saveGreeting.pending} type="submit">
          {saveGreeting.pending ? 'Saving...' : 'Commit'}
        </button>
      </form>
      {refreshing ? <p className="status">Refreshing server data...</p> : null}
      {saveGreeting.error ? (
        <p className="error">{saveGreeting.error.message}</p>
      ) : null}
    </section>
  );
}
