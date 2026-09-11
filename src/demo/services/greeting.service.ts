import { Injectable } from '@nestjs/common';


@Injectable()
export class GreetingService {
  private greeting = 'Hello from Nest DI';

  async sayHello() {

    return this.greeting;
  }

  async setGreeting(greeting: string) {

    this.greeting = greeting;
    return this.greeting;
  }
}
