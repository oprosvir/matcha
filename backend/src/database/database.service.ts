import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    console.log('Database connection pool initialized.');
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database connection pool closed.');
  }

  /**
   * A generic method to execute any SQL query.
   * @param text The SQL query string (e.g., "SELECT * FROM users WHERE id = $1")
   * @param params An array of parameters to be safely inserted into the query (e.g., [userId])
   * @returns The result from the database.
   */
  query<T extends Record<string, any>>(
    text: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      throw new Error('Database pool is not initialized.');
    }
    return this.pool.query<T>(text, params);
  }
}