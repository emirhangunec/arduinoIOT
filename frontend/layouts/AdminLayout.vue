<script setup lang="ts">
import {ChevronDown, HouseIcon, LogOut, School, User, UserPen, UserRound, Users} from 'lucide-vue-next'
import Toast from 'primevue/toast';

const user = useAuthStore()
const company = useCompanyStore()
</script>
<template>
  <Toast />
  <div class="w-full h-full flex flex-col lg:flex-row items-stretch justify-self-stretch">
    <div class="bg-[#14293C]">
      <div class="bg-[#224162] py-4 px-8 flex items-center gap-4">
        <img src="https://placehold.co/70x70" alt="" class="rounded-full">
        <span class="flex flex-col gap-0.5">
          <span class="text-white font-bold">{{ user.username}}</span>
        <span class="text-green-500 text-sm">Cevrimci</span>
        </span>
      </div>
      <div class="bg-[#14293C]">
        <div class="flex items-center  p-4 border-b border-1-solid border-[#508C9B]">
          <span class="text-lg font-bold text-white py-2 flex items-center justify-center gap-2"><HouseIcon/>Genel Ayarlar</span>
        </div>
        <div class="flex flex-col gap-4 py-2 text-[#EEEEEE] ">
          <div class="flex items-center gap-2 p-4">
            <Users class="text-gray-400"/>
            <span class="text-md"><a href="/kullanicilar">Kullanıcılar</a></span></div>
          <div class="flex items-center  gap-2 p-4">
            <School class="text-gray-400"/>
            <span>Odalar</span></div>
          <div class="flex items-center  gap-2 p-4">
            <UserPen class="text-gray-400"/>
            <span>Yetkiler</span></div>
        </div>
      </div>
    </div>
    <div class="flex  flex-col flex-1">
      <div class="flex">
        <div class="w-full bg-[#14293C] flex justify-between items-center">
          <div class="text-white p-4">
            <span>{{ company.companyData?.name }} </span>
            YONETIM PANELI
          </div>
<!--                    <div class="flex gap-2 items-center justify-center text-gray-200 px-4"><Bell class="text-xs"/></div>-->
        </div>


      </div>
      <div class="flex flex-1">
        <slot/>
      </div>
    </div>
  </div>

</template>