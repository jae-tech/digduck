import { FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import {
  Controller,
  Get,
  Put,
  Delete,
  Auth,
  Schema,
} from "../decorators/controller.decorator";

// appInstance import
let appInstance: FastifyInstance;

export const setUserAppInstance = (app: FastifyInstance) => {
  appInstance = app;
};

interface GetUserParams {
  id: string;
}

interface UpdateUserBody {
  name?: string;
}

@Controller("/users")
export class UserController {
  @Get("/")
  @Auth()
  @Schema({
    description: "Get all users",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
  })
  async getUsers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query =
        "SELECT id, email, name, created_at, updated_at FROM users ORDER BY created_at DESC";
      const result = await appInstance.pg.query(query);

      return reply.send({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      request.log.error("Get users error:", error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  @Get("/:id")
  @Auth()
  @Schema({
    description: "Get user by ID",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
  })
  async getUserById(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      const query =
        "SELECT id, email, name, created_at, updated_at FROM users WHERE id = $1";
      const result = await appInstance.pg.query(query, [id]);
      const user = result.rows[0];

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      request.log.error("Get user by id error:", error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  @Put("/:id")
  @Auth()
  @Schema({
    description: "Update user",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
      },
    },
  })
  async updateUser(
    request: FastifyRequest<{ Params: GetUserParams; Body: UpdateUserBody }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const { name } = request.body;

      const query = `
        UPDATE users 
        SET name = COALESCE($2, name), updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 
        RETURNING id, email, name, created_at, updated_at
      `;
      const result = await appInstance.pg.query(query, [id, name]);
      const user = result.rows[0];

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        data: user,
      });
    } catch (error) {
      request.log.error("Update user error:", error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }

  @Delete("/:id")
  @Auth()
  @Schema({
    description: "Delete user",
    tags: ["users"],
    security: [{ bearerAuth: [] }],
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
  })
  async deleteUser(
    request: FastifyRequest<{ Params: GetUserParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;

      const query = "DELETE FROM users WHERE id = $1";
      const result = await appInstance.pg.query(query, [id]);

      if (result.rowCount === 0) {
        return reply.status(404).send({
          success: false,
          error: "User not found",
        });
      }

      return reply.send({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      request.log.error("Delete user error:", error);
      return reply.status(500).send({
        success: false,
        error: "Internal server error",
      });
    }
  }
}
