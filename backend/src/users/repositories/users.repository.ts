import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateUserDto } from '../dto/create-user.dto';

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
  gender: Gender;
  sexual_orientation: SexualOrientation;
  biography: string;
  fame_rating: number;
  latitude: number;
  longitude: number;
  last_time_active: Date;
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
}