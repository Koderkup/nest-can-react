import { Module } from '@nestjs/common';
import { usersController } from '@/features/users/users.controller';
import { UsersService } from '@/features/users/users.service';

@Module ({
    controllers: [usersController],
    providers: [UsersService],
})
export class UsersModule {}