import * as Prisma from "@prisma/client";

const prisma = new Prisma.PrismaClient();

export type User = Prisma.User;
export type Company = Prisma.Company;
export type Device = Prisma.Device;

export default prisma;
