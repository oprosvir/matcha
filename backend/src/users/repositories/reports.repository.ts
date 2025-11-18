import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { ReportReason } from "src/common/enums/report-reason.enum";

export interface Report {
  reporter_id: string;
  reported_id: string;
  reason: ReportReason;
  created_at: Date;
}

@Injectable()
export class ReportsRepository {
  constructor(private readonly db: DatabaseService) { }

  async reportUser(reporterId: string, reportedId: string, reason: ReportReason): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO reports (reporter_id, reported_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (reporter_id, reported_id)
         DO UPDATE SET reason = $3, created_at = CURRENT_TIMESTAMP`,
        [reporterId, reportedId, reason]
      );
    } catch (error) {
      console.error(error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
