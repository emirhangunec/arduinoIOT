<script setup lang="ts">
import type {RoomWithOpenHoursAndDeviceAndUsers} from "PrismaTypes";

const route = useRoute()
definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.can('room.all.read')) {
      if (!user.can('room.user.read')) {
        return navigateTo('/?message=no_permission')
      } else {
        if (!room.value?.data.users.find(u => u.id === user.user?.id)) {
          return navigateTo('/?message=no_permission')
        }
      }
    }
  }
})
const devicesStore = useDevicesStore()

const {data: room, status} = useApi<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers>>(`rooms/${route.params.id}`)
const deviceId = computed(() => room.value?.data.device?.id ?? '')
const deviceStatus = computed(() => devicesStore.getDeviceStatus(deviceId.value))
const toast = useToast()
const {$api} = useNuxtApp()
</script>

<template>
  <div class="p-4 w-full h-full">
    <div class="flex flex-col gap-10" v-if="room?.data && status === 'success'">

      <div class="flex w-full items-center justify-between">
        <h3 class="font-bold text-2xl">
          {{ room.data.name }}
        </h3>
        <Button label="Duzenle" icon="pi pi-pencil" @click="navigateTo(`/odalar/${route.params.id}/duzenle`)"
        />
      </div>
      <div class="w-full flex flex-col gap-4" v-if="deviceId">
        <pre>
          {{ deviceStatus }}
        </pre>
        <Button :label="deviceStatus?.electricityStatus ? 'Kapat' : 'Ac'"
                :icon="deviceStatus?.electricityStatus ? 'pi pi-power-off' : 'pi pi-power-on'"
                @click="devicesStore.toggleElectricity(deviceId)"
                :disabled="devicesStore.isBusy"
        />

        <Button :label="deviceStatus?.heatingStatus ? 'Kapat' : 'Ac'"
                :icon="deviceStatus?.heatingStatus ? 'pi pi-power-off' : 'pi pi-power-on'"
                @click="devicesStore.toggleHeating(deviceId)"
                :disabled="devicesStore.isBusy"
        />
      </div>
    </div>
  </div>
</template>