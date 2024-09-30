<script setup lang="ts">

import type {DeviceWithRoom, RoomWithOpenHoursAndDeviceAndUsers, UserWithRoleAndPrivileges} from "PrismaTypes";
import {cn} from "~/lib/utils";

definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.can('room.all.create')) return navigateTo('/?message=no_permission')
  }
})

const {$api} = useNuxtApp()

const data = ref({
  name: '',
  doorNumber: '',
  floor: '0',
  sector: '',
  deviceId: null,
  userIds: [],
  hasElectricity: false,
  hasHeating: false,
  hasWindow: false
})
const {data: users} = useApi<ApiResponse<UserWithRoleAndPrivileges[]>>('users')
const {data: devices} = useApi<ApiResponse<DeviceWithRoom[]>>('devices')

const userOptions = computed(() => users.value?.data.filter(u => u.role.id !== '1').map(u => ({
  label: `${u.name} - ${u.role.name}`,
  value: u.id
})) || [])

const deviceOptions = computed(() => devices.value?.data.filter(d => !d.roomId).map(d => ({
  label: `${d.ip.split('::ffff:')[1]} - ${d.isOnline ? 'Online' : 'Offline'}`,
  value: d.id
})) || [])


const getDayName = (day: number) => {
  switch (day) {
    case 0:
      return 'Monday'
    case 1:
      return 'Tuesday'
    case 2:
      return 'Wednesday'
    case 3:
      return 'Thursday'
    case 4:
      return 'Friday'
    case 5:
      return 'Saturday'
    case 6:
      return 'Sunday'
  }
}

interface SimpleOpenHour {
  dayOfWeek: number
  openHour: string
  closeHour: string
  controls: string[]
}

const openHours = ref([
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
  [] as SimpleOpenHour[],
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
  console.log({
    data: data.value,
    openHours: openHours.value.flat()
  })

  try {
    const res = await $api<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers>>('rooms', {
      method: 'POST',
      body: {
        ...data.value,
        openHours: openHours.value.flat()
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
        detail: 'Oda basariyla eklendi',
        life: 5000
      })
      navigateTo('/odalar')
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Oda eklenirken bir hata olustu, lutfen yonetici ile iletisime geciniz',
      life: 10000
    })
  }
}

const controlOptions = ref<{ label: string, value: string }[]>([])

watch([() => data.value.hasElectricity, () => data.value.hasHeating], ([electricity, heating]) => {
  if (electricity) {
    controlOptions.value.push({label: 'Electricity', value: 'electricity'})
  } else {
    controlOptions.value = controlOptions.value.filter(c => c.value !== 'electricity')
  }
  if (heating) {
    controlOptions.value.push({label: 'Heating', value: 'heating'})
  } else {
    controlOptions.value = controlOptions.value.filter(c => c.value !== 'heating')
  }
})
// const handleExport = async () => {
//   try {
//     const res = await $api<BlobPart>(`rooms/${route.params.id}/export`, {method: 'GET', responseType: 'blob'})
//     const url = window.URL.createObjectURL(new Blob([res]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `${route.params.id}.xlsx`);
//
//     // Linki tıklayıp dosyayı indirin
//     document.body.appendChild(link);
//     link.click();
//     link.parentNode?.removeChild(link);
//     console.log(res)
//   } catch (e) {
//     console.log(e)
//     toast.add(
//         {
//           severity: 'error',
//           summary: 'Hata',
//         }
//     )
//   }
// }
//
// const handleImport = async (event: FileUploadUploaderEvent) => {
//   const file = Array.isArray(event.files) ? event.files[0] : event.files;
//   const formData = new FormData()
//   formData.append('file', file);
//   const res = await $api<ApiResponse<SimpleOpenHour[]>>(`rooms/${route.params.id}/import`, {
//     method: 'POST',
//     body: formData,
//   })
//
//   if (!res?.data){
//     toast.add({
//       severity: 'error',
//       summary: 'Hata',
//       detail: res.error,
//       life: 10000
//     })
//     return
//   }
//
//   console.log(res.data)
//   openHours.value = res.data.reduce((acc, curr) => {
//     // @ts-ignore
//     acc[curr.dayOfWeek].push(curr)
//     return acc
//   }, [[], [], [], [], [], [], []])
// }

