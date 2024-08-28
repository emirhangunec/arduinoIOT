<script setup lang="ts">
import {Popover, PopoverContent, PopoverTrigger,} from '@/components/ui/popover'
import {Check, CheckCheck} from "lucide-vue-next";
import {cn} from "~/lib/utils";
import type {ToastMessageOptions} from "primevue/toast";


const {
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = useNotifications()

const generateTailwindClassesForNotification = (notification:ToastMessageOptions) => {
  switch (notification.severity){
    case 'success':
      return `bg-[--p-toast-success-background] text-[--p-toast-success-color] border border-[--p-toast-success-border-color] [&_button]:bg-[--p-toast-success-button-background] [&_button]:text-[--p-toast-success-button-color]`
    case 'info':
      return `bg-[--p-toast-info-background] text-[--p-toast-info-color] border border-[--p-toast-info-border-color] [&_button]:bg-[--p-toast-info-button-background] [&_button]:text-[--p-toast-info-button-color]`
    case 'warn':
      return `bg-[--p-toast-warn-background] text-[--p-toast-warn-color] border border-[--p-toast-warn-border-color] [&_button]:bg-[--p-toast-warn-button-background] [&_button]:text-[--p-toast-warn-button-color]`
    case 'error':
      return `bg-[--p-toast-error-background] text-[--p-toast-error-color] border border-[--p-toast-error-border-color] [&_button]:bg-[--p-toast-error-button-background] [&_button]:text-[--p-toast-error-button-color]`
    case 'contrast':
      return `bg-[--p-toast-contrast-background] text-[--p-toast-contrast-color] border border-[--p-toast-contrast-border-color] [&_button]:bg-[--p-toast-contrast-button-background] [&_button]:text-[--p-toast-contrast-button-color]`
    default:
      return `bg-[--p-toast-${notification.severity}-background] text-[--p-toast-${notification.severity}-color] border border-[--p-toast-${notification.severity}-border-color] [&_button]:bg-[--p-toast-${notification.severity}-button-background] [&_button]:text-[--p-toast-${notification.severity}-button-color]`
  }

}
</script>
<template>

  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline">
        <button class="pi pi-bell"></button>
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-80">
      <div class="flex justify-between items-center  p-2">
        <span class="font-bold">Notifications</span>
        <Button size="small" severity="secondary" @click="markAllNotificationsAsRead">
          <CheckCheck class="w-4 h-4"/>
        </Button>
      </div>
      <div class="overflow-y-auto max-h-96">
        <div v-for="notification in notifications" :key="notification.detail"
             class="p-2 rounded-md" :class="cn(
          generateTailwindClassesForNotification(notification)
             )">
          <div class="flex justify-between items-center">
            <span class="truncate pr-10">{{ notification.summary }}</span>
            <Button size="small" severity="secondary" @click="markNotificationAsRead(notification)">
              <Check class="w-4 h-4"/>
            </Button>
          </div>
          <div class="text-sm text-gray-500">
            {{ notification.detail }}
          </div>
        </div>
      </div>
    </PopoverContent>
  </Popover>

</template>