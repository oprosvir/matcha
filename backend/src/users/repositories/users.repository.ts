import { HttpStatus, Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

enum SexualOrientation {
  STRAIGHT = 'straight',
  GAY = 'gay',
  BISEXUAL = 'bisexual',
}

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
  gender: Gender | null;
  sexual_orientation: SexualOrientation | null;
  biography: string | null;
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
    u.gender,
    u.sexual_orientation,
    u.biography,
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

  async create(createUserDto: CreateUserDto): Promise<User> {
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
}