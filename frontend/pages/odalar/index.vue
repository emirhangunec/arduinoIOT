<script setup lang="ts">

import type {RoomWithOpenHoursAndDeviceAndUsers} from "PrismaTypes";
import {FilterMatchMode, FilterOperator} from '@primevue/core/api';
import {cn} from "~/lib/utils";

definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.canOr(['room.all.read', 'room.user.read'])) return navigateTo('/?message=no_permission')
  }
})

const user = useAuthStore()
const requestUrl = `rooms?${user.can('room.all.read') ? 'all=true' : 'user=true'}`

const {data: rooms, status, error, refresh} = useApi<ApiResponse<RoomWithOpenHoursAndDeviceAndUsers[]>>(requestUrl)

const userCanDoAnyAction = computed(() => user.canOr(['room.all.update', 'room.all.delete', 'room.user.update', 'room.user.delete']))


const initFilter = () => {
  filters.value = {
    global: {value: null, matchMode: FilterMatchMode.CONTAINS},
    name: {
      operator: FilterOperator.AND,
      constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}],
    },
    doorName: {
      operator: FilterOperator.AND,
      constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}],
    },
    floor: {
      operator: FilterOperator.AND,
      constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}],
    },
    sector: {
      operator: FilterOperator.AND,
      constraints: [{value: null, matchMode: FilterMatchMode.CONTAINS}],
    },
  }
}

const filters = ref<any>({})
initFilter()

</script>

<template>
  <DataTable class="!h-full w-full"
             :value="rooms?.data"
             :loading="false"
             v-model:filters="filters"
             striped-rows
             show-gridlines
             row-hover
             paginator
             :rows="10"
             :rows-per-page-options="[10, 25, 50, 100]"
             removableSort
             filter-display="menu"
             filter-locale="TR-tr"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">Odalar</span>
        <div class="flex gap-1">
          <Button type="button" icon="pi pi-filter-slash" outlined @click="initFilter()"/>
          <IconField>
            <InputIcon>
              <i class="pi pi-search"/>
            </InputIcon>
            <InputText v-model="filters['global'].value" placeholder="Ara..."/>
          </IconField>
        </div>
        <div class="flex items-center justify-center gap-2">
          <Button @click="navigateTo('/odalar/ekle')" severity="" v-if="user.can('room.all.create')" icon="pi pi-plus"
                  rounded
                  raised class="bg-blue-500 text-white"/>
          <Button icon="pi pi-refresh" @click="refresh()" rounded raised link/>
        </div>
      </div>
    </template>
    <Column sortable field="name" header="Oda Ismi" :show-filter-operator="false" :show-add-button="false">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Ara..."/>
      </template>
    </Column>
    <Column sortable field="doorNumber" header="Kapi Numarasi" :show-filter-operator="false" :show-add-button="false">
      <template #body="{data}">
        <span>{{ data.doorNumber || '-' }}</span>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Ara..."/>
      </template>
    </Column>
    <Column sortable field="floor" header="Kat" :show-filter-operator="false" :show-add-button="false">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Ara..."/>
      </template>
    </Column>
    <Column sortable field="sector" header="Sektor" :show-filter-operator="false" :show-add-button="false">
      <template #filter="{ filterModel, filterCallback }">
        <InputText v-model="filterModel.value" type="text" @input="filterCallback()" placeholder="Ara..."/>
      </template>
    </Column>
    <Column field="users" header="Kullanicilar">
      <template #body="{data}">
        <div v-if="data.users.length" class="flex gap-2">
          <span v-for="user in data.users" :key="user.id">{{ user.name }}</span>
        </div>
        <div v-else>
          <span class="text-sm text-red-500">Atanmis Kullanici Yok</span>
        </div>
      </template>
    </Column>
    <Column sortable field="device.isOnline" header="Cihaz">
      <template #body="{data}">
        <div v-if="data.device" class="items-center justify-center flex gap-2">
          <span  :class="cn(
              data.device.isOnline? 'text-green-500': 'text-red-500'
          )">
            {{ data.device.isOnline ? 'Aktif' : 'Pasif' }}
          </span>
          <div class="w-4 h-4 rounded-full" :class="cn(
              data.device.isOnline? 'bg-green-500 animate-pulse': 'bg-red-500'
          )"></div>
        </div>
        <div v-else>
          <span class="text-sm text-red-500">Cihaz Yok</span>
        </div>
      </template>
    </Column>
    <Column v-if="userCanDoAnyAction" header="İşlemler">
      <template #body="{data}">
        <div class="flex gap-2">
          <Button icon="pi pi-pencil" severity="info" v-if="user.can('room.all.update')"/>
          <Button icon="pi pi-trash" severity="danger" v-if="user.can('room.all.delete')"/>
        </div>
      </template>
    </Column>

  </DataTable>
</template>