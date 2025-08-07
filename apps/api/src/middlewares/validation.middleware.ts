import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";

export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.parse(request.body);
      request.body = result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      throw error;
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.parse(request.params);
      request.params = result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: "Invalid parameters",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      throw error;
    }
  };
};

export const validateQuery = <T>(schema: z.ZodSchema<T>) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = schema.parse(request.query);
      request.query = result;
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: "Invalid query parameters",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      throw error;
    }
  };
};
