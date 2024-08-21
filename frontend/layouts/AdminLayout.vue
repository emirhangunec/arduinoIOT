<script setup lang="ts">

import Toast from 'primevue/toast';
import {cn} from "~/lib/utils";

const user = useAuthStore()
const company = useCompanyStore()
console.log(user.username)
const logout = () => {
  user.logout()
}

const MENU_ITEMS = [
  {
    name: 'Kullanıcılar',
    icon: 'pi pi-users',
    link: '/kullanicilar',
  },
  {
    name: 'Odalar',
    icon: 'pi pi-home',
    link: '/odalar',
  },
  {
    name: 'Yetkiler',
    icon: 'pi pi-lock',
    link: '/yetkiler',
  }
]

const isMenuItemActive = (item: { link: string }) => {
  return window.location.pathname === item.link
}

const isSidebarOpen = ref(true)
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}
</script>
<template>
  <Toast/>
  <div class="w-screen h-screen overflow-hidden flex items-stretch">
    <div class="bg-[#14293C] flex flex-col">
      <div
          class="bg-[#224162] flex items-center  text-white p-4 hover:bg-[#1E3A55] transition-all duration-150 ease-in-out hover:text-white"
          :class="cn(
          isSidebarOpen ? 'gap-4':'gap-0 justify-center'
      )"
      >
        <Button icon="pi pi-bars" text class="!text-white hover:!bg-transparent"
                @click="toggleSidebar"/>
        <span v-show="isSidebarOpen" class="flex flex-col gap-0.5 ">
          <span class="text-white font-bold">{{ user.username }}</span>
        <span class="text-green-500 text-sm">{{ user.role?.name }}</span>
        </span>
      </div>
      <div class="flex flex-col w-full flex-1  justify-between ">
        <div class="flex flex-col">
          <div v-for="item in MENU_ITEMS">
            <router-link :to="item.link"
                         class="flex items-center  text-white p-4 hover:bg-[#1E3A55] transition-all duration-150 ease-in-out hover:text-white"
                         :class="cn(
isSidebarOpen ? 'gap-4':'gap-0 justify-center',
isMenuItemActive(item) ? 'bg-[#1E3A55]':''
)"
            >
              <span class="pi pi-fw" :class="item.icon"></span>
              <span v-show="isSidebarOpen">{{ item.name }}</span>
            </router-link>
          </div>

        </div>

      </div>
      <div class="w-full bg-[#224162]">
        <button @click="logout"
                class="flex w-full justify-center items-center  text-white p-4 hover:bg-[#1E3A55] transition-all duration-150 ease-in-out hover:text-destructive"
                :class="cn(
isSidebarOpen ? 'gap-4':'gap-0 justify-center')"
        >

          <span class="pi pi-fw pi-power-off"></span>
          <span v-show="isSidebarOpen">Çıkış Yap</span>
        </button>
      </div>
    </div>
    <div class="flex  flex-col flex-1">
      <div class="flex">
        <div class="w-full bg-[#14293C] flex justify-between items-center">
          <div class="text-white p-4">
            <span>{{ company.companyData?.name }} </span>
            YONETIM PANELI
          </div>
          <div class="flex gap-2 items-center justify-center text-gray-200 px-4">
            <span class="pi pi-bell" @click="logout"></span>
          </div>
        </div>


      </div>
      <div class="flex flex-1 overflow-auto">
        <slot/>
      </div>
    </div>
  </div>

</template>