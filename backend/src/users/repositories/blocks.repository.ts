import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";

export interface Block {
  blocker_id: string;
  blocked_id: string;
}

@Injectable()
export class BlocksRepository {
  constructor(private readonly db: DatabaseService) { }

  async findAllUsersBlockedByUser(userId: string): Promise<string[]> {
    try {
      const result = await this.db.query<{ blocked_id: string }>(
        `SELECT blocked_id FROM blocks WHERE blocker_id = $1`,
        [userId]
      );
      return result.rows.map(row => row.blocked_id);
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAllUsersWhoBlockedUser(userId: string): Promise<string[]> {
    try {
      const result = await this.db.query<{ blocker_id: string }>(
        `SELECT blocker_id FROM blocks WHERE blocked_id = $1`,
        [userId]
      );
      return result.rows.map(row => row.blocker_id);
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllBlockedUserIds(userId: string): Promise<string[]> {
    try {
      // Get users I blocked and users who blocked me in a single query
      const result = await this.db.query<{ user_id: string }>(
        `SELECT blocked_id as user_id FROM blocks WHERE blocker_id = $1
         UNION
         SELECT blocker_id as user_id FROM blocks WHERE blocked_id = $1`,
        [userId]
      );
      return result.rows.map(row => row.user_id);
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
        [blockerId, blockedId]
      );
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    try {
      await this.db.query(
        `DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`,
        [blockerId, blockedId]
      );
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async isBlocked(userId1: string, userId2: string): Promise<boolean> {
    try {
      const result = await this.db.query<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)) as exists`,
        [userId1, userId2]
      );
      return result.rows[0]?.exists || false;
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async hasUserBlockedUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const result = await this.db.query<{ exists: boolean }>(
        `SELECT EXISTS(SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2) as exists`,
        [blockerId, blockedId]
      );
      return result.rows[0]?.exists || false;
    } catch (error) {
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

