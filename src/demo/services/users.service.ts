import { Injectable } from '@nestjs/common';
import { delay } from './delay';

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
    await delay(1200);
    return [...this.users];
  }

  async create(input: { name?: string; role?: string }) {
    await delay(800);
    const user = {
      id: this.nextId++,
      name: input.name?.trim() || 'New teammate',
      role: input.role?.trim() || 'Contributor',
    };

    this.users.push(user);
    return user;
  }
}
