import React, { useState } from 'react';

type NoteEditorProps = {
  text: string;
};

export function NoteEditor({ text: initialText }: NoteEditorProps) {
  const [text, setText] = useState(initialText);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  return (
    <section className="island-card">
      <span className="pill">fetch POST /note</span>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          setPending(true);
          setError(null);

          void fetch('/note', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ text }),
          })
            .then(async (response) => {
              if (!response.ok) {
                throw new Error('Save failed.');
              }

              const result = (await response.json()) as { text: string };
              setText(result.text);
            })
            .catch((cause) => {
              setError(
                cause instanceof Error ? cause : new Error('Save failed.'),
              );
            })
            .finally(() => {
              setPending(false);
            });
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
