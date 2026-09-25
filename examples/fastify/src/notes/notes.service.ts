import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotesStore } from './notes.store';
import {
  Author,
  Note,
  NoteDraft,
  NotePageData,
  NotesListData,
  NotesListFilter,
  NoteStatus,
} from './notes.types';

@Injectable()
export class NotesService {
  constructor(private readonly store: NotesStore) {}

  listPage(filter: NotesListFilter = {}): NotesListData {
    const query = filter.q?.trim() ?? '';
    const status = parseStatus(filter.status);
    const authors = Object.values(this.store.authors);
    const notes = this.store.notes
      .filter((note) => (status === 'all' ? true : note.status === status))
      .filter((note) => matchesQuery(note, query))
      .slice()
      .sort(compareNotes)
      .map((note) => ({
        ...note,
        author: this.requireAuthor(note.authorId),
      }));

    return {
      authors,
      notes,
      query,
      status,
      stats: {
        authors: authors.length,
        archived: this.store.notes.filter((note) => note.status === 'archived')
          .length,
        open: this.store.notes.filter((note) => note.status === 'open').length,
      },
    };
  }

  detailPage(id: string): NotePageData {
    const note = this.requireNote(id);

    return {
      author: this.requireAuthor(note.authorId),
      authors: Object.values(this.store.authors),
      note,
    };
  }

  create(draft: NoteDraft) {
    const title = requireTitle(draft.title);
    const authorId = this.requireAuthorId(draft.authorId);
    const now = new Date().toISOString();
    const note: Note = {
      id: this.store.createId(),
      title,
      body: draft.body?.trim() ?? '',
      authorId,
      status: 'open',
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };

    this.store.notes.push(note);
    return note;
  }

  update(id: string, draft: NoteDraft) {
    const note = this.requireNote(id);

    if (draft.title !== undefined) {
      note.title = requireTitle(draft.title);
    }

    if (draft.body !== undefined) {
      note.body = draft.body.trim();
    }

    if (draft.authorId !== undefined) {
      note.authorId = this.requireAuthorId(draft.authorId);
    }

    note.updatedAt = new Date().toISOString();
    return note;
  }

  setStatus(id: string, status: NoteStatus) {
    const note = this.requireNote(id);
    note.status = status;
    note.updatedAt = new Date().toISOString();
    return note;
  }

  togglePin(id: string) {
    const note = this.requireNote(id);
    note.pinned = !note.pinned;
    note.updatedAt = new Date().toISOString();
    return note;
  }

  remove(id: string) {
    const index = this.store.notes.findIndex((note) => note.id === id);

    if (index === -1) {
      throw new NotFoundException(`Note "${id}" was not found.`);
    }

    this.store.notes.splice(index, 1);
    return { ok: true, id };
  }

  private requireNote(id: string) {
    const note = this.store.notes.find((entry) => entry.id === id);

    if (!note) {
      throw new NotFoundException(`Note "${id}" was not found.`);
    }

    return note;
  }

  private requireAuthor(id: string): Author {
    const author = this.store.authors[id];

    if (!author) {
      throw new NotFoundException(`Author "${id}" was not found.`);
    }

    return author;
  }

  private requireAuthorId(id: string | undefined) {
    const authorId = id?.trim();

    if (!authorId || !this.store.authors[authorId]) {
      throw new BadRequestException('Choose a known author.');
    }

    return authorId;
  }
}

function requireTitle(value: string | undefined) {
  const title = value?.trim() ?? '';

  if (!title) {
    throw new BadRequestException('Title is required.');
  }

  return title;
}

function parseStatus(value: string | undefined): 'all' | NoteStatus {
  if (value === 'open' || value === 'archived') {
    return value;
  }

  return 'all';
}

function matchesQuery(note: Note, query: string) {
  if (!query) {
    return true;
  }

  const haystack = `${note.title} ${note.body}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function compareNotes(left: Note, right: Note) {
  if (left.pinned !== right.pinned) {
    return Number(right.pinned) - Number(left.pinned);
  }

  return right.updatedAt.localeCompare(left.updatedAt);
}
