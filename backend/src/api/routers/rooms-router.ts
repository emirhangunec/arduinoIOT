import express from "express";
import db, {RoomWithOpenHoursAndDeviceAndUsers} from "db";
import authMiddleware from "../middlewares/auth-middleware";
import {canAction, getDayNameFromNumber, getDayOfWeekFromName} from "@/helpers/utils";
import ExcelJS from 'exceljs';
import multer from "multer";

const storage = multer.memoryStorage();
export const upload = multer({ storage: storage });

const router = express.Router();

router.use(authMiddleware)

router.delete("/:id", async (req, res) => {
    const requiredPrivileges = ['room.all.delete'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});
    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});
    const {id} = req.params;
    const room = await db.room.delete({where: {id}});
    return res.json({
        message: "Room deleted",
        data: room
    });
});

router.get("/:id", async (req, res) => {
    const requiredPrivileges = ['room.all.read', 'room.user.read'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});
    const hasPrivileges = requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});
    const {id} = req.params;
    const room = await db.room.findUnique({
        where: {id},
        include: {users: true, device: true, openHours: true}
    }) as RoomWithOpenHoursAndDeviceAndUsers;
    if (!room) {
        return res.status(404).json({error: "Room not found"});
    }
    return res.json({
        message: "Room found",
        data: room
    });

});

router.post("/:id/import", upload.single('file'), async (req, res) => {
    const requiredPrivileges = ['room.all.update', 'room.user.update'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});
    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});
    const {id} = req.params;
    const room = await db.room.findUnique({where: {id}, include: {openHours: true}});
    if (!room) {
        return res.status(404).json({message: "Room not found"});
    }
    const file = req.file;
    if (!file) {
        return res.status(400).json({message: "File is required"});
    }
    const buffer = file.buffer;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    let json: any[] = []
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const day = row.getCell(1).value;
        let openHour = row.getCell(2).value;
        let closeHour = row.getCell(3).value;
        const isElectricityOn = row.getCell(4).value;
        const isHeaterOn = row.getCell(5).value;
        const controls = []
        if (isElectricityOn === "Evet"){
            controls.push("electricity")
        }
        if (isHeaterOn === "Evet"){
            controls.push("heeating")
        }

        const openHourDate = new Date(openHour as string);
        if (openHourDate.toString() !== "Invalid Date"){
            const openHourHours = openHourDate.getUTCHours();
            const openHourMinutes = openHourDate.getUTCMinutes();
            openHour = `${openHourHours.toString().padStart(2,'0')}:${openHourMinutes.toString().padStart(2,'0')}`;
        }

        const closeHourDate = new Date(closeHour as string);
        if (closeHourDate.toString() !== "Invalid Date"){
            const closeHourHours = closeHourDate.getUTCHours();
            const closeHourMinutes = closeHourDate.getUTCMinutes();
            closeHour = `${closeHourHours.toString().padStart(2,'0')}:${closeHourMinutes.toString().padStart(2,'0')}`;
        }


        const data ={
            dayOfWeek: getDayOfWeekFromName(day as string),
            openHour,
            closeHour,
            controls,
        }
        json.push(data);
    });
    return res.json({
        message: "schema imported",
        data: json
    });

})

