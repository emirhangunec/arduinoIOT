<script setup lang="ts">
import type {DeviceWithRoom, RoomWithOpenHoursAndDeviceAndUsers, UserWithRoleAndPrivileges} from "PrismaTypes";
import {cn} from "~/lib/utils";

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

const {
  data: room,
  status,
  refresh
} = useApi<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers>>(`rooms/${route.params.id}`)

watch(status, (status) => {
  if (status === 'success' && room.value?.data) {
    data.value.name = room.value.data.name
    data.value.doorNumber = room.value.data.doorNumber ?? ''
    data.value.floor = room.value.data.floor?.toString() ?? '0'
    data.value.sector = room.value.data.sector ?? ''
    data.value.deviceId = room.value.data.device?.id ?? null
    data.value.userIds = room.value.data.users.map(u => u.id) ?? []
    deviceDataToUpdate.value.electricity = room.value.data.device?.hasElectricityControl ?? false
    deviceDataToUpdate.value.heating = room.value.data.device?.hasHeaterControl ?? false
    deviceDataToUpdate.value.windowSensor = room.value.data.device?.hasWindowSensor ?? false

    controlOptions.value = []
    if (room.value.data.device) {
      if (room.value.data.device.hasElectricityControl) {
        controlOptions.value.push({label: 'Elektrik', value: 'electricity'})
      }
      if (room.value.data.device.hasHeaterControl) {
        controlOptions.value.push({label: 'Isi', value: 'heating'})
      }
      // if (room.value.data.device.hasWindowSensor) {
      //   controlOptions.value.push({label: 'Pencere Sensoru', value: 'windowSensor'})
      // }
    }
    openHours.value = room.value.data.openHours.reduce((acc, curr) => {
      const controls = []
      if (curr.isElectricityOn) {
        controls.push('electricity')
      }
      if (curr.isHeaterOn) {
        controls.push('heating')
      }
      // @ts-ignore
      acc[curr.dayOfWeek].push({
        ...curr,
        controls
      })
      return acc
    }, [[], [], [], [], [], [], []])
  }
}, {
  immediate: true
})

const {$api} = useNuxtApp()

const data = ref({
  name: '',
  doorNumber: '',
  floor: '0',
  sector: '',
  deviceId: null as string | null,
  userIds: [] as string[],
  controls: [] as ('electricity' | 'heating')[]
})
const {data: users} = useApi<ApiResponse<UserWithRoleAndPrivileges[]>>('users')
const {data: devices} = useApi<ApiResponse<DeviceWithRoom[]>>('devices')

const userOptions = computed(() => users.value?.data.filter(u => u.role.id !== '1').map(u => ({
  label: `${u.name} - ${u.role.name}`,
  value: u.id
})) || [])

const deviceOptions = computed(() => devices.value?.data.map(d => ({
  label: `${d.ip.split('::ffff:')[1]} - ${d.isOnline ? 'Aktif' : 'Pasif'}`,
  value: d.id
})) || [])

const controlOptions = ref<{ label: string, value: string }[]>([])

const deviceDataToUpdate = ref({
  electricity: false,
  heating: false,
  windowSensor: false,
})
const getDayName = (day: number) => {
  switch (day) {
    case 0:
      return 'Pazartesi'
    case 1:
      return 'Sali'
    case 2:
      return 'Carsamba'
    case 3:
      return 'Persembe'
    case 4:
      return 'Cuma'
    case 5:
      return 'Cumartesi'
    case 6:
      return 'Pazar'
  }
}
const openHours = ref([
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
  [] as { dayOfWeek: number, openHour: string, closeHour: string, controls: string[] }[],
])
const addOpenHourSection = (day: number) => {
  const now = new Date()
  openHours.value[day].push({
    dayOfWeek: day,
    openHour: getHoursAndMinutes(now),
    closeHour: getHoursAndMinutes(now),
    controls: [] as string[]
  })
}
const getHoursAndMinutes = (date: Date) => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  console.log({
    cleanHours: date.getHours(),
    cleanMinutes: date.getMinutes(),
    date: date,
    stringifiedHours: hours.toString(),
    stringifiedMinutes: minutes.toString(),
    hours,
    minutes
  })

  return `${hours}:${minutes}`
}
const setHoursAndMinutes = (time?: string) => {
  const date = new Date()
  if (!time) return date
  const [hours, minutes] = time.split(':')
  date.setHours(Number(hours))
  date.setMinutes(Number(minutes))
  return date
}

