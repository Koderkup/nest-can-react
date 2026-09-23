import React from 'react';
import { NestLink } from 'nest-can-react';
import { MissingPageData } from './notes.types';

export function MissingNote({ id, resource }: MissingPageData) {
  return (
    <>
      <title>{`${resource} not found`}</title>
      <div className="notes shell">
        <header className="notes-masthead">
          <p className="hero__kicker">
            <span aria-hidden="true" className="hero__kicker-mark" />
            404
          </p>
          <h1 className="heading-xl">
            {resource} “{id}” is not in memory.
          </h1>
          <p className="body-lg notes-masthead__copy">
            The in-memory list has no matching item. It may have been deleted,
            or the Nest process restarted and reset the store.
          </p>
          <NestLink className="button button-primary" to="/notes">
            Back to notes
          </NestLink>
        </header>
      </div>
    </>
  );
}
