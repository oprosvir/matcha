import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { InterestService } from './interest.service';
import { FindAllResponseDto } from './dto/find-all/find-all-response.dto';

@Controller('interests')
export class InterestController {
  constructor(private readonly interestService: InterestService) { }

  @UseGuards(AuthGuard)
  @Get('all')
  async findAll(): Promise<{ success: boolean, data: FindAllResponseDto, messageKey: string }> {
    const response: FindAllResponseDto = await this.interestService.findAll();
    return { success: true, data: response, messageKey: 'SUCCESS_GET_ALL_INTERESTS' };
  }
}
