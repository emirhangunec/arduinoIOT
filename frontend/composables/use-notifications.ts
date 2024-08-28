import type {ToastMessageOptions} from "primevue/toast";

export function useNotifications() {
    const roomStore = useRoomsStore()
    const toast = useToast()
    const notificationsShowedOnToast= useLocalStorage<ToastMessageOptions[]>('notificationsShowedOnToast', [])
    const notificationsMarkedAsRead = useLocalStorage<ToastMessageOptions[]>('notificationsMarkedAsRead', [])

    const devicesWithoutRoom = computed(() => roomStore.devices.filter(device => !device.room))

    const devicesWithoutRoomNotification = computed(() => ({
        severity: 'warn',
        summary: 'Odası olmayan cihazlar',
        detail: `Odası olmayan ${devicesWithoutRoom.value.length} cihaz bulunmaktadır.`,
        life: 2000,

    } as ToastMessageOptions))

    watch(devicesWithoutRoom, (devicesWithoutRoom) => {

        if (devicesWithoutRoom.length > 0) {
            if (!notificationsShowedOnToast.value.find(notification => notification.detail === devicesWithoutRoomNotification.value.detail)) {
                toast.add(devicesWithoutRoomNotification.value)
                notificationsShowedOnToast.value.push(devicesWithoutRoomNotification.value)
            }
        }
    }, {immediate: true})

    const notifications = computed(() => {
        const notifications: ToastMessageOptions[] = []

        if (devicesWithoutRoom.value.length > 0) {
            notifications.push(devicesWithoutRoomNotification.value)
        }

        if (notifications.length > 0 && notificationsMarkedAsRead.value.length > 0) {
            return notifications.filter(notification => !notificationsMarkedAsRead.value.find(readedNotification => readedNotification.detail === notification.detail))
        }

        return notifications
    })

    const markNotificationAsRead = (notification: ToastMessageOptions) => {
        notificationsMarkedAsRead.value.push(notification)
    }

    const markAllNotificationsAsRead = () => {
        notifications.value.forEach(markNotificationAsRead)
    }

    return {
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
    }
}