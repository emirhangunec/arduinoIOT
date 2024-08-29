import {UserWithRoleAndPrivileges} from "db";

export function canAction(requestingUser: UserWithRoleAndPrivileges, requiredPrivileges: string[] | string): boolean {
    if (!Array.isArray(requiredPrivileges)) {
        requiredPrivileges = [requiredPrivileges];
    }
    return requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
}
