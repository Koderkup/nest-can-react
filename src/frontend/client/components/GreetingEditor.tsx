import React, { useEffect, useState } from 'react';
import { CommitRef } from '../runtime';
import { useCommit, useLoad, usePendingLoad } from '../hooks';

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

  useEffect(() => {
    setMessage(serverMessage);
  }, [serverMessage]);

  return (
    <section>
      <p>Client island with React state</p>
      <h2>{serverMessage}</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void saveGreeting.execute({ message });
        }}
      >
        <label>
          New greeting
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </label>
        <button disabled={saveGreeting.pending} type="submit">
          {saveGreeting.pending ? 'Saving...' : 'Commit'}
        </button>
      </form>
      {refreshing ? <small>Refreshing server data...</small> : null}
      {saveGreeting.error ? <p>{saveGreeting.error.message}</p> : null}
    </section>
  );
}
