'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { navigateTo, useCommit } from 'nest-can-react/client';
import { Author, Note, NoteStatus } from './notes.types';

type NoteEditorProps = {
  authors: Author[];
  note: Note;
};

export function NoteEditor({ authors, note }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [authorId, setAuthorId] = useState(note.authorId);
  const save = useCommit<Note>(`/notes/${note.id}`);
  const archive = useCommit<Note>(`/notes/${note.id}/archive`);
  const restore = useCommit<Note>(`/notes/${note.id}/restore`);
  const remove = useCommit(`/notes/${note.id}/delete`, { revalidate: false });
  const pending =
    save.pending || archive.pending || restore.pending || remove.pending;
  const error = save.error ?? archive.error ?? restore.error ?? remove.error;

  useEffect(() => {
    setTitle(note.title);
    setBody(note.body);
    setAuthorId(note.authorId);
  }, [note.authorId, note.body, note.title, note.updatedAt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await save.commit({ title, body, authorId });
  }

  async function onDelete() {
    await remove.commit();
    navigateTo('/notes');
  }

  return (
    <form className="note-panel note-form" onSubmit={onSubmit}>
      <p className="technical note-panel__label">Edit</p>
      <label className="note-field">
        <span className="label">Title</span>
        <input
          onChange={(event) => setTitle(event.target.value)}
          required
          value={title}
        />
      </label>
      <label className="note-field">
        <span className="label">Body</span>
        <textarea
          onChange={(event) => setBody(event.target.value)}
          rows={8}
          value={body}
        />
      </label>
      <label className="note-field">
        <span className="label">Author</span>
        <select
          onChange={(event) => setAuthorId(event.target.value)}
          value={authorId}
        >
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.name} · {author.role}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="note-form__error">{error.message}</p> : null}
      <div className="note-form__actions">
        <button className="button button-primary" disabled={pending} type="submit">
          {save.pending ? 'Saving…' : 'Save'}
        </button>
        <StatusButton
          disabled={pending}
          onClick={() =>
            note.status === 'open' ? archive.commit() : restore.commit()
          }
          status={note.status}
        />
        <button
          className="button button-ghost"
          disabled={pending}
          onClick={() => void onDelete()}
          type="button"
        >
          Delete
        </button>
      </div>
    </form>
  );
}

function StatusButton({
  disabled,
  onClick,
  status,
}: {
  disabled: boolean;
  onClick: () => void;
  status: NoteStatus;
}) {
  return (
    <button
      className="button button-secondary"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {status === 'open' ? 'Archive' : 'Restore'}
    </button>
  );
}
