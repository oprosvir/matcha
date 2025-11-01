import { HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { UserPreviewDto } from '../dto/user-preview.dto';
import { PrivateUserDto } from '../dto/user.dto';
import { UpdateProfileRequestDto } from '../dto/update-profile/update-profile-request.dto';
import { UpdateProfileResponseDto } from '../dto/update-profile/update-profile-response.dto';
import { CreateUserRequestDto } from '../dto/create-user/create-user-request.dto';

const USER_BASE_QUERY = `
  SELECT 
    u.id AS "id",
    u.username AS "username",
    u.email AS "email",
    u.is_email_verified AS "isEmailVerified",
    u.password_hash AS "passwordHash",
    u.first_name AS "firstName",
    u.last_name AS "lastName",
    u.gender AS "gender",
    u.sexual_orientation AS "sexualOrientation",
    u.biography AS "biography",
    u.fame_rating AS "fameRating",
    u.latitude AS "latitude",
    u.longitude AS "longitude",
    u.city_name AS "cityName",
    u.country_name AS "countryName",
    u.last_time_active AS "lastTimeActive",
    u.created_at AS "createdAt",
    u.updated_at AS "updatedAt",
    COALESCE(
      jsonb_agg(DISTINCT jsonb_build_object(
        'id', up.id,
        'url', up.url,
        'isProfilePic', up.is_profile_pic
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

  async findById(id: string): Promise<PrivateUserDto> {
    try {
      const result = await this.db.query<PrivateUserDto>(`${USER_BASE_QUERY} WHERE u.id = $1 GROUP BY u.id`, [id]);
      if (!result.rows[0]) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST);
      return result.rows[0];
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUsername(username: string): Promise<PrivateUserDto | null> {
    try {
      const result = await this.db.query<PrivateUserDto>(`${USER_BASE_QUERY} WHERE u.username = $1 GROUP BY u.id`, [username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmail(email: string): Promise<PrivateUserDto | null> {
    try {
      const result = await this.db.query<PrivateUserDto>(`${USER_BASE_QUERY} WHERE u.email = $1 GROUP BY u.id`, [email]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmailOrUsername(email: string, username: string): Promise<PrivateUserDto | null> {
    try {
      const result = await this.db.query<PrivateUserDto>(`${USER_BASE_QUERY} WHERE u.email = $1 OR u.username = $2 GROUP BY u.id`, [email, username]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async create(createUserDto: CreateUserRequestDto & { passwordHash: string }): Promise<PrivateUserDto> {
    try {
      const query = `
      INSERT INTO users(email, password_hash, first_name, last_name, username) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;

      const params = [createUserDto.email, createUserDto.passwordHash, createUserDto.firstName, createUserDto.lastName, createUserDto.username];
      const result = await this.db.query<PrivateUserDto>(query, params);

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

  async updateProfile(userId: string, updates: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
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

    values.push(userId);
    const query = `
      WITH updated_user AS (
        UPDATE users
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      )
      SELECT
        id as "id",
        username as "username",
        email as "email",
        is_email_verified AS "isEmailVerified",
        password_hash AS "passwordHash",
        first_name AS "firstName",
        last_name AS "lastName",
        gender as "gender",
        sexual_orientation AS "sexualOrientation",
        biography as "biography",
        fame_rating AS "fameRating",
        latitude as "latitude",
        longitude as "longitude",
        last_time_active AS "lastTimeActive",
        city_name AS "cityName",
        country_name AS "countryName",
        created_at AS "createdAt",
        updated_at AS "updatedAt",
        COALESCE(
          (SELECT jsonb_agg(jsonb_build_object('id', up.id, 'url', up.url, 'isProfilePic', up.is_profile_pic))
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
      const result = await this.db.query<PrivateUserDto>(query, values);
      if (!result) {
        throw new CustomHttpException(
          'USER_NOT_FOUND',
          `User with id ${userId} not found`,
          'ERROR_USER_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }
      return { user: result.rows[0] };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllPreviewByIds(ids: string[]): Promise<UserPreviewDto[]> {
    try {
      const result = await this.db.query<UserPreviewDto>(`
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

  async getPasswordHashByUsername(username: string): Promise<string | null> {
    try {
      const result = await this.db.query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE username = $1`, [username]);
      return result.rows[0]?.password_hash || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCityNameByUserId(userId: string): Promise<string> {
    try {
      const result = await this.db.query<{ city_name: string }>(`SELECT city_name FROM users WHERE id = $1`, [userId]);
      return result.rows[0]?.city_name || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCountryNameByUserId(userId: string): Promise<string> {
    try {
      const result = await this.db.query<{ country_name: string }>(`SELECT country_name FROM users WHERE id = $1`, [userId]);
      return result.rows[0]?.country_name || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}