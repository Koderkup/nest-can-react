import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly users = [
    {
      id: 1,
      name: 'Atif',
    },
    {
      id: 2,
      name: 'Ali',
    },
  ];
  getUsers() {
    return this.users;
  }
}
