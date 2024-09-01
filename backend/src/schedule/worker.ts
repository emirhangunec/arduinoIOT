import db, {OpenHour} from "db";
import eventHandler from "@/events";

interface Schedule extends OpenHour {
    isOpeningDoneForToday: boolean
    isClosingDoneForToday: boolean
}

eventHandler.on('device-connected', async (deviceId: string) => {
    console.log("Device connected", deviceId)
    console.log('we should check if this device is in the open hours')
    const device = await db.device.findUnique({
        where: {id: deviceId}
    })
    if (!device) {
        return
    }

    const relatedOpenHours = openHours.filter(openHour => openHour.roomId === device.roomId)
    if (!relatedOpenHours.length) {
        return
    }

    const now = fixDate()
    const dayOfWeek = getDayOfWeek(now)
    const todayOpenHours = relatedOpenHours.filter(openHour => openHour.dayOfWeek === dayOfWeek)

    if (!todayOpenHours.length) {
        return
    }

    const shouldRanOpenings = todayOpenHours.filter(openHour => isBetween(now, openHour.openHour, openHour.closeHour))

    if (!shouldRanOpenings.length) {
        return
    }

    console.log("new device connected, should be running on this schedule now, handling.", shouldRanOpenings)
    shouldRanOpenings.forEach((openHour) => {
    //     should run beetween 1second delay
        setTimeout(() => {
            handleOpening(openHour)
        }, 1000)
    })

})


let openHours = [] as Schedule[]
const fixDate = (date?: Date) => {
    if (!date) {
        date = new Date()
    }
    const isoString = date.toISOString();
    const isoDate = new Date(isoString)
//     We need to add 3 hours to get the correct time
    return new Date(isoDate.getTime() + 1000 * 60 * 60 * 3)
}

const getDayOfWeek = (date: Date) => {
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1
}

const getOpenHours = async () => {
    console.log("Getting open hours")
    const _openHours = await db.openHour.findMany()
    openHours = _openHours.map(item => ({
        ...item,
        isOpeningDoneForToday: false,
        isClosingDoneForToday: false
    }))

}

const isBetween = (now: Date, openHour: string, closeHour: string) => {
    const [hour, minute] = openHour.split(":").map(Number)
    const [closeHourHour, closeHourMinute] = closeHour.split(":").map(Number)

    const isNowPastOpenHour = now.getUTCHours() > hour || (now.getUTCHours() === hour && now.getUTCMinutes() >= minute)
    const isNowBeforeCloseHour = now.getUTCHours() < closeHourHour || (now.getUTCHours() === closeHourHour && now.getUTCMinutes() <= closeHourMinute)

    return isNowPastOpenHour && isNowBeforeCloseHour
}

const compareTime = (openHour: string, now: Date) => {
    const [hour, minute] = openHour.split(":").map(Number)

    if (now.getUTCHours() === hour) {
        if (now.getUTCMinutes() === minute || now.getUTCMinutes() === minute - 1 || now.getUTCMinutes() === minute + 1) {
            return true
        }
    }
    return false
}

const handleClosing = async (openHour: Schedule) => {
    console.log("Handling closing")
    const device = await db.device.findFirst({
        where: {roomId: openHour.roomId}
    })
    if (!device) {
        console.log("Device not found")
        return
    }
    eventHandler.emit('send-data-to-device', {
        deviceId: device.id,
        data: {
            heater: false,
            electricity: false
        }
    })

    openHour.isClosingDoneForToday = true
    console.log("Closing done")
}

const handleOpening = async (openHour: Schedule) => {
    console.log("Handling opening")
    const device = await db.device.findFirst({
        where: {roomId: openHour.roomId}
    })
    if (!device) {
        console.log("Device not found")
        return
    }
    eventHandler.emit('send-data-to-device', {
        deviceId: device.id,
        data: {
            heater: openHour.isHeaterOn,
            electricity: openHour.isElectricityOn
        }
    })

    openHour.isOpeningDoneForToday = true
    console.log("Opening done")
}


async function main() {
    const now = fixDate()
    const dayOfWeek = getDayOfWeek(now)
    const todaysOpenHours = openHours.filter(openHour => openHour.dayOfWeek === dayOfWeek)

    const needsOpening = todaysOpenHours.filter(openHour => {
        return !openHour.isOpeningDoneForToday && compareTime(openHour.openHour, now)
    })

    const needsClosing = todaysOpenHours.filter(openHour => {
        return !openHour.isClosingDoneForToday && compareTime(openHour.closeHour, now)
    })


    needsOpening.forEach(handleOpening)
    needsClosing.forEach(handleClosing)

    console.log("Needs opening", needsOpening)
    console.log("Needs closing", needsClosing)

}

async function handle() {
    await getOpenHours()
    setInterval(getOpenHours,
        1000 * 60 * 5
    )

    await main()
    setInterval(async () => {
        await main()
    }, 1000 * 60)
}

export async function startWorkers() {
    console.log("Worker started")
    await handle()

}
