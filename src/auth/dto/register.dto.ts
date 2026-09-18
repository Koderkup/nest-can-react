import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
export enum Role {
  ADMIN = 'admin',
  CUSTOMER = 'customer'
}
export class CreateUserDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a text string' })
  name!: string;

  @IsNotEmpty({ message: 'Email is required!' })
  @IsEmail()
  email!: string;

  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'User must be an admin or customer!' })
  role?: Role
}