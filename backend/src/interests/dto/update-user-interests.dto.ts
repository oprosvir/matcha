import { IsArray, IsInt } from 'class-validator';

export class UpdateUserInterestsDto {
  @IsArray()
  @IsInt({ each: true })
  interestIds: number[];
}
