import React, { useEffect, useRef, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../../core/client/hooks';
import { CommitRef } from '../../core/client/runtime';

type NoteEditorProps = {
  initialText: string;
  loadKey: string;
  saveNote: CommitRef;
};

export function NoteEditor({
  initialText,
  loadKey,
  saveNote,
}: NoteEditorProps) {
  const serverText = useLoad<string>(loadKey) ?? initialText;
  const refreshing = usePendingLoad(loadKey);
  const [text, setText] = useState(initialText);
  const save = useCommit<{ text: string }>(saveNote);
  const previousServerText = useRef(serverText);

  useEffect(() => {
    if (previousServerText.current === serverText) {
      return;
    }

    previousServerText.current = serverText;
    setText(serverText);
  }, [serverText]);

  return (
    <section className="island-card">
      <span className="pill">useLoad + useCommit</span>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void save.execute({ text });
        }}
      >
        <label className="field">
          <span>Shared note</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button disabled={save.pending} type="submit">
          {save.pending ? 'Saving...' : 'Save'}
        </button>
      </form>
      {refreshing ? <p className="status">Refreshing server data...</p> : null}
      {save.error ? <p className="error">{save.error.message}</p> : null}
    </section>
  );
}
