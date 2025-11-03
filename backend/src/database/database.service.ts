import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  async onModuleInit() {
    this.pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
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

  /**
   * Get a client for transaction management.
   * Must be released after use: client.release()
   * @returns A client from the pool for manual transaction handling
   */
  async getClient(): Promise<PoolClient> {
    if (!this.pool) {
      throw new Error('Database pool is not initialized.');
    }
    return this.pool.connect();
  }

  /**
   * Run multiple operations in a single SQL transaction.
   * Automatically commits or rolls back.
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
