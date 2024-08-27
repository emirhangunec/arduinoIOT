import {PrismaClient} from '@prisma/client'

const prisma = new PrismaClient()

async function main() {


    const privileges= await prisma.privilege.createManyAndReturn({
        data: [
            {name: 'user.create', label: 'Yeni kullanıcı oluşturma'},
            {name: 'user.read', label: 'Kullanıcıları listeleme'},
            {name: 'user.update', label: 'Kullanıcı güncelleme'},
            {name: 'user.delete', label: 'Kullanıcı silme'},

            {name: 'role.create', label: 'Yeni rol oluşturma'},
            {name: 'role.read', label: 'Rolleri listeleme'},
            {name: 'role.update', label: 'Rol güncelleme'},
            {name: 'role.delete', label: 'Rol silme'},

            {name: 'room.all.create', label: 'Yeni oda oluşturma'},
            {name: 'room.all.read', label: 'Odaları listeleme'},
            {name: 'room.all.update', label: 'Oda güncelleme'},
            {name: 'room.all.delete', label: 'Oda silme'},

            {name: 'room.user.read', label: 'Odaları listeleme'},
            {name: 'room.user.update', label: 'Oda güncelleme'},

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

    const fakeDevice = await prisma.device.create({
        data: {
            id: '1',
            ip: '::ffff:192.168.1.100',
            isOnline: false,
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