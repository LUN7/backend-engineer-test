import Fastify from "fastify";

const getLogLever = () => {
  if (process.env.NODE_ENV === "production") {
    return "info";
  }
  if (process.env.NODE_ENV === "test") {
    return "silent";
  }
  return "debug";
};

export const fastifyInstance = Fastify({
  logger: { level: getLogLever() },
  ajv: {
    customOptions: {
      coerceTypes: true,
    },
  },
});
