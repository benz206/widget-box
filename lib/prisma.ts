import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter: new PrismaLibSql({ url: process.env.DATABASE_URL! }) });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
