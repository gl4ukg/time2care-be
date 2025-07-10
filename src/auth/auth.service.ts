// src/auth/auth.service.ts
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { validatePassword } from 'src/utils/password-validator';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private emailService: EmailService,
    // inject prisma via app.module.ts
  ) {}

  private prisma = new PrismaClient();

  async register(dto: RegisterDto) {
    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        role: dto.role,
      },
    });

    return { id: user.id, email: user.email, phone: user.phone, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { userId: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { token };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, phone: true, role: true, avatar: true },
    });
  }

  async resetPassword(userId: string, password: string, confirmationPassword: string): Promise<{ message: string }> {
    if (typeof userId !== 'string') {
      throw new ConflictException('Invalid user ID format');
    }
  
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new ConflictException('User not found');
    }
  
    const { isValid, error } = validatePassword(password);
    if (!isValid) {
      throw new BadRequestException(error);
    }
  
    if (password !== confirmationPassword) {
      throw new ConflictException('Passwords do not match');
    }
  
    const hashedPassword = await bcrypt.hash(password, 10);
  
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  
    return { message: 'Password has been changed successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    })
    if (!user) {
      // Always return a generic response for security
      return { message: 'This email does not exist' };
    }
  
    const token = this.jwtService.sign({ userId: user.id }, { expiresIn: '15m' });

    // Hash the token before storing
    const hashedToken = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetPasswordToken: hashedToken }
    })
    // await this.userService.editUser(user.id, { resetPasswordToken: hashedToken });
  
    const resetLink = `time2care://reset-password?token=${token}`;

    const subject = 'Password Change';
    const text = `You have requested to change your password. Use this link to change your password: ${resetLink}`;
    const html = `
      <p>You have requested to change your password.</p>
      <p><a href="${resetLink}">Click here to change your password</a></p>
      <p>This link will expire in 15 minutes.</p>
    `;
  
    await this.emailService.sendEmail(user.email, subject, text, html);
  
    return { message: 'Password reset link has been sent to your email.' };
  }
  

  async resetPasswordWithToken(token: string, password: string, confirmationPassword: string): Promise<{ message: string }> {
    
    // Validate password strength
    const { isValid, error } = validatePassword(password);
    if (!isValid) {
      throw new BadRequestException(error);
    }

    if (password !== confirmationPassword) {
      throw new ConflictException('Passwords do not match');
    }

    let payload: { userId: string };
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new UnauthorizedException('Link has expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId }
    })
    
    if (!user || !user.resetPasswordToken) {
      throw new UnauthorizedException('Link has expired');
    }

    // Verify the token against the stored hash
    const isTokenValid = await bcrypt.compare(token, user.resetPasswordToken);
    
    if (!isTokenValid) {
      throw new UnauthorizedException('Link has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: password,
        resetPasswordToken: null,
      }
    })
    return { message: 'Password has been changed successfully' };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, avatarFileName?: string) {

    console.log("DTO received:", dto);
console.log("Avatar filename:", avatarFileName);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
  
    if (!user) throw new UnauthorizedException('User not found');
  
    const dataToUpdate: any = {
      ...(dto.email && { email: dto.email }),
      ...(dto.phone && { phone: dto.phone }),
      ...(avatarFileName && { avatar: avatarFileName }),
    };
  
    return await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });
  }
}
