import { HttpStatus, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserRequestDto } from '../dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { Gender, SexualOrientation } from '../enums/user.enums';

export interface UserPhoto {
  id: string;
  url: string;
  is_main: boolean;
}

export interface UserInterest {
  id: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  is_email_verified: boolean;
  first_name: string;
  last_name: string;
  date_of_birth: Date | null;
  gender: Gender | null;
  sexual_orientation: SexualOrientation | null;
  biography: string | null;
  profile_completed: boolean;
  fame_rating: number;
  latitude: number | null;
  longitude: number | null;
  last_time_active: Date | null;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
  photos: UserPhoto[];
  interests: UserInterest[];
}

const USER_BASE_QUERY = `
  SELECT
    u.id,
    u.username,
    u.email,
    u.is_email_verified,
    u.password_hash,
    u.first_name,
    u.last_name,
    u.date_of_birth,
    u.gender,
    u.sexual_orientation,
    u.biography,
    u.profile_completed,
    u.fame_rating,
    u.latitude,
    u.longitude,
    u.last_time_active,
    u.created_at,
    u.updated_at,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', up.id,
        'url', up.url,
        'is_profile_pic', up.is_profile_pic
      )) FILTER (WHERE up.id IS NOT NULL),
      '[]'::jsonb
    ) AS photos,
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', i.id,
        'name', i.name
      )) FILTER (WHERE i.id IS NOT NULL),
      '[]'::jsonb
    ) AS interests
  FROM users u
  LEFT JOIN user_photos up ON u.id = up.user_id
  LEFT JOIN user_interests ui ON u.id = ui.user_id
  LEFT JOIN interests i ON ui.interest_id = i.id
`;

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.id = $1 GROUP BY u.id`, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.username = $1 GROUP BY u.id`, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.email = $1 GROUP BY u.id`, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.email = $1 OR u.username = $2 GROUP BY u.id`, [email, username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(createUserDto: CreateUserRequestDto): Promise<User> {
    const { email, password, firstName, lastName, username } = createUserDto;

    try {
      const query = `
      INSERT INTO users(email, password_hash, first_name, last_name, username) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;

      const params = [email, password, firstName, lastName, username];
      const result = await this.db.query<User>(query, params);

      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
      await this.db.query(query, [passwordHash, userId]);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
    try {
      const query = 'UPDATE users SET is_email_verified = $1 WHERE id = $2';
      await this.db.query(query, [isEmailVerified, userId]);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async completeProfile(
    userId: string,
    dto: {
      dateOfBirth: string;
      gender: Gender;
      sexualOrientation: SexualOrientation;
      biography: string;
    },
    client?: PoolClient,
  ): Promise<User> {
    const query = `
      WITH updated_user AS (
        UPDATE users
        SET date_of_birth = $1, 
            gender = $2,
            sexual_orientation = $3,
            biography = $4,
            profile_completed = TRUE,
            updated_at = NOW()
        WHERE id = $5
        RETURNING *
      )
      SELECT u.*,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('id', up.id, 'url', up.url, 'is_profile_pic', up.is_profile_pic))
            FROM user_photos up
            WHERE up.user_id = u.id),
          '[]'::jsonb
        ) AS photos,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name))
            FROM user_interests ui
            JOIN interests i ON ui.interest_id = i.id
            WHERE ui.user_id = u.id),
          '[]'::jsonb
        ) AS interests
      FROM updated_user u;
    `;

    const values = [
      dto.dateOfBirth, 
      dto.gender, 
      dto.sexualOrientation, 
      dto.biography, 
      userId
    ];

    try {
      const result = client 
        ? await client.query<User>(query, values)
        : await this.db.query<User>(query, values);
      if (!result?.rows?.[0]) {
        throw new CustomHttpException(
          'USER_NOT_FOUND',
          `User with id ${userId} not found`,
          'ERROR_USER_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }

      return result.rows[0];
    } catch (error) {
      // If it's already CustomHttpException, rethrow it
      if (error instanceof CustomHttpException) {
        throw error;
      }

      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(userId: string, updates: Partial<{
    firstName: string;
    lastName: string;
    gender: Gender;
    sexualOrientation: SexualOrientation;
    biography: string;
  }>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map DTO fields to database columns
    const fieldMap: Record<string, string> = {
      firstName: 'first_name',
      lastName: 'last_name',
      gender: 'gender',
      sexualOrientation: 'sexual_orientation',
      biography: 'biography',
    };

    // Build update fields dynamically
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      // No updates provided - this is a bad request
      throw new CustomHttpException(
        'NO_UPDATE_FIELDS',
        'No fields provided for update',
        'ERROR_NO_UPDATE_FIELDS',
        HttpStatus.BAD_REQUEST
      );
    }

    fields.push('updated_at = NOW()');
    values.push(userId);
    const query = `
      WITH updated_user AS (
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      )
      SELECT u.*,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('id', up.id, 'url', up.url, 'is_profile_pic', up.is_profile_pic))
            FROM user_photos up
            WHERE up.user_id = u.id),
          '[]'::jsonb
        ) AS photos,
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('id', i.id, 'name', i.name))
            FROM user_interests ui
            JOIN interests i ON ui.interest_id = i.id
            WHERE ui.user_id = u.id),
          '[]'::jsonb
        ) AS interests
      FROM updated_user u;
    `;

    try {
      const result = await this.db.query<User>(query, values);
      if (!result?.rows?.[0]) {
        throw new CustomHttpException(
          'USER_NOT_FOUND',
          `User with id ${userId} not found`,
          'ERROR_USER_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }
      return result.rows[0];
    } catch (error) {
      // If it's already CustomHttpException, rethrow it
      if (error instanceof CustomHttpException) {
        throw error;
      }

      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPasswordHashByUsername(username: string): Promise<string | null> {
    try {
      const result = await this.db.query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE username = $1`, [username]);
      return result.rows[0]?.password_hash || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllPreviewByIds(ids: string[]): Promise<any[]> {
    try {
      const result = await this.db.query<any>(`
        SELECT
          u.id,
          u.first_name,
          u.last_name,
          COALESCE(
            (SELECT url FROM user_photos WHERE user_id = u.id AND is_profile_pic = true LIMIT 1),
            (SELECT url FROM user_photos WHERE user_id = u.id LIMIT 1),
            ''
          ) as profile_picture
        FROM users u
        WHERE u.id = ANY($1::uuid[])
      `, [ids]);

      return result.rows.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        profilePicture: row.profile_picture,
      }));
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}