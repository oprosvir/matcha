import { HttpStatus, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserRequestDto } from '../dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { Gender, SexualOrientation } from '../enums/user.enums';
import { Sort, SortOrder } from '../dto/get-users/request.dto';
import { calculateFameRating, FameRatingMetrics } from '../utils/fame-rating.calculator';

export interface UserPhoto {
  id: string;
  url: string;
  is_profile_pic: boolean;
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
  city_name: string | null;
  country_name: string | null;
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
    u.city_name,
    u.country_name,
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

  async getCommonInterestsCount(currentUserId: string, otherUserId: string): Promise<number> {
    try {
      const query = `
      SELECT COUNT(DISTINCT ui1.interest_id) as count
      FROM user_interests ui1
      INNER JOIN user_interests ui2 ON ui1.interest_id = ui2.interest_id
      WHERE ui1.user_id = $1 AND ui2.user_id = $2
    `;
      const result = await this.db.query<{ count: number }>(query, [currentUserId, otherUserId]);
      return result.rows[0]?.count || 0;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Builds filter conditions for user queries (age, fame, location, firstName, tags)
  private buildFilterConditions(
    filters: {
      minAge?: number;
      maxAge?: number;
      minFame?: number;
      maxFame?: number;
      cities?: string[];
      countries?: string[];
      tags?: string[];
      firstName?: string;
    },
    conditions: string[],
    params: any[],
    paramIndex: number,
  ): { conditions: string[]; params: any[]; paramIndex: number } {
    // Age range filter
    if (filters.minAge !== undefined) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(maxBirthDate.getFullYear() - filters.minAge);
      conditions.push(`u.date_of_birth <= $${paramIndex}`);
      params.push(maxBirthDate.toISOString());
      paramIndex++;
    }
    if (filters.maxAge !== undefined) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(minBirthDate.getFullYear() - filters.maxAge);
      conditions.push(`u.date_of_birth >= $${paramIndex}`);
      params.push(minBirthDate.toISOString());
      paramIndex++;
    }

    // Fame rating range filter
    if (filters.minFame !== undefined) {
      conditions.push(`u.fame_rating >= $${paramIndex}`);
      params.push(filters.minFame);
      paramIndex++;
    }
    if (filters.maxFame !== undefined) {
      conditions.push(`u.fame_rating <= $${paramIndex}`);
      params.push(filters.maxFame);
      paramIndex++;
    }

    // Location filter
    if (filters.cities && filters.countries && filters.cities.length > 0 && filters.countries.length > 0) {
      if (filters.cities.length === filters.countries.length) {
        const locationConditions: string[] = [];
        filters.cities.forEach((city, index) => {
          const country = filters.countries![index];
          if (city && country) {
            locationConditions.push(`(u.city_name = $${paramIndex} AND u.country_name = $${paramIndex + 1})`);
            params.push(city);
            params.push(country);
            paramIndex += 2;
          }
        });
        if (locationConditions.length > 0) {
          conditions.push(`(${locationConditions.join(' OR ')})`);
        }
      } else {
        if (filters.cities.length > 0) {
          conditions.push(`u.city_name = ANY($${paramIndex}::text[])`);
          params.push(filters.cities);
          paramIndex++;
        }
        if (filters.countries.length > 0) {
          conditions.push(`u.country_name = ANY($${paramIndex}::text[])`);
          params.push(filters.countries);
          paramIndex++;
        }
      }
    } else {
      if (filters.cities && filters.cities.length > 0) {
        conditions.push(`u.city_name = ANY($${paramIndex}::text[])`);
        params.push(filters.cities);
        paramIndex++;
      }
      if (filters.countries && filters.countries.length > 0) {
        conditions.push(`u.country_name = ANY($${paramIndex}::text[])`);
        params.push(filters.countries);
        paramIndex++;
      }
    }

    // First name filter
    if (filters.firstName) {
      conditions.push(`u.first_name ILIKE $${paramIndex}`);
      params.push(`%${filters.firstName}%`);
      paramIndex++;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      conditions.push(`
        (
          SELECT COUNT(DISTINCT i.name)
          FROM user_interests ui
          JOIN interests i ON ui.interest_id = i.id
          WHERE ui.user_id = u.id
          AND i.name = ANY($${paramIndex}::text[])
        ) = $${paramIndex + 1}
      `);
      params.push(filters.tags);
      params.push(filters.tags.length);
      paramIndex += 2;
    }

    return { conditions, params, paramIndex };
  }

