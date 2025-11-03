import { IsArray, IsUUID, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { IsArrayUnique } from 'src/common/validators';

export class UpdateUserInterestsDto {
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  @IsArrayUnique()
  interestIds: string[];
}
