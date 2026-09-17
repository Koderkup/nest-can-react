import { Injectable } from '@nestjs/common';

@Injectable()
export class WelcomeService {
  getTagline() {
    return 'now Nest can react';
  }
}
