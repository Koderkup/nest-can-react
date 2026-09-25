export type NoteStatus = 'open' | 'archived';

export type Author = {
  id: string;
  name: string;
  role: string;
};

export type Note = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  status: NoteStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NoteDraft = {
  title?: string;
  body?: string;
  authorId?: string;
};

export type NotesListFilter = {
  q?: string;
  status?: string;
};

export type NoteListItem = Note & {
  author: Author;
};

export type NotesListData = {
  authors: Author[];
  notes: NoteListItem[];
  query: string;
  status: 'all' | NoteStatus;
  stats: {
    authors: number;
    archived: number;
    open: number;
  };
};

export type NotePageData = {
  author: Author;
  authors: Author[];
  note: Note;
};

export type MissingPageData = {
  id: string;
  resource: string;
};
