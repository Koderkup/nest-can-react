'use server-entry';

import React from 'react';
import { NestLink } from 'nest-can-react';
import { NoteEditor } from './NoteEditor';
import { formatWhen } from './notes-view';
import { NotePageData } from './notes.types';

export default function NotePage(data: NotePageData) {
  const { author, authors, note } = data;

  return (
    <>
      <title>{`${note.title} | Notes`}</title>
      <div className="notes shell">
        <p className="notes-back">
          <NestLink className="button-ghost" to="/notes">
            ← All notes
          </NestLink>
        </p>
        <header className="notes-masthead">
          <p className="hero__kicker">
            <span aria-hidden="true" className="hero__kicker-mark" />
            {note.status}
            {note.pinned ? ' · pinned' : ''}
          </p>
          <h1 className="heading-xl">{note.title}</h1>
          <p className="body notes-masthead__copy">
            {author.name} · {author.role} · updated {formatWhen(note.updatedAt)}
          </p>
        </header>
        <NoteEditor authors={authors} note={note} />
      </div>
    </>
  );
}
