import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from './dto/login.dto';
import { CreateUserDto, Role } from './dto/register.dto';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
interface User {
    id: number
    name: string,
    email: string,
    password: string,
    role?: Role
}

@Injectable()
export class AuthService {
    constructor(private readonly jwtService: JwtService) { }
    private users: Array<User> = []
    register(createUserDto: CreateUserDto) {
        const { email, role } = createUserDto
        const existingUser = this.users.find((u) => u.email === email)
        if (existingUser) {
            throw new ConflictException("User with this email already exists!")
        }
        const newUser = { ...createUserDto, role: role || Role.CUSTOMER, id: Date.now() }
        // for now i am not going to use bycrypt and hashing.
        this.users.push(newUser)
        const { password: _, ...userWithoutPassword } = newUser
        return {
            message: 'User registered successfully!',
            user: userWithoutPassword
        }
    }
    login(loginUserDto: LoginUserDto) {
        const { email, password } = loginUserDto;
        const user = this.users.find((u) => u.email === email)
        if (!user) {
            throw new NotFoundException(`Invalid credentials`)
        }
        // in real app will dycrpt the password first
        const isCorrectPassword = user.password === password;
        if (!isCorrectPassword) {
            throw new UnauthorizedException(`Invalid credentials!`)
        }
        const { password: _, ...validUser } = user;
        const payload = { sub: user.id, email: user.email, role: user.role }
        const token = this.jwtService.sign(payload)
        return {
            message: "User found!",
            user: validUser,
            token

        }
    }
}
