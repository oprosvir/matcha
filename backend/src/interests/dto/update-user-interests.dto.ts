import { IsArray, IsInt, ArrayMaxSize } from 'class-validator';
import { IsArrayUnique } from 'src/common/validators/is-array-unique.validator';

export class UpdateUserInterestsDto {
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 interests allowed' })
  @IsInt({ each: true })
  @IsArrayUnique({ message: 'Interest IDs must be unique' })
  interestIds: number[];
}
