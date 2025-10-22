import { Injectable, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { CustomHttpException } from '../../common/exceptions/custom-http.exception';

enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

enum SexualOrientation {
  STRAIGHT = 'straight',
  GAY = 'gay',
  BISEXUAL = 'bisexual',
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
}

@Injectable()
export class UsersRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.db.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.db.query<User>(query, [username]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.db.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1 OR username = $2';
    const result = await this.db.query<User>(query, [email, username]);
    return result.rows[0] || null;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, password, firstName, lastName, username } = createUserDto;

    const query = `
      INSERT INTO users(email, password_hash, first_name, last_name, username) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`;

    const params = [email, password, firstName, lastName, username];
    const result = await this.db.query<User>(query, params);

    return result.rows[0];
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
    await this.db.query(query, [passwordHash, userId]);
  }

  async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
    const query = 'UPDATE users SET is_email_verified = $1 WHERE id = $2';
    await this.db.query(query, [isEmailVerified, userId]);
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

    if (updates.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(updates.firstName);
    }
    if (updates.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(updates.lastName);
    }
    if (updates.gender !== undefined) {
      fields.push(`gender = $${paramIndex++}`);
      values.push(updates.gender);
    }
    if (updates.sexualOrientation !== undefined) {
      fields.push(`sexual_orientation = $${paramIndex++}`);
      values.push(updates.sexualOrientation);
    }
    if (updates.biography !== undefined) {
      fields.push(`biography = $${paramIndex++}`);
      values.push(updates.biography);
    }

    if (fields.length === 0) {
      // No updates provided, return current user
      const user = await this.findById(userId);
      if (!user) {
        throw new CustomHttpException(
          'USER_NOT_FOUND',
          `User with id ${userId} not found`,
          'ERROR_USER_NOT_FOUND',
          HttpStatus.NOT_FOUND
        );
      }
      return user;
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.db.query<User>(query, values);
    return result.rows[0];
  }
}