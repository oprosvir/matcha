import { Module } from '@nestjs/common';
import { InterestService } from './interest.service';
import { InterestController } from './interest.controller';
import { InterestRepository } from './repository/interest.repository';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [InterestController],
  providers: [InterestService, InterestRepository],
  exports: [InterestRepository],
})
export class InterestModule { }
