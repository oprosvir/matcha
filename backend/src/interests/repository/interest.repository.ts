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

  async updateUserInterests(userId: string, interestIds: number[]): Promise<void> {
    try {
      // Start a transaction by using multiple queries
      // First, delete all existing user interests
      await this.db.query('DELETE FROM user_interests WHERE user_id = $1', [userId]);

      // Then, insert new interests if any provided
      if (interestIds.length > 0) {
        // Verify all interest IDs exist
        const verifyQuery = 'SELECT id FROM interests WHERE id = ANY($1::int[])';
        const verifyResult = await this.db.query<{ id: number }>(verifyQuery, [interestIds]);

        if (verifyResult.rows.length !== interestIds.length) {
          throw new CustomHttpException(
            'INVALID_INTEREST_IDS',
            'One or more interest IDs are invalid',
            'ERROR_INVALID_INTEREST_IDS',
            HttpStatus.BAD_REQUEST
          );
        }

        // Build values for batch insert
        const values = interestIds.map((_, index) =>
          `($1, $${index + 2})`
        ).join(', ');

        const insertQuery = `INSERT INTO user_interests (user_id, interest_id) VALUES ${values}`;
        await this.db.query(insertQuery, [userId, ...interestIds]);
      }
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
