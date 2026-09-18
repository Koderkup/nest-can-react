import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginUserDto {
    @IsNotEmpty({ message: "Email is required!" })
    @IsEmail()
    email!: string
    @IsString({ message: "Password is required!" })
    @MinLength(8, { message: 'Password must be at least 8 charcters!' })
    password!: string

}