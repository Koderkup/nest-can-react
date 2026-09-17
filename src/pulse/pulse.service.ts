import { Injectable } from '@nestjs/common';
import { PulseStatus } from './pulse-status';

@Injectable()
export class PulseService {
  private readonly startedAt = Date.now();
  private beats = 0;

  getStatus(): PulseStatus {
    return {
      beats: this.beats,
      uptimeMs: Date.now() - this.startedAt,
    };
  }

  beat() {
    this.beats += 1;
    return this.getStatus();
  }
}