const toast = useToast()
const handleSubmit = async () => {
  const roomId = room.value?.data.id
  if (!roomId) return
  console.log({
    data: data.value,
    openHours: openHours.value.flat()
  })
  try {
    const _openHours = openHours.value.flat().map(o => ({
      dayOfWeek: o.dayOfWeek,
      openHour: o.openHour,
      closeHour: o.closeHour,
      isElectricityOn: o.controls.includes('electricity'),
      isHeaterOn: o.controls.includes('heating'),
    }))
    const res = await $api<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers>>(`rooms/${roomId}`, {
      method: 'PUT',
      body: {
        ...data.value,
        openHours: _openHours
      }
    })

    if (res.error) {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: res.error,
        life: 10000
      })
    } else {
      toast.add({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Oda basariyla duzenlenid',
        life: 5000
      })
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Oda duzenlenirken bir hata olustu, lutfen yonetici ile iletisime geciniz',
      life: 10000
    })
  }
}

const editDeviceSubmit = async () => {
  const deviceId = room.value?.data.device?.id
  if (!deviceId) return
  const data = {
    hasElectricityControl: deviceDataToUpdate.value.electricity,
    hasHeaterControl: deviceDataToUpdate.value.heating,
    hasWindowSensor: deviceDataToUpdate.value.windowSensor
  }

  const res = await $api<ApiResponse<DeviceWithRoom>>(`devices/${deviceId}`, {
    method: 'PUT',
    body: data
  })

  console.log(res)

  if (!res.error) {
    toast.add({
      severity: 'success',
      summary: 'Basarili',
      detail: 'Cihaz basariyla duzenlendi',
      life: 5000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: res.error,
      life: 10000
    })
  }
  refresh()
  isEditDeviceDialogVisible.value = false
}
const isEditDeviceDialogVisible = ref(false)
</script>

