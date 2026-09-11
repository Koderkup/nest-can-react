import { Injectable } from '@nestjs/common';
import { DemoUser } from './users.service';


@Injectable()
export class DashboardService {
  private manualRefreshes = 0;

  async touch() {

    this.manualRefreshes++;
  }

  async summarize(users: DemoUser[], greeting: string) {
  
    return {
      greeting,
      users: users.length,
      activeProjects: 3,
      manualRefreshes: this.manualRefreshes,
      generatedAt: new Date().toISOString(),
    };
  }
}