  // Builds ORDER BY clause for user queries
  private buildOrderByClause(
    sort: Sort | undefined,
    currentUserId: string,
    params: any[],
    paramIndex: number,
    includeTiebreakers: boolean = true,
  ): { orderByClause: string; params: any[]; paramIndex: number } {
    let orderByClause = '';

    if (sort) {
      switch (sort.sortBy) {
        case 'age':
          const ageSortOrder = sort.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
          orderByClause = `ORDER BY EXTRACT(YEAR FROM AGE(u.date_of_birth)) ${ageSortOrder}`;
          break;
        case 'fameRating':
          const fameSortOrder = sort.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
          orderByClause = `ORDER BY u.fame_rating ${fameSortOrder}`;
          break;
        case 'interests':
          const interestsSortOrder = sort.sortOrder === SortOrder.DESC ? 'DESC' : 'ASC';
          orderByClause = `ORDER BY (
            SELECT COUNT(DISTINCT ui2.interest_id)
            FROM user_interests ui2
            WHERE ui2.user_id = u.id
            AND ui2.interest_id IN (
              SELECT interest_id
              FROM user_interests
              WHERE user_id = $${paramIndex}
            )
          ) ${interestsSortOrder}`;
          params.push(currentUserId);
          paramIndex++;
          break;
        case 'distance':
          const distanceSortOrder = sort.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
          // Haversine formula for distance calculation
          orderByClause = `ORDER BY (
            6371 * acos(
              cos(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) *
              cos(radians(u.latitude)) *
              cos(radians(u.longitude) - radians((SELECT longitude FROM users WHERE id = $${paramIndex}))) +
              sin(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) *
              sin(radians(u.latitude))
            )
          ) ${distanceSortOrder} NULLS LAST`;
          params.push(currentUserId);
          paramIndex++;
          break;
      }
      if (includeTiebreakers) {
        orderByClause += `, u.last_time_active DESC NULLS LAST, u.created_at DESC, u.id DESC`;
      }
    } else {
      if (includeTiebreakers) {
        orderByClause = `ORDER BY u.last_time_active DESC NULLS LAST, u.created_at DESC, u.id DESC`;
      }
    }

    return { orderByClause, params, paramIndex };
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.id = $1 GROUP BY u.id`, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.username = $1 GROUP BY u.id`, [username]);
      return result.rows[0] || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.email = $1 GROUP BY u.id`, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} WHERE u.email = $1 OR u.username = $2 GROUP BY u.id`, [email, username]);
      return result.rows[0] || null;
    } catch (error) {
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
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    try {
      const query = 'UPDATE users SET password_hash = $1 WHERE id = $2';
      await this.db.query(query, [passwordHash, userId]);
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
    try {
      const query = 'UPDATE users SET is_email_verified = $1 WHERE id = $2';
      await this.db.query(query, [isEmailVerified, userId]);
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateLocation(
    userId: string,
    location: {
      latitude: number;
      longitude: number;
      cityName: string;
      countryName: string;
    },
    client?: PoolClient,
  ): Promise<User> {
    const query = `
      WITH updated_user AS (
        UPDATE users
        SET latitude = $1,
            longitude = $2,
            city_name = $3,
            country_name = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id
      )
      ${USER_BASE_QUERY}
      WHERE u.id = (SELECT id FROM updated_user)
      GROUP BY u.id
    `;

    const values = [
      location.latitude,
      location.longitude,
      location.cityName,
      location.countryName,
      userId,
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
      if (error instanceof CustomHttpException) {
        throw error;
      }
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
  ): Promise<User> {
    try {
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
          RETURNING id
        )
        ${USER_BASE_QUERY}
        WHERE u.id = (SELECT id FROM updated_user)
        GROUP BY u.id
      `;

      const values = [
        dto.dateOfBirth,
        dto.gender,
        dto.sexualOrientation,
        dto.biography,
        userId,
      ];

      const result = await this.db.query<User>(query, values);

      if (result.rows.length === 0) {
        throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }

      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateProfile(userId: string, updates: Partial<{
    firstName: string;
    lastName: string;
    gender: Gender;
    sexualOrientation: SexualOrientation;
    biography: string;
    email: string;
    isEmailVerified: boolean;
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
      email: 'email',
      isEmailVerified: 'is_email_verified',
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
        RETURNING id
      )
      ${USER_BASE_QUERY}
      WHERE u.id = (SELECT id FROM updated_user)
      GROUP BY u.id
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

      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPasswordHashByUsername(username: string): Promise<string | null> {
    try {
      const result = await this.db.query<{ password_hash: string }>(`SELECT password_hash FROM users WHERE username = $1`, [username]);
      return result.rows[0]?.password_hash || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAllPreviewByIds(ids: string[]): Promise<any[]> {
    try {
      const result = await this.db.query<any>(`
        SELECT
          u.id,
          u.username,
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
        username: row.username,
        firstName: row.first_name,
        lastName: row.last_name,
        profilePicture: row.profile_picture,
      }));
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCityNameByUserId(userId: string): Promise<string> {
    try {
      const result = await this.db.query<{ city_name: string }>(`SELECT city_name FROM users WHERE id = $1`, [userId]);
      return result.rows[0]?.city_name || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCountryNameByUserId(userId: string): Promise<string> {
    try {
      const result = await this.db.query<{ country_name: string }>(`SELECT country_name FROM users WHERE id = $1`, [userId]);
      return result.rows[0]?.country_name || null;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.query<User>(`${USER_BASE_QUERY} GROUP BY u.id`);
      return result.rows;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUsers(
    currentUserId: string,
    filters: {
      cursor?: string;
      minAge?: number;
      maxAge?: number;
      minFame?: number;
      maxFame?: number;
      cities?: string[];
      countries?: string[];
      tags?: string[];
      firstName?: string;
    },
    limit: number,
    sort?: Sort,
  ): Promise<User[]> {
    try {
      let conditions: string[] = [];
      let params: any[] = [];
      let paramIndex = 1;

      conditions.push(`u.id != $${paramIndex}`);
      params.push(currentUserId);
      paramIndex++;

      conditions.push(`u.profile_completed = TRUE`);

      // Exclude blocked users (both ways: who I blocked and who blocked me)
      conditions.push(`u.id NOT IN (
        SELECT blocker_id FROM blocks WHERE blocked_id = $${paramIndex}
        UNION
        SELECT blocked_id FROM blocks WHERE blocker_id = $${paramIndex}
      )`);
      params.push(currentUserId);
      paramIndex++;

      // Build filter conditions using shared method
      const filterResult = this.buildFilterConditions(filters, conditions, params, paramIndex);
      conditions = filterResult.conditions;
      params = filterResult.params;
      paramIndex = filterResult.paramIndex;

      // Pagination cursor handling
      // When sorting is applied, cursor format: sortValue,last_time_active,created_at,id
      // When no sorting, cursor format: last_time_active,created_at,id
      if (filters.cursor) {
        const cursorParts = filters.cursor.split(',');
        if (sort) {
          // Custom sort: cursor contains sort value + tiebreakers
          const cursorSortValue = cursorParts[0];
          const cursorLastTimeActive = cursorParts[1] === 'null' ? null : cursorParts[1];
          const cursorCreatedAt = cursorParts[2];
          const cursorId = cursorParts[3];

          switch (sort.sortBy) {
            case 'age':
              const ageValue = parseFloat(cursorSortValue);
              const ageOperator = sort.sortOrder === SortOrder.ASC ? '>' : '<';
              conditions.push(`(EXTRACT(YEAR FROM AGE(u.date_of_birth)) ${ageOperator} $${paramIndex} OR (EXTRACT(YEAR FROM AGE(u.date_of_birth)) = $${paramIndex} AND (u.last_time_active IS NULL OR u.last_time_active < $${paramIndex + 1}::timestamp OR (u.last_time_active = $${paramIndex + 1}::timestamp AND u.created_at < $${paramIndex + 2}::timestamp) OR (u.last_time_active = $${paramIndex + 1}::timestamp AND u.created_at = $${paramIndex + 2}::timestamp AND u.id < $${paramIndex + 3}::uuid))))`);
              params.push(ageValue);
              params.push(cursorLastTimeActive || new Date().toISOString());
              params.push(cursorCreatedAt);
              params.push(cursorId);
              paramIndex += 4;
              break;
            case 'fameRating':
              const fameValue = parseFloat(cursorSortValue);
              const fameOperator = sort.sortOrder === SortOrder.ASC ? '>' : '<';
              conditions.push(`(u.fame_rating ${fameOperator} $${paramIndex} OR (u.fame_rating = $${paramIndex} AND (u.last_time_active IS NULL OR u.last_time_active < $${paramIndex + 1}::timestamp OR (u.last_time_active = $${paramIndex + 1}::timestamp AND u.created_at < $${paramIndex + 2}::timestamp) OR (u.last_time_active = $${paramIndex + 1}::timestamp AND u.created_at = $${paramIndex + 2}::timestamp AND u.id < $${paramIndex + 3}::uuid))))`);
              params.push(fameValue);
              params.push(cursorLastTimeActive || new Date().toISOString());
              params.push(cursorCreatedAt);
              params.push(cursorId);
              paramIndex += 4;
              break;
            case 'interests':
              const interestsValue = parseFloat(cursorSortValue);
              const interestsOperator = sort.sortOrder === SortOrder.DESC ? '<' : '>';
              conditions.push(`((SELECT COUNT(DISTINCT ui2.interest_id) FROM user_interests ui2 WHERE ui2.user_id = u.id AND ui2.interest_id IN (SELECT interest_id FROM user_interests WHERE user_id = $${paramIndex})) ${interestsOperator} $${paramIndex + 1} OR ((SELECT COUNT(DISTINCT ui2.interest_id) FROM user_interests ui2 WHERE ui2.user_id = u.id AND ui2.interest_id IN (SELECT interest_id FROM user_interests WHERE user_id = $${paramIndex})) = $${paramIndex + 1} AND (u.last_time_active IS NULL OR u.last_time_active < $${paramIndex + 2}::timestamp OR (u.last_time_active = $${paramIndex + 2}::timestamp AND u.created_at < $${paramIndex + 3}::timestamp) OR (u.last_time_active = $${paramIndex + 2}::timestamp AND u.created_at = $${paramIndex + 3}::timestamp AND u.id < $${paramIndex + 4}::uuid))))`);
              params.push(currentUserId);
              params.push(interestsValue);
              params.push(cursorLastTimeActive || new Date().toISOString());
              params.push(cursorCreatedAt);
              params.push(cursorId);
              paramIndex += 5;
              break;
            case 'distance':
              const distanceValue = parseFloat(cursorSortValue);
              const distanceOperator = sort.sortOrder === SortOrder.ASC ? '>' : '<';
              conditions.push(`((6371 * acos(cos(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians((SELECT longitude FROM users WHERE id = $${paramIndex}))) + sin(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) * sin(radians(u.latitude)))) ${distanceOperator} $${paramIndex + 1} OR ((6371 * acos(cos(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians((SELECT longitude FROM users WHERE id = $${paramIndex}))) + sin(radians((SELECT latitude FROM users WHERE id = $${paramIndex}))) * sin(radians(u.latitude)))) = $${paramIndex + 1} AND (u.last_time_active IS NULL OR u.last_time_active < $${paramIndex + 2}::timestamp OR (u.last_time_active = $${paramIndex + 2}::timestamp AND u.created_at < $${paramIndex + 3}::timestamp) OR (u.last_time_active = $${paramIndex + 2}::timestamp AND u.created_at = $${paramIndex + 3}::timestamp AND u.id < $${paramIndex + 4}::uuid))))`);
              params.push(currentUserId);
              params.push(distanceValue);
              params.push(cursorLastTimeActive || new Date().toISOString());
              params.push(cursorCreatedAt);
              params.push(cursorId);
              paramIndex += 5;
              break;
          }
        } else {
          // Default sort: cursor contains last_time_active,created_at,id
          const [cursorLastTimeActive, cursorCreatedAt, cursorId] = cursorParts;
          const cursorLastTimeActiveValue = cursorLastTimeActive === 'null' ? null : cursorLastTimeActive;

          if (cursorLastTimeActiveValue === null) {
            conditions.push(`u.last_time_active IS NULL AND (u.created_at < $${paramIndex}::timestamp OR (u.created_at = $${paramIndex}::timestamp AND u.id < $${paramIndex + 1}::uuid))`);
            params.push(cursorCreatedAt);
            params.push(cursorId);
            paramIndex += 2;
          } else {
            conditions.push(`(u.last_time_active IS NULL OR u.last_time_active < $${paramIndex}::timestamp OR (u.last_time_active = $${paramIndex}::timestamp AND u.created_at < $${paramIndex + 1}::timestamp) OR (u.last_time_active = $${paramIndex}::timestamp AND u.created_at = $${paramIndex + 1}::timestamp AND u.id < $${paramIndex + 2}::uuid))`);
            params.push(cursorLastTimeActiveValue);
            params.push(cursorCreatedAt);
            params.push(cursorId);
            paramIndex += 3;
          }
        }
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Build ORDER BY clause using shared method
      const orderByResult = this.buildOrderByClause(sort, currentUserId, params, paramIndex, true);
      const orderByClause = orderByResult.orderByClause;
      params = orderByResult.params;
      paramIndex = orderByResult.paramIndex;

      const query = `
        ${USER_BASE_QUERY}
        ${whereClause}
        GROUP BY u.id
        ${orderByClause}
        LIMIT $${paramIndex}
      `;
      params.push(limit);

      const result = await this.db.query<User>(query, params);
      return result.rows;
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateLastTimeActive(userId: string): Promise<void> {
    try {
      await this.db.query(
        `UPDATE users SET last_time_active = CURRENT_TIMESTAMP WHERE id = $1`,
        [userId]
      );
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async calculateFameRating(userId: string): Promise<number> {
    try {
      const query = `
        SELECT
          -- Profile completeness metrics
          CASE WHEN u.profile_completed = TRUE THEN 20 ELSE 0 END as profile_completed_points,

          -- Popularity metrics
          (SELECT COUNT(*) FROM likes WHERE to_user_id = u.id) as likes_received,
          (SELECT COUNT(*) FROM profile_views WHERE viewed_id = u.id) as views_received,
          (
            SELECT COUNT(*)
            FROM likes l1
            WHERE l1.to_user_id = u.id
            AND EXISTS (
              SELECT 1 FROM likes l2
              WHERE l2.from_user_id = l1.to_user_id
              AND l2.to_user_id = l1.from_user_id
            )
          ) as matches_count,

          -- Account age in days
          EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - u.created_at)) / 86400 as days_active
        FROM users u
        WHERE u.id = $1
      `;

      const result = await this.db.query<{
        profile_completed_points: number;
        likes_received: string;
        views_received: string;
        matches_count: string;
        days_active: string;
      }>(query, [userId]);

      if (!result.rows[0]) {
        throw new CustomHttpException(
          'USER_NOT_FOUND',
          `User with id ${userId} not found`,
          'ERROR_USER_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      const data = result.rows[0];

      // Use the fame rating calculator utility
      const metrics: FameRatingMetrics = {
        profileCompletedPoints: data.profile_completed_points,
        likesReceived: parseInt(data.likes_received),
        viewsReceived: parseInt(data.views_received),
        matchesCount: parseInt(data.matches_count),
        daysActive: parseFloat(data.days_active),
      };

      return calculateFameRating(metrics);
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update the fame rating for a user
   */
  async updateFameRating(userId: string): Promise<number> {
    try {
      const fameRating = await this.calculateFameRating(userId);

      await this.db.query(`UPDATE users SET fame_rating = $1 WHERE id = $2`, [
        fameRating,
        userId,
      ]);

      return fameRating;
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected internal server error occurred.',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