<template>
  <div class="p-4  w-full h-full">
    <div class="flex flex-col gap-10" v-if="room?.data && status === 'success'">

      <div class="flex w-full items-center justify-between">
        <h3 class="font-bold text-2xl">
          {{ room.data.name }} isimli odayi duzenle
        </h3>
        <Button label="Kaydet" icon="pi pi-save" @click="handleSubmit" class="p-button-success"/>
      </div>

      <div class="grid grid-cols-2 gap-6 gap-y-10">
        <FloatLabel class="w-full">
          <InputText id="name" v-model="data.name" class="w-full"/>
          <label for="name">Oda Adi</label>
        </FloatLabel>

        <FloatLabel class="w-full">
          <InputText id="doorName" v-model="data.doorNumber" class="w-full"/>
          <label for="doorName">Kapi Numarasi</label>
        </FloatLabel>

        <FloatLabel class="w-full">
          <InputNumber id="floor" show-buttons :min="0" :model-value="Number(data.floor)"
                       @update:modelValue="data.floor = $event.toString()" class="w-full"/>
          <label for="floor">Kat</label>
        </FloatLabel>

        <FloatLabel class="w-full">
          <InputText id="sector" v-model="data.sector" class="w-full"/>
          <label for="sector">Sektor</label>
        </FloatLabel>

        <FloatLabel class="w-full">
          <MultiSelect id="userIds" v-model="data.userIds" :loading="!userOptions.length" :options="userOptions"
                       option-label="label" option-value="value" filter class="w-full"/>
          <label for="userIds">Yetkili Kullanicilar</label>
        </FloatLabel>
        <div class="w-full flex items-center justify-stretch gap-2 ">

          <FloatLabel class="w-full">
            <Select id="deviceId" v-model="data.deviceId" :loading="!deviceOptions.length" :options="deviceOptions"
                    option-label="label" option-value="value" filter class="w-full"/>
            <label for="deviceId">Cihaz</label>
          </FloatLabel>

          <Button
              icon="pi pi-pencil"
              severity="info"
              @click="isEditDeviceDialogVisible = true"
              v-if="data.deviceId && room.data.device"
          />
        </div>
        <Dialog v-model:visible="isEditDeviceDialogVisible" v-if="room.data?.device" modal header="Cihazi Duzenle"
                :style="{ width: '25rem' }">
          <span class="text-surface-500 dark:text-surface-400 block mb-8">
            Cihaz bilgilerini duzenleyebilirsiniz
            <br>
            <span>
              IP:
              {{ room.data.device.ip.split('::ffff:')[1] }}
            </span>
          </span>
          <div class="flex flex-col gap-4 mb-8">
            <div class="flex w-full justify-between items-center gap-2">
              <Label for="electricity">Elektrik Kontrolu</Label>
              <ToggleButton v-model="deviceDataToUpdate.electricity" onLabel="Var" offLabel="Yok"/>
            </div>
            <div class="flex w-full justify-between items-center gap-2">
              <Label for="heating">Isi Kontrolu</Label>
              <ToggleButton v-model="deviceDataToUpdate.heating" onLabel="Var" offLabel="Yok"/>
            </div>
            <div class="flex w-full justify-between items-center gap-2">
              <Label for="windowSensor">Pencere Sensoru</Label>
              <ToggleButton v-model="deviceDataToUpdate.windowSensor" onLabel="Var" offLabel="Yok"/>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button type="button" label="Vazgec" severity="secondary"
                    @click="isEditDeviceDialogVisible = false"></Button>
            <Button type="button" label="Kaydet" @click="editDeviceSubmit"></Button>
          </div>
        </Dialog>
      </div>
      <div class="grid grid-cols-7">
        <div v-for="index in 7" class="flex flex-col border border-r-0" :class="cn(
         index -1 === 0 && 'rounded-l-xl',
          index -1 === 6 && 'rounded-r-xl border-r',
     )">
          <div class="border-b border-gray-200 font-medium bg-gray-100 text-center p-2">
            {{ getDayName(index - 1) }}
          </div>
          <div v-for="(hourSet,hourSetIndex) in openHours[index - 1]" :key="hourSetIndex"
               class="p-2 py-8 flex  items-center gap-2 justify-between border-b">
            <div class="gap-8 flex flex-col">
              <FloatLabel>
                <DatePicker
                    :maxDate="setHoursAndMinutes(openHours[index-1][hourSetIndex].closeHour ?? undefined)"
                    :model-value="setHoursAndMinutes(openHours[index-1][hourSetIndex].openHour ?? undefined)"
                    @update:model-value="openHours[index-1][hourSetIndex].openHour = getHoursAndMinutes($event)"
                    inputId="open_hour" time-only fluid/>
                <label for="open_hour">Baslangic </label>
              </FloatLabel>
              <FloatLabel>
                <DatePicker
                    :minDate="setHoursAndMinutes(openHours[index-1][hourSetIndex].openHour ?? undefined)"
                    :model-value="setHoursAndMinutes(openHours[index-1][hourSetIndex].closeHour ?? undefined)"
                    @update:model-value="openHours[index-1][hourSetIndex].closeHour = getHoursAndMinutes($event)"
                    inputId="close_hour" time-only fluid/>
                <label for="close_hour">Bitis </label>
              </FloatLabel>
              <FloatLabel>
                <label for="controls">Sec</label>
                <MultiSelect
                    id="controls"
                    v-model="openHours[index - 1][hourSetIndex].controls"
                    class="!truncate w-full"
                    :options="controlOptions"
                    option-label="label"
                    option-value="value"
                    filter
                    :max-selected-labels="0"
                    selected-items-label="{0}"
                    placeholder="sec"
                />
              </FloatLabel>

            </div>
            <Button severity="danger" class="!h-full !px-2" icon="pi pi-trash"
                    @click="openHours[index - 1].splice(hourSetIndex, 1)"/>
          </div>
          <div
              class="p-2 flex items-center gap-2 h-full justify-center text-center cursor-pointer text-blue-500 hover:bg-blue-100 transition-all duration-150 ease-in-out"
              @click="addOpenHourSection(index -1)">
            <i class="pi pi-plus-circle"></i>
            ekle
          </div>
        </div>
      </div>


    </div>
    <div v-else-if="status === 'pending'">
      <p>Loading...</p>
    </div>
    <div v-else-if="status === 'error' && room?.error">
      <p>Error: {{ room.error }}</p>
    </div>
  </div>
</template>