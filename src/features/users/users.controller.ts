import { Controller, Get } from '@nestjs/common';
import { UsersService } from '@/features/users/users.service';

@Controller('users')
export class usersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }
}