router.get("/:id/export", async (req, res) => {
    const requiredPrivileges = ['room.all.read', 'room.user.read'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});
    const hasPrivileges = requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});
    const {id} = req.params;
    const openHours = await db.openHour.findMany({where: {roomId: id}});
    if (!openHours) {
        return res.status(404).json({error: "Open hours not found"});
    }

    const worksheetData = openHours.map(row => ({
        "day": getDayNameFromNumber(row.dayOfWeek),
        "openHour": row.openHour,
        "closeHour": row.closeHour,
        "isElectricityOn": row.isElectricityOn ? "Evet" : "Hayır",
        "isHeaterOn": row.isHeaterOn ? "Evet" : "Hayır"
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Açık Saatler');
    worksheet.columns = [
        {header: 'Gün', key: 'day', width: 20},
        {header: 'Başlangıç Saati', key: 'openHour', width: 20},
        {header: 'Bitiş Saati', key: 'closeHour', width: 20},
        {header: 'Elektrik Açık mı', key: 'isElectricityOn', width: 20},
        {header: 'Isıtıcı Açık mı', key: 'isHeaterOn', width: 20}
    ];
    worksheet.addRows(worksheetData);

    const openHourColumn = worksheet.getColumn('openHour');
    openHourColumn.eachCell({includeEmpty: true}, (cell) => {
        cell.numFmt = 'hh:mm';
    });

    const closeHourColumn = worksheet.getColumn('closeHour');
    closeHourColumn.eachCell({includeEmpty: true}, (cell) => {
        cell.numFmt = 'hh:mm';
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();



    // Dosya indirme başlığını ayarlayın
    res.setHeader('Content-Disposition', `attachment; filename="${id}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // Excel dosyasını gönderin
    res.send(excelBuffer);

})

router.get("/", async (req, res) => {
    const requiredPrivileges = ['room.all.read'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = requestingUser.role.privileges.some(privilege => requiredPrivileges.includes(privilege.name));
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});

    const searchParams = req.query;

    if (searchParams.all?.toString() === "true") {
        if (!canAction(requestingUser, 'room.all.read')) return res.status(403).json({message: "Unauthorized"});

        const rooms = await db.room.findMany({
            include: {
                openHours: true,
                device: true,
                users: true
            }
        }) as RoomWithOpenHoursAndDeviceAndUsers[];
        return res.json({
            message: "Rooms found",
            data: rooms
        });
    }

    if (searchParams.user?.toString() === "true") {
        if (!canAction(requestingUser, 'room.user.read')) return res.status(403).json({message: "Unauthorized"});

        const requestingUserId = requestingUser.id;
        const rooms = await db.room.findMany({
            where: {
                users: {
                    some: {
                        id: requestingUserId
                    }
                }
            },
            include: {
                openHours: true,
                device: true,
                users: true
            }
        }) as RoomWithOpenHoursAndDeviceAndUsers[];

        return res.json({
            message: "Rooms found",
            data: rooms
        });
    }

});

router.put("/:id", async (req, res) => {
    const requiredPrivileges = ['room.all.update', 'room.user.update'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});

    const {id} = req.params;
    const room = await db.room.findUnique({where: {id}, include: {users: true, device: true, openHours: true}});
    if (!room) {
        return res.status(404).json({message: "Room not found"});
    }
    if (!canAction(requestingUser, 'room.all.update')) {
        if (!room?.users.find(user => user.id === requestingUser.id)) {
            return res.status(403).json({message: "Unauthorized"});
        }
    }

    const {name, doorNumber, floor, sector, openHours, deviceId, userIds} = req.body;

//     remove existing users and connect new ones
    if (userIds) {
        await db.room.update({
            where: {id},
            data: {
                users: {
                    disconnect: room.users.map(user => ({id: user.id})),
                    connect: userIds.map((id: string) => ({id}))
                }
            }
        });
    }

//     remove existing open hours and create new ones
    if (openHours) {
        await db.openHour.deleteMany({where: {roomId: id}});
        await db.openHour.createMany({
            data: openHours.map((hour: any) => ({...hour, roomId: id}))
        });
    }

    // remove existing device and connect new one
    if (deviceId) {
        await db.room.update({
            where: {id},
            data: {
                device: {
                    disconnect: room.device ? {id: room.device.id} : undefined,
                    connect: {id: deviceId}
                }
            }
        });
    }

    // some data can be undefined, so we need to check if it is defined
    const dataToUpdate = {
        name: name ?? undefined,
        doorNumber: doorNumber ?? undefined,
        floor: floor ?? undefined,
        sector: sector ?? undefined
    }

    const updatedRoom = await db.room.update({
        where: {id},
        data: dataToUpdate,
        include: {
            openHours: true,
            device: true,
            users: {
                include: {
                    role: {
                        include: {
                            privileges: true
                        }
                    }
                }
            }
        }
    });

    return res.json({
        message: "Room updated",
        data: updatedRoom
    });


})


router.post("/", async (req, res) => {
    const requiredPrivileges = ['room.all.create'];
    const requestingUser = req.user;
    if (!requestingUser) return res.status(403).json({message: "Unauthorized"});

    const hasPrivileges = canAction(requestingUser, requiredPrivileges);
    if (!hasPrivileges) return res.status(403).json({message: "Unauthorized"});

    const {name, doorNumber, floor, sector, openHours, deviceId, userIds} = req.body;

    if (!name) {
        return res.status(400).json({message: "Missing required fields"});
    }


    const room = await db.room.create({
        data: {
            name,
            doorNumber,
            floor,
            sector,
            openHours: {
                create: openHours
            },
            device: {
                connect: deviceId ? {id: deviceId} : undefined
            },
            users: {
                connect: userIds.map((id: string) => ({id}))
            }
        },
        include: {
            openHours: true,
            device: true,
            users: {
                include: {
                    role: {
                        include: {
                            privileges: true
                        }
                    }
                }
            }
        }
    });

    return res.json({
        message: "Room created",
        data: room
    });
})

export default router;