import React from 'react';
import { commit, revalidate } from '../commit';
import { inject } from '../inject';
import { Island } from '../island';
import { load } from '../load';
import { loadKeys } from '../load-keys';
import { UsersService } from '../../users.service';

export const usersLoad = load(loadKeys.users, async () => {
  return inject<UsersService>(UsersService).findAll();
});

export const createUserCommit = commit(
  'users.create',
  async (input: { name?: string; role?: string }) => {
    inject<UsersService>(UsersService).create(input);
    return revalidate(loadKeys.users, loadKeys.dashboard);
  },
);

export default async function Users() {
  const users = await usersLoad();

  return (
    <html>
      <head>
        <title>Users | Nest can React</title>
      </head>

      <body>
        <nav>
          <a href="/">Home</a> | <a href="/users">Users</a> |{' '}
          <a href="/dashboard">Dashboard</a>
        </nav>

        <main>
          <h1>Users</h1>
          <p>Initial users are loaded during the Nest server request.</p>

          <Island
            name="UserCreator"
            props={{
              initialUsers: users,
              usersLoadKey: usersLoad.key,
              createUser: createUserCommit.ref,
            }}
          />
        </main>
      </body>
    </html>
  );
}
