import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { AuthRepository } from './repositories/auth.repository';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [UserModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
})
export class AuthModule { }
