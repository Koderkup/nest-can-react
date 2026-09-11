import { Injectable } from '@nestjs/common';


export type DemoUser = {
  id: number;
  name: string;
  role: string;
};

@Injectable()
export class UsersService {
  private nextId = 4;
  private readonly users: DemoUser[] = [
    { id: 1, name: 'Ada Lovelace', role: 'Architect' },
    { id: 2, name: 'Grace Hopper', role: 'Compiler Lead' },
    { id: 3, name: 'Katherine Johnson', role: 'Flight Analyst' },
  ];

  async findAll() {

    return [...this.users];
  }

  async create(input: { name?: string; role?: string }) {

    const user = {
      id: this.nextId++,
      name: input.name?.trim() || 'New teammate',
      role: input.role?.trim() || 'Contributor',
    };

    this.users.push(user);
    return user;
  }
}
