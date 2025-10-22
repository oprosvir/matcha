import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { InterestService } from './interest.service';

@Controller('interests')
export class InterestController {
  constructor(private readonly interestService: InterestService) { }

  @UseGuards(AuthGuard)
  @Get('all')
  async findAll() {
    const interests = await this.interestService.findAll();
    return { success: true, data: interests, messageKey: 'SUCCESS_GET_ALL_INTERESTS' };
  }
}
