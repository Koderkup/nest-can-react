import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { executeCommit } from './commit';
import { runWithFrontendContext } from './context';
import { refreshLoad } from './load';

type CommitBody = {
  id: string;
  args?: unknown[];
};

type RefreshBody = {
  keys?: string[];
};

@Controller('_nr')
export class NestReactController {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Post('commit')
  commit(@Body() body: CommitBody) {
    return runWithFrontendContext(this.moduleRef, undefined, () =>
      executeCommit(body.id, body.args ?? []),
    );
  }

  @Post('loads')
  async refreshLoads(@Body() body: RefreshBody) {
    const keys = body.keys ?? [];
    const loads = await Promise.all(
      keys.map((key) => refreshLoad(key, this.moduleRef)),
    );

    return { loads };
  }

  @Get('loads/:key')
  refreshLoad(@Param('key') key: string) {
    return refreshLoad(key, this.moduleRef);
  }
}
