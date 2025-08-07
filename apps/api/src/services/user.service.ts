import { FastifyInstance } from "fastify";

import type { User, CreateUserData, UpdateUserData } from "@repo/shared";

export class UserService {
  constructor(private db: FastifyInstance["pg"]) {}

  async getAllUsers(): Promise<User[]> {
    const query =
      "SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC";
    const result = await this.db.query(query);
    return result.rows;
  }

  async getUserById(id: string): Promise<User | null> {
    const query =
      "SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1";
    const result = await this.db.query(query, [id]);
    return result.rows[0] || null;
  }

  async getUserByEmail(
    email: string
  ): Promise<(User & { password: string }) | null> {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await this.db.query(query, [email]);
    return result.rows[0] || null;
  }

  async createUser(userData: CreateUserData): Promise<User> {
    const query = `
      INSERT INTO users (email, password, name) 
      VALUES ($1, $2, $3) 
      RETURNING id, email, name, created_at, updated_at
    `;
    const result = await this.db.query(query, [
      userData.email,
      userData.password,
      userData.name,
    ]);
    return result.rows[0];
  }

  async updateUser(id: string, userData: UpdateUserData): Promise<User | null> {
    const fields = [];
    const values = [id];
    let paramCount = 1;

    if (userData.name !== undefined) {
      paramCount++;
      fields.push(`name = $${paramCount}`);
      values.push(userData.name);
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    const query = `
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 
      RETURNING id, email, name, created_at, updated_at
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] || null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const query = "DELETE FROM users WHERE id = $1";
    const result = await this.db.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const query = "SELECT 1 FROM users WHERE email = $1";
    const result = await this.db.query(query, [email]);
    return result.rows.length > 0;
  }

  async getUsersCount(): Promise<number> {
    const query = "SELECT COUNT(*) as count FROM users";
    const result = await this.db.query(query);
    return parseInt(result.rows[0].count);
  }

  async searchUsers(searchTerm: string, limit: number = 10): Promise<User[]> {
    const query = `
      SELECT id, email, name, created_at, updated_at 
      FROM users 
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await this.db.query(query, [`%${searchTerm}%`, limit]);
    return result.rows;
  }
}
