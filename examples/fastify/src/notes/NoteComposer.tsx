'use client';

import React, { FormEvent, useState } from 'react';
import { navigateTo, useCommit } from 'nest-can-react/client';
import { Author, Note } from './notes.types';

type NoteComposerProps = {
  authors: Author[];
};

export function NoteComposer({ authors }: NoteComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorId, setAuthorId] = useState(authors[0]?.id ?? '');
  const { commit, pending, error } = useCommit<Note>('/notes', {
    revalidate: false,
  });
  

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = await commit({ title, body, authorId });

    if (note?.id) {
      navigateTo(`/notes/${note.id}`);
    }
  }

  return (
    <form className="note-panel note-form" onSubmit={onSubmit}>
      <p className="technical note-panel__label">New note</p>
      <label className="note-field">
        <span className="label">Title</span>
        <input
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What should Nest remember?"
          required
          value={title}
        />
      </label>
      <label className="note-field">
        <span className="label">Body</span>
        <textarea
          onChange={(event) => setBody(event.target.value)}
          placeholder="Keep business logic in the service. This island only posts JSON."
          rows={4}
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
              {author.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className="note-form__error">{error.message}</p> : null}
      <button className="button button-primary" disabled={pending} type="submit">
        {pending ? 'Saving…' : 'Create note'}
      </button>
    </form>
  );
}
