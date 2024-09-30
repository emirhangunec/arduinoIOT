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

const {
  data: room,
  status
} = useApi<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers>>(`rooms/${route.params.id}?device=true&openHours=true`)
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
        <div class="flex items-center justify-end gap-2"
             :class="deviceStatus?.deviceId ? 'text-green-500' : 'text-red-500'"
        >
          <span class="w-4 h-4 animate-pulse rounded-full"
                :class="deviceStatus?.deviceId ? 'bg-green-500' : 'bg-red-500'"
          ></span>
          <span>
            {{ deviceStatus?.deviceId ? 'Cihaz Aktif' : 'Cihaz devre disi' }}
          </span>
          <Button label="Duzenle" icon="pi pi-pencil" @click="navigateTo(`/odalar/${route.params.id}/duzenle`)"
          />
        </div>
      </div>

      <div class="flex justify-between container gap-4">
        <div class="flex gap-4">

          <div class="flex flex-col gap-2">
            <span class="font-bold">sektor</span>
            <span>{{ room.data.sector }}</span>
          </div>
        </div>
        <div class="flex gap-4">
          <div class="flex flex-col gap-2">
            <span class="font-bold">Oda Numarasi</span>
            <span>{{ room.data.doorNumber }}</span>
          </div>
          <div class="flex flex-col gap-2">
            <span class="font-bold">Kat</span>
            <span>{{ room.data.floor }}</span>
          </div>
        </div>
      </div>

      <div class="" v-if="deviceStatus">
        <div class="flex gap-4">
          <div class="flex flex-col gap-2" v-if="room.data.device?.hasWindowSensor">
            <span class="font-bold">Cam kapali mi?</span>
            <span>{{ deviceStatus.windowStatus }}</span>
          </div>
          <div class="flex flex-col gap-2" v-if="room.data.device?.hasElectricityControl">
            <span class="font-bold">Elektrik Acik mi?</span>
            <ToggleSwitch :disabled="devicesStore.isDeviceBusy(deviceId)" @click="devicesStore.toggleElectricity(deviceId)"  v-model="deviceStatus.electricityStatus" />
          </div>
          <div class="flex flex-col gap-2" v-if="room.data.device?.hasHeaterControl">
            <span class="font-bold">Isinma acik mi?</span>
            <ToggleSwitch :disabled="devicesStore.isDeviceBusy(deviceId)" @click="devicesStore.toggleHeating(deviceId)"  v-model="deviceStatus.heatingStatus" />
          </div>
        </div>
      </div>


<!--      <div class="" v-if="room.data.openHours">-->
<!--        <div class="" v-for="hour in room.data.openHours">-->
<!--          <div class="flex gap-4">-->
<!--            <div class="flex flex-col gap-2">-->
<!--              <span class="font-bold">Gun</span>-->
<!--              <span>{{ getDayNameFromNumber(hour.dayOfWeek) }}</span>-->
<!--            </div>-->
<!--            <div class="flex flex-col gap-2">-->
<!--              <span class="font-bold">Acilis Saati</span>-->
<!--              <span>{{ hour.openHour }}</span>-->
<!--            </div>-->
<!--            <div class="flex flex-col gap-2">-->
<!--              <span class="font-bold">Kapanis Saati</span>-->
<!--              <span>{{ hour.closeHour }}</span>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </div>-->

    </div>
  </div>
</template>