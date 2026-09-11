import { Injectable } from '@nestjs/common';
import { delay } from './delay';

@Injectable()
export class GreetingService {
  private greeting = 'Hello from Nest DI';

  async sayHello() {
    await delay(7000);
    return this.greeting;
  }

  async setGreeting(greeting: string) {
    await delay(500);
    this.greeting = greeting;
    return this.greeting;
  }
}
