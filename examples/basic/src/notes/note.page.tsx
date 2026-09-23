'use server-entry';

import { NotFoundException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import React from 'react';
import { inject, NestLink, setStatus } from 'nest-can-react';
import { MissingNote } from './MissingNote';
import { NoteEditor } from './NoteEditor';
import { formatWhen } from './notes-view';
import { NotesService } from './notes.service';
import { NotePageData } from './notes.types';

export default function NotePage() {
  const notes = inject(NotesService);
  const request = inject<Request>(REQUEST);
  const id = paramValue(request.params.id);

  try {
    return <NoteView data={notes.detailPage(id)} />;
  } catch (error) {
    if (!(error instanceof NotFoundException)) {
      throw error;
    }

    setStatus(404);
    return <MissingNote id={id} resource="Note" />;
  }
}

function NoteView({ data }: { data: NotePageData }) {
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

function paramValue(value: string | string[] | undefined) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return '';
}
