import { DatabaseService } from "src/database/database.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { PoolClient } from 'pg';
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
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUserInterests(
    userId: string,
    interestIds: string[],
    client?: PoolClient,
  ): Promise<void> {
    try {
      if (client) {
        await client.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
      } else {
        await this.db.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);
      }

      if (interestIds.length === 0) return;

      const verifyQuery = 'SELECT id FROM interests WHERE id = ANY($1::uuid[])';
      const verifyResult = client
        ? await client.query<{ id: string }>(verifyQuery, [interestIds])
        : await this.db.query<{ id: string }>(verifyQuery, [interestIds]);

      if (verifyResult.rows.length !== interestIds.length) {
        throw new CustomHttpException(
          'INVALID_INTEREST_IDS',
          'One or more interest IDs are invalid',
          'ERROR_INVALID_INTEREST_IDS',
          HttpStatus.BAD_REQUEST
        );
      }

      const values = interestIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      const insertQuery = `INSERT INTO user_interests (user_id, interest_id) VALUES ${values}`;

      if (client) {
        await client.query(insertQuery, [userId, ...interestIds]);
      } else {
        await this.db.query(insertQuery, [userId, ...interestIds]);
      }
    } catch (error) {
      // If it's already CustomHttpException, rethrow it
      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
