import type {ToastMessageOptions} from "primevue/toast";
import {useDevicesStore} from "~/stores/devices-store";

export function useNotifications() {
    const roomStore = useDevicesStore()
    const toast = useToast()
    const notificationsShowedOnToast = useLocalStorage<ToastMessageOptions[]>('notificationsShowedOnToast', [])
    const notificationsMarkedAsRead = useLocalStorage<ToastMessageOptions[]>('notificationsMarkedAsRead', [])
    const notifications = ref<ToastMessageOptions[]>([])
    const devicesWithoutRoom = computed(() => roomStore.devices.filter(device => !device.room))

    const addNotification = (notification: ToastMessageOptions) => {
        if (!notifications.value.find(_notification => _notification.detail === notification.detail)) {
            notifications.value.push(notification)
        }
    }

    watch(notifications, (notifications) => {
        notifications.forEach(notification => {
            //    check is notification already showed on toast, if not show it and add it to showed notifications
            if (!notificationsShowedOnToast.value.some(_notification => _notification.detail === notification.detail)) {
                toast.add({...notification, life: 2000})
                notificationsShowedOnToast.value.push(notification)
            }
        })
    },{
        immediate: true,
        deep: true
    })

    watch(devicesWithoutRoom, (devicesWithoutRoom) => {
        if (devicesWithoutRoom.length > 0) {
            const devicesWithoutRoomNotification = {
                severity: 'warn',
                summary: 'Odası olmayan cihazlar',
                detail: `Odası olmayan ${devicesWithoutRoom.length} cihaz bulunmaktadır.`,

            } as ToastMessageOptions

            addNotification(devicesWithoutRoomNotification)
        }

    }, {immediate: true})

    const unReadNotifications = computed(() => notifications.value.filter(notification => !notificationsMarkedAsRead.value.some(notificationMarkedAsRead => notificationMarkedAsRead.detail === notification.detail)))

    const markNotificationAsRead = (notification: ToastMessageOptions) => {
        notificationsMarkedAsRead.value.push(notification)
    }

    const markAllNotificationsAsRead = () => {
        notifications.value.forEach(markNotificationAsRead)
    }

    const sendNotification = (notification: ToastMessageOptions) => {
        addNotification(notification)
    }



    return {
        notifications: unReadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        sendNotification
    }
}