import { DatabaseService } from "src/database/database.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";

export interface Interest {
  id: string;
  name: string;
}

@Injectable()
export class InterestRepository {
  constructor(private readonly db: DatabaseService) { }

  async findAll(): Promise<Interest[]> {
    try {
      const result = await this.db.query<Interest>(`SELECT * FROM interests`);
      return result.rows;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
