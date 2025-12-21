import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient is attached to the `global` object in development to prevent
 * exhausting database connections due to hot reloading in Next.js.
 */
declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined;
}

/**
 * Creates a new PrismaClient instance with environment-specific configuration
 */
function createPrismaClient(): PrismaClient {
  const isDevelopment = process.env.NODE_ENV === "development";

  return new PrismaClient({
    log: isDevelopment
      ? [
          { level: "query", emit: "event" },
          { level: "error", emit: "stdout" },
          { level: "warn", emit: "stdout" },
        ]
      : [{ level: "error", emit: "stdout" }],

    // Connection pool configuration for production
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

// Initialize Prisma Client
export const prisma = global.cachedPrisma ?? createPrismaClient();

// Attach query logging in development
if (process.env.NODE_ENV === "development") {
  prisma.$on("query" as never, (e: { query: string; duration: number }) => {
    console.log("Query: " + e.query);
    console.log("Duration: " + e.duration + "ms");
  });
}

// Prevent multiple instances in development (hot reload)
if (process.env.NODE_ENV !== "production") {
  global.cachedPrisma = prisma;
}

// Graceful shutdown handling
if (process.env.NODE_ENV === "production") {
  const cleanup = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

export default prisma;
