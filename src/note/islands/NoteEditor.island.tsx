import React, { useState } from 'react';
import { useCommit } from '../../core/client/use-commit';

type NoteEditorProps = {
  text: string;
};

export function NoteEditor({ text: initialText }: NoteEditorProps) {
  const [text, setText] = useState(initialText);
  const { commit, pending, error } = useCommit('/note');

  return (
    <section className="island-card">
      <span className="pill">useCommit POST /note</span>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void commit({ text }).catch(() => undefined);
        }}
      >
        <label className="field">
          <span>Shared note</span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </label>
        <button disabled={pending} type="submit">
          {pending ? 'Saving...' : 'Save'}
        </button>
      </form>
      {error ? <p className="error">{error.message}</p> : null}
    </section>
  );
}
