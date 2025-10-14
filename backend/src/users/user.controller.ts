import { BadRequestException, Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { PrivateUserResponseDto } from './dto/user-response.dto';
import { CurrentUser } from 'src/auth/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('sub') userId: string): Promise<PrivateUserResponseDto> {
    const user = await this.userService.findById(userId);
    if (!user) throw new BadRequestException('User not found'); //TODO: Implement generic http response
    return user;
  }
}
