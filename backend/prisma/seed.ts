import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {


    const privileges= await prisma.privilege.createManyAndReturn({
        data: [
            {name: 'user.create', label: 'Create user'},
            {name: 'user.read', label: 'Read user'},
            {name: 'user.update', label: 'Update user'},
            {name: 'user.delete', label: 'Delete user'},

            {name: 'role.create', label: 'Create role'},
            {name: 'role.read', label: 'Read role'},
            {name: 'role.update', label: 'Update role'},
            {name: 'role.delete', label: 'Delete role'},

            {name: 'room.all.create', label: 'Create room'},
            {name: 'room.all.read', label: 'Read room'},
            {name: 'room.all.update', label: 'Update room'},
            {name: 'room.all.delete', label: 'Delete room'},

            {name: 'room.user.read', label: 'Read assigned rooms'},
            {name: 'room.user.update', label: 'Update assigned rooms'},

        ],
    })

    const allPrivilegeIds = privileges.map(p => ({id: p.id}))

    await prisma.role.create({
        data: {
            id: '1',
            name: 'admin',
            privileges: {
                connect: allPrivilegeIds
            }
        }
    })

}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })