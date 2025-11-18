import { IsEnum } from 'class-validator';
import { ReportReason } from 'src/common/enums/report-reason.enum';

export class ReportUserRequestDto {
  @IsEnum(ReportReason)
  reason: ReportReason;
}
