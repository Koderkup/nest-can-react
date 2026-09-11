import { Injectable } from '@nestjs/common';

@Injectable()
export class GreetingService {
  sayHello() {
    return 'Hello from Nest DI 👋';
  }
}