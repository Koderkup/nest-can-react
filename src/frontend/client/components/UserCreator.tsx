import React, { useMemo, useState } from 'react';
import { useCommit, useLoad, usePendingLoad } from '../hooks';
import { CommitRef } from '../runtime';

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

  return (
    <section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void create.execute({ name, role }).then(() => {
            setName('');
            setRole('Contributor');
          });
        }}
      >
        <input
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          placeholder="Role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        />
        <button disabled={create.pending} type="submit">
          {create.pending ? 'Creating...' : 'Create user'}
        </button>
      </form>

      {refreshing ? <small>Refreshing users...</small> : null}

      <ul>
        {sortedUsers.map((user) => (
          <li key={user.id}>
            {user.name} - {user.role}
          </li>
        ))}
      </ul>
    </section>
  );
}
