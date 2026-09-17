import React from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from '../core';
import { NoteEditor } from './islands/NoteEditor.island';
import { loadKeys } from './load-keys';
import { NoteService } from './note.service';

export const noteLoad = load(loadKeys.text, () => {
  return inject<NoteService>(NoteService).getText();
});

export const saveNoteCommit = commit(
  'note.save',
  async (input: { text?: string }) => {
    inject<NoteService>(NoteService).save(input.text ?? '');
    return revalidate(loadKeys.text);
  },
);

export default async function NotePage() {
  const text = await noteLoad();

  setLayoutMeta({
    active: 'note',
    description:
      'Hydrated island: the note HTML is on the server, then React attaches. Delete src/note when you outgrow the notepad.',
    eyebrow: 'Hydrate',
    title: 'Note',
  });

  return (
    <>
      <section className="card span-5">
        <span className="pill">Loaded on server</span>
        <p className="muted">{text}</p>
      </section>

      <section className="card span-7">
        <Island
          mode="hydrate"
          name={NoteEditor}
          props={{
            initialText: text,
            loadKey: noteLoad.key,
            saveNote: saveNoteCommit.ref,
          }}
        />
      </section>
    </>
  );
}
