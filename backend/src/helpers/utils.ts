import {UserWithRoleAndPrivileges} from "db";

export function canAction(requestingUser: UserWithRoleAndPrivileges, requiredPrivileges: string[] | string): boolean {
    if (!Array.isArray(requiredPrivileges)) {
        requiredPrivileges = [requiredPrivileges];
    }
    return requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
}


export function getDayNameFromNumber(dayNumber: number): string {
    switch (dayNumber) {
        case 0:
            return 'Pazartesi'
        case 1:
            return 'Salı'
        case 2:
            return 'Çarşamba'
        case 3:
            return 'Perşembe'
        case 4:
            return 'Cuma'
        case 5:
            return 'Cumartesi'
        case 6:
            return 'Pazar'
        default:
            return 'Invalid day number';
    }
}

export function getDayOfWeekFromName(dayName: string): number {
    switch (dayName) {
        case 'Pazartesi':
            return 0
        case 'Salı':
            return 1
        case 'Çarşamba':
            return 2
        case 'Perşembe':
            return 3
        case 'Cuma':
            return 4
        case 'Cumartesi':
            return 5
        case 'Pazar':
            return 6
        default:
            return -1
    }
}