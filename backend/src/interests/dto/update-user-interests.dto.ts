import { IsArray, IsInt, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { IsArrayUnique } from 'src/common/validators';

export class UpdateUserInterestsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @IsArrayUnique()
  interestIds: number[];
}
