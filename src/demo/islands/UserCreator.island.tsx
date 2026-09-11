import React, { useMemo, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../../core/client/hooks';
import { CommitRef } from '../../core/client/runtime';
import { useSession } from '../app.runtime';

type DemoUser = {
  id: number;
  name: string;
  role: string;
};

type UserCreatorProps = {
  initialUsers: DemoUser[];
  usersLoadKey: string;
  createUser: CommitRef;
};

export function UserCreator({
  initialUsers,
  usersLoadKey,
  createUser,
}: UserCreatorProps) {
  const users = useLoad<DemoUser[]>(usersLoadKey) ?? initialUsers;
  const refreshing = usePendingLoad(usersLoadKey);
  const create = useCommit<{ name: string; role: string }>(createUser);
  const [name, setName] = useState('');
  const [role, setRole] = useState('Contributor');
  const sortedUsers = useMemo(
    () => [...users].sort((left, right) => left.name.localeCompare(right.name)),
    [users],
  );
  const session = useSession();

  return (
    <section className="stack">
      <p className="muted">Shared runtime visits: {session.visits}</p>
      <form
        className="island-card form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void create.execute({ name, role }).then(() => {
            setName('');
            setRole('Contributor');
          });
        }}
      >
        <label className="field">
          <span>Name</span>
          <input
            placeholder="Ada Developer"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Role</span>
          <input
            placeholder="Contributor"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </label>
        <button disabled={create.pending} type="submit">
          {create.pending ? 'Creating...' : 'Create user'}
        </button>
      </form>

      {refreshing ? <p className="status">Refreshing users...</p> : null}

      <div className="user-list">
        {sortedUsers.map((user) => (
          <article className="user-item" key={user.id}>
            <strong>{user.name}</strong>
            <span className="muted">{user.role}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
