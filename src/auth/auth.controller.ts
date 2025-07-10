// src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './jwt.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import * as multer from 'multer';

@Controller('auth') 
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company')
  @Get('company-only')
  companyRoute() {
    return { msg: 'Only companies can access this.' };
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('reset-password')
  async resetPassword(
    @Req() req: any,
    @Body('password') password: string,
    @Body('confirmationPassword') confirmationPassword: string,
  ) {
    const userId = req.user?.userId; // This is correct if JwtStrategy returns { sub: user.id }
    return this.authService.resetPassword(userId, password, confirmationPassword);
  }
  

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
  ) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password-with-token')
  async resetPasswordWithToken(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('confirmationPassword') confirmationPassword: string,
  ) {
    return this.authService.resetPasswordWithToken(token, password, confirmationPassword);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: multer.diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + '-' + file.originalname);
      },
    }),
  }))
  updateProfile(
    @Request() req,
    @UploadedFile() avatar: Express.Multer.File,
    @Body() dto: any, // ← change to `any` for now to test
  ) {
    console.log("DTO:", dto);
    console.log("File:", avatar?.filename);
    const userId = req.user?.userId;
    return this.authService.updateProfile(userId, dto, avatar?.filename);
  }
  
}
