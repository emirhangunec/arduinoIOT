import * as Prisma from "@prisma/client";

const prisma = new Prisma.PrismaClient();

export type User = Prisma.User;
export type Role = Prisma.Role;
export type Privilege = Prisma.Privilege;
export type Company = Prisma.Company;
export type Device = Prisma.Device;
export type Room = Prisma.Room;
export type OpenHour = Prisma.OpenHour;

export interface DeviceWithRoom extends Device {
    room: Room | null
}

export interface  DeviceWithRoomAndOpenHours extends Device {
    room: RoomWithOpenHours | null
}

export interface RoomWithOpenHours extends Room {
    openHours: OpenHour[]
}

export interface RoleWithPrivileges extends Role {
    privileges: Privilege[]
}

export interface UserWithRoleAndPrivileges extends User {
    role: RoleWithPrivileges
}


export default prisma;
