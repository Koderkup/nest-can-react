import { Injectable } from '@nestjs/common';
import { DemoUser } from './users.service';
import { delay } from './delay';

@Injectable()
export class DashboardService {
  private manualRefreshes = 0;

  async touch() {
    await delay(600);
    this.manualRefreshes++;
  }

  async summarize(users: DemoUser[], greeting: string) {
    await delay(900);
    return {
      greeting,
      users: users.length,
      activeProjects: 3,
      manualRefreshes: this.manualRefreshes,
      generatedAt: new Date().toISOString(),
    };
  }
}
