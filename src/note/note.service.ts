import { Injectable } from '@nestjs/common';

@Injectable()
export class NoteService {
  private text = 'Write something. This note lives in Nest memory until restart.';

  getText() {
    return this.text;
  }

  save(text: string) {
    this.text = text;
    return this.text;
  }
}
