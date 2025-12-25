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
  // const isDevelopment = process.env.NODE_ENV === "development";

  // log: isDevelopment
  //   ? [
  //       { level: "query", emit: "event" },
  //       { level: "error", emit: "stdout" },
  //       { level: "warn", emit: "stdout" },
  //     ]
  //   : [{ level: "error", emit: "stdout" }],
  const url = process.env.DATABASE_URL;

  // Add connection timeouts for Neon DB cold starts
  let databaseUrl = url;
  if (url && !url.includes("connect_timeout")) {
    const separator = url.includes("?") ? "&" : "?";
    databaseUrl = `${url}${separator}connect_timeout=30&pool_timeout=30`;
  }

  return new PrismaClient({
    // Connection pool configuration for production
    datasources: {
      db: {
        url: databaseUrl,
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
