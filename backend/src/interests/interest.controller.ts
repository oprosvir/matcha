import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { InterestService } from './interest.service';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { UpdateUserInterestsDto } from './dto/update-user-interests.dto';

@Controller('interests')
export class InterestController {
  constructor(private readonly interestService: InterestService) { }

  @UseGuards(AuthGuard)
  @Get('all')
  async findAll() {
    const interests = await this.interestService.findAll();
    return { success: true, data: interests, messageKey: 'SUCCESS_GET_ALL_INTERESTS' };
  }

  @UseGuards(AuthGuard)
  @Put('me')
  async updateMyInterests(
    @CurrentUser('sub') userId: string,
    @Body() updateUserInterestsDto: UpdateUserInterestsDto
  ) {
    await this.interestService.updateUserInterests(userId, updateUserInterestsDto.interestIds);
    return { success: true, messageKey: 'SUCCESS_UPDATE_USER_INTERESTS' };
  }
}
