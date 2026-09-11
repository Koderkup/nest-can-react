import { Injectable } from '@nestjs/common';

@Injectable()
export class GreetingService {
  private greeting = 'Hello from Nest DI';

  sayHello() {
    return this.greeting;
  }

  setGreeting(greeting: string) {
    this.greeting = greeting;
    return this.greeting;
  }
}
