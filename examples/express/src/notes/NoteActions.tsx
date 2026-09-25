'use client';

import React from 'react';
import { useCommit } from 'nest-can-react/client';
import { NoteStatus } from './notes.types';

type NoteActionsProps = {
  id: string;
  pinned: boolean;
  status: NoteStatus;
};

export function NoteActions({ id, pinned, status }: NoteActionsProps) {
  const pin = useCommit(`/notes/${id}/pin`);
  const archive = useCommit(`/notes/${id}/archive`);
  const restore = useCommit(`/notes/${id}/restore`);
  const pending = pin.pending || archive.pending || restore.pending;

  return (
    <div className="note-actions">
      <button
        className="button button-secondary"
        disabled={pending}
        onClick={() => void pin.commit()}
        type="button"
      >
        {pinned ? 'Unpin' : 'Pin'}
      </button>
      <button
        className="button button-secondary"
        disabled={pending}
        onClick={() =>
          void (status === 'open' ? archive.commit() : restore.commit())
        }
        type="button"
      >
        {status === 'open' ? 'Archive' : 'Restore'}
      </button>
    </div>
  );
}
