import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../users/user.module';
import { AuthRepository } from './repositories/auth.repository';
import { DatabaseModule } from '../database/database.module';
import { WsAuthGuard } from './ws-auth.guard';

@Module({
  imports: [UserModule, DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, WsAuthGuard],
  exports: [WsAuthGuard],
})
export class AuthModule { }
