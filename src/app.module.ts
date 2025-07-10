import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { AuthModule } from './auth/auth.module';
import { ShiftModule } from './shift/shift.module';
import { EmailModule } from './email/email.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, ShiftModule, EmailModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // where files will be saved
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${file.originalname}`;
          cb(null, uniqueName);
        },
      }),
    }),],
  controllers: [AppController],
  providers: [
    {
      provide: 'PRISMA',
      useValue: new PrismaClient(),
    },
    AppService,
  ],
  exports: ['PRISMA']
})
export class AppModule {}
