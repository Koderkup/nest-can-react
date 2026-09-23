import { Injectable } from '@nestjs/common';
import { Author, Note } from './notes.types';

const seededAt = '2026-09-22T08:00:00.000Z';

@Injectable()
export class NotesStore {
  /** Lookup object — members keyed by id. */
  readonly authors: Record<string, Author> = {
    ada: {
      id: 'ada',
      name: 'Ada Okonkwo',
      role: 'Platform',
    },
    grace: {
      id: 'grace',
      name: 'Grace Sato',
      role: 'UI',
    },
    linus: {
      id: 'linus',
      name: 'Linus Park',
      role: 'API',
    },
  };

  /** List storage — notes in insertion order. */
  readonly notes: Note[] = [
    {
      id: 'note-1',
      title: 'Pages inject Nest services',
      body: 'NotesPage calls inject(NotesService). Guards stay on the controller; the page does not take view props.',
      authorId: 'ada',
      status: 'open',
      pinned: true,
      createdAt: seededAt,
      updatedAt: seededAt,
    },
    {
      id: 'note-2',
      title: 'Mutations stay on Nest',
      body: 'useCommit POSTs JSON to a Nest route. Guards, pipes, and this in-memory store still own writes.',
      authorId: 'linus',
      status: 'open',
      pinned: false,
      createdAt: seededAt,
      updatedAt: '2026-09-22T09:15:00.000Z',
    },
    {
      id: 'note-3',
      title: 'Client islands only where needed',
      body: 'The list is a Server Component. Composer, row actions, and the editor are use client islands.',
      authorId: 'grace',
      status: 'open',
      pinned: false,
      createdAt: seededAt,
      updatedAt: '2026-09-22T10:02:00.000Z',
    },
    {
      id: 'note-4',
      title: 'Old SSR experiment',
      body: 'Archived on purpose so the filter has something to show. Restart Nest to reset [] and {}.',
      authorId: 'ada',
      status: 'archived',
      pinned: false,
      createdAt: '2026-09-20T12:00:00.000Z',
      updatedAt: '2026-09-21T16:40:00.000Z',
    },
  ];

  private nextId = 5;

  createId() {
    const id = `note-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}
