import { z } from "zod";
import { FastifyRequest, FastifyReply } from "fastify";

export const validate = <T>(schema: z.ZodSchema<T>) => {
  return (request: FastifyRequest, reply: FastifyReply, done: Function) => {
    try {
      const result = schema.parse(request.body);
      request.body = result;
      done();
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: "Validation failed",
          details: error.issues,
        });
        return;
      }
      done(error);
    }
  };
};

export const validateParams = <T>(schema: z.ZodSchema<T>) => {
  return (request: FastifyRequest, reply: FastifyReply, done: Function) => {
    try {
      const result = schema.parse(request.params);
      request.params = result;
      done();
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          success: false,
          error: "Invalid parameters",
          details: error.issues,
        });
        return;
      }
      done(error);
    }
  };
};
