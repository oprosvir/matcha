import { DatabaseService } from "src/database/database.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { FindAllResponseDto } from "../dto/find-all/find-all-response.dto";

@Injectable()
export class InterestRepository {
  constructor(private readonly db: DatabaseService) { }

  async findAll(): Promise<FindAllResponseDto> {
    try {
      const result = await this.db.query(`SELECT id, name FROM interests`);
      return { interests: result.rows };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
