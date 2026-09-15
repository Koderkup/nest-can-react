import React from 'react';
import { commit, inject, Island, load, revalidate, setLayoutMeta } from '../../core';
import { UserCreator } from '../islands/UserCreator.island';
import { loadKeys } from '../load-keys';
import { UsersService } from '../services/users.service';

export const usersLoad = load(loadKeys.users, async () => {
  return await inject<UsersService>(UsersService).findAll();
});

export const createUserCommit = commit(
  'users.create',
  async (input: { name?: string; role?: string }) => {
    await inject<UsersService>(UsersService).create(input);
    return revalidate(loadKeys.users, loadKeys.dashboard);
  },
);

export default async function Users() {
  const users = await usersLoad();

  setLayoutMeta({
    active: 'users',
    description:
      'Initial data comes from Nest during SSR. Creating a user is a client React interaction that commits to the server and refreshes the users load.',
    eyebrow: 'Server data, client interaction',
    title: 'Users',
  });

  return (
    <>
      <section className="card span-4">
        <span className="pill">Loaded on server</span>
        <p className="metric">{users.length}</p>
        <p className="muted">
          users were fetched before HTML reached the browser.
        </p>
      </section>

      <section className="card span-8">
        <Island
          mode="hydrate"
          name={UserCreator}
          props={{
            initialUsers: users,
            usersLoadKey: usersLoad.key,
            createUser: createUserCommit.ref,
          }}
        />
      </section>
    </>
  );
}