</script>
<template>
  <div class="p-4 flex flex-col gap-10 w-full h-full">
    <div class="flex w-full items-center justify-between">
      <h3 class="font-bold text-2xl">
        Add Room
      </h3>
      <Button label="Save" icon="pi pi-save" @click="handleSubmit" class="p-button-success"/>
    </div>

    <div class="grid grid-cols-2 gap-6 gap-y-10">
      <FloatLabel class="w-full">
        <InputText id="name" v-model="data.name" class="w-full"/>
        <label for="name">
          Room Name
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputText id="doorName" v-model="data.doorNumber" class="w-full"/>
        <label for="doorName">
          Door Number
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputNumber id="floor" show-buttons :min="0" :model-value="Number(data.floor)"
                     @update:modelValue="data.floor = $event.toString()" class="w-full"/>
        <label for="floor">
          Floor
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputText id="sector" v-model="data.sector" class="w-full"/>
        <label for="sector">
          Sector
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <MultiSelect id="userIds" v-model="data.userIds" :loading="!userOptions.length" :options="userOptions"
                     option-label="label" option-value="value" filter class="w-full"/>
        <label for="userIds">
          Authorized Users
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <Select id="deviceId" v-model="data.deviceId" :loading="!deviceOptions.length" :options="deviceOptions"
                option-label="label" option-value="value" filter class="w-full"/>
        <label for="deviceId">
          Device
        </label>
      </FloatLabel>
      <div v-if="data.deviceId" class=" col-span-2 w-full flex items-center justify-evenly">
        <div class=" flex items-center gap-2">
          <Checkbox v-model="data.hasElectricity" id="hasElectricity" class="" binary/>
          <label for="hasElectricity">
            Does the device have electricity control?
          </label>
        </div>
        <div class=" flex items-center gap-2">
          <Checkbox v-model="data.hasHeating" id="hasHeating" class="" binary/>
          <label for="hasHeating">
            Does the device have heating control?
          </label>
        </div>
        <div class=" flex items-center gap-2">
          <Checkbox v-model="data.hasWindow" id="hasWindow" class="" binary/>
          <label for="hasWindow">
            Does the device have window sensor?
          </label>
        </div>
      </div>
    </div>
    <div class="flex w-full items-center justify-between">
      <h3 class="font-bold text-2xl">
        Add Schedule
      </h3>
      <div class="flex items-center gap-2">
        <!--        <Button severity="secondary" label="Dışa Aktar" icon="pi pi-download" @click="handleExport" />-->
        <!--        <FileUpload mode="basic" class="p-button-info" name="file" accept=".xlsx" :maxFileSize="1000000" custom-upload @uploader="handleImport"-->
        <!--                    :auto="true" chooseLabel="İçe Aktar"/>-->
      </div>
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
              <label for="open_hour">Start </label>
            </FloatLabel>
            <FloatLabel>
              <DatePicker
                  :minDate="setHoursAndMinutes(openHours[index-1][hourSetIndex].openHour ?? undefined)"
                  :model-value="setHoursAndMinutes(openHours[index-1][hourSetIndex].closeHour ?? undefined)"
                  @update:model-value="openHours[index-1][hourSetIndex].closeHour = getHoursAndMinutes($event)"
                  inputId="close_hour" time-only fluid/>
              <label for="close_hour">End </label>
            </FloatLabel>
            <FloatLabel>
              <label for="controls">
                Controls
              </label>
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
                  placeholder="Add"
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
          Add
        </div>
      </div>
    </div>


  </div>
</template>