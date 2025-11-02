import { HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/database.service";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";

export interface Like {
  from_user_id: string;
  to_user_id: string;
}

export interface LikeSent {
  to_user_id: string;
}

export interface LikeReceived {
  from_user_id: string;
}

@Injectable()
export class LikesRepository {
  constructor(private readonly db: DatabaseService) { }

  async findAllUsersWhoUserLiked(userId: string): Promise<LikeSent[]> {
    try {
      const result = await this.db.query<{ to_user_id: string }>(`SELECT to_user_id FROM likes WHERE from_user_id = $1`, [userId]);
      return result.rows;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllUsersWhoLikedUserId(userId: string): Promise<LikeReceived[]> {
    try {
      const result = await this.db.query<{ from_user_id: string }>(`SELECT from_user_id FROM likes WHERE to_user_id = $1`, [userId]);
      return result.rows;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(fromUserId: string, toUserId: string): Promise<Like | null> {
    try {
      const result = await this.db.query<Like>(`INSERT INTO likes (from_user_id, to_user_id) VALUES ($1, $2) ON CONFLICT (from_user_id, to_user_id) DO NOTHING RETURNING *`, [fromUserId, toUserId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByFromUserIdAndToUserId(fromUserId: string, toUserId: string): Promise<Like | null> {
    try {
      const result = await this.db.query<{ from_user_id: string, to_user_id: string }>(`SELECT * FROM likes WHERE from_user_id = $1 AND to_user_id = $2`, [fromUserId, toUserId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async unLikeUser(fromUserId: string, toUserId: string): Promise<void> {
    try {
      await this.db.query(`DELETE FROM likes WHERE from_user_id = $1 AND to_user_id = $2`, [fromUserId, toUserId]);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}