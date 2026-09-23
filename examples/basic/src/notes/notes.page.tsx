'use server-entry';

import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';
import React from 'react';
import { inject, NestLink } from 'nest-can-react';
import { NoteActions } from './NoteActions';
import { NoteComposer } from './NoteComposer';
import { formatWhen, statusHref } from './notes-view';
import { NotesService } from './notes.service';
import { NotesListData } from './notes.types';

export default function NotesPage() {
  const notes = inject(NotesService);
  const request = inject<Request>(REQUEST);
  const data = notes.listPage({
    q: queryValue(request.query.q),
    status: queryValue(request.query.status),
  });

  return (
    <>
      <title>Notes | Nest Can React</title>
      <div className="notes shell">
        <header className="notes-masthead">
          <p className="hero__kicker">
            <span aria-hidden="true" className="hero__kicker-mark" />
            In-memory store
          </p>
          <h1 className="heading-xl">Notes</h1>
          <p className="body-lg notes-masthead__copy">
            Authors live in an object. Notes live in an array. This page calls
            inject(NotesService) on the same Nest container that handled the
            request.
          </p>
          <dl className="notes-stats">
            <div>
              <dt className="technical">Open</dt>
              <dd>{data.stats.open}</dd>
            </div>
            <div>
              <dt className="technical">Archived</dt>
              <dd>{data.stats.archived}</dd>
            </div>
            <div>
              <dt className="technical">Authors</dt>
              <dd>{data.stats.authors}</dd>
            </div>
          </dl>
        </header>

        <div className="notes-layout">
          <NoteComposer authors={data.authors} />

          <section className="notes-feed">
            <div className="notes-toolbar">
              <nav aria-label="Filter notes" className="notes-filters">
                <FilterLink current={data.status} query={data.query} value="all">
                  All
                </FilterLink>
                <FilterLink
                  current={data.status}
                  query={data.query}
                  value="open"
                >
                  Open
                </FilterLink>
                <FilterLink
                  current={data.status}
                  query={data.query}
                  value="archived"
                >
                  Archived
                </FilterLink>
              </nav>
              <form action="/notes" className="notes-search" method="get">
                {data.status === 'all' ? null : (
                  <input name="status" type="hidden" value={data.status} />
                )}
                <label className="note-field">
                  <span className="visually-hidden">Search notes</span>
                  <input
                    defaultValue={data.query}
                    name="q"
                    placeholder="Search title or body"
                    type="search"
                  />
                </label>
              </form>
            </div>

            {data.notes.length === 0 ? (
              <p className="notes-empty">No notes match this filter.</p>
            ) : (
              <ul className="notes-list">
                {data.notes.map((note) => (
                  <li className="note-card" key={note.id}>
                    <div className="note-card__body">
                      <p className="note-card__meta technical">
                        {note.pinned ? 'Pinned · ' : ''}
                        {note.status} · {note.author.name}
                      </p>
                      <NestLink className="note-card__title" to={`/notes/${note.id}`}>
                        {note.title}
                      </NestLink>
                      {note.body ? (
                        <p className="note-card__excerpt">{note.body}</p>
                      ) : null}
                      <p className="note-card__when">{formatWhen(note.updatedAt)}</p>
                    </div>
                    <NoteActions
                      id={note.id}
                      pinned={note.pinned}
                      status={note.status}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function queryValue(value: unknown) {
  return typeof value === 'string' ? value : undefined;
}

function FilterLink({
  children,
  current,
  query,
  value,
}: {
  children: string;
  current: NotesListData['status'];
  query: string;
  value: NotesListData['status'];
}) {
  const active = current === value;

  return (
    <NestLink
      aria-current={active ? 'page' : undefined}
      className={active ? 'notes-filter is-active' : 'notes-filter'}
      to={statusHref(value, query)}
    >
      {children}
    </NestLink>
  );
}
