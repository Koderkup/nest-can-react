import React from 'react';
import { Island, setLayoutMeta } from '../core';
import { NoteEditor } from './islands/NoteEditor.island';

export default function NotePage({ text }: { text: string }) {
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
        <Island mode="hydrate" name={NoteEditor} props={{ text }} />
      </section>
    </>
  );
}
