<script setup lang="ts">
import {Users,School,UserPen,ChevronDown,LogOut,User,UserRound} from 'lucide-vue-next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
const user = useAuthStore()
const company = useCompanyStore()
const userName =ref(user.user?.name)
const shortenedName = computed(() => {
  if (userName.value.length > 13) {
    return userName.value.slice(0, 13) + '..';
  } else {
    return userName.value;
  }
});
</script>
<template>
  <div class="w-full h-full flex flex-col lg:flex-row items-stretch justify-self-stretch">
    <div class="bg-[#14293C]">
      <div class="bg-[#224162] py-4 px-8 flex items-center gap-4">
        <img src="https://placehold.co/70x70" alt="" class="rounded-full">
        <span class="flex flex-col gap-0.5">
          <span class="text-white font-bold">{{userName}}</span>
        <span class="text-green-500 text-sm">Cevrimci</span>
        </span>
      </div>
      <div class="bg-[#14293C]"><div class="flex items-center  p-4 border-b border-1-solid border-[#508C9B]">
        <span class="text-lg font-bold text-white py-2">Genel Ayarlar</span>
      </div>
        <div class="flex flex-col gap-4 py-2 text-[#EEEEEE] ">
         <div class="flex items-center gap-2 p-4"><Users class="text-gray-400"/><span class="text-md"><a href="/kullanicilar">Kullanıcılar</a></span></div>
          <div class="flex items-center  gap-2 p-4"><School class="text-gray-400"/><span>Odalar</span></div>
          <div class="flex items-center  gap-2 p-4"><UserPen class="text-gray-400"/><span>Yetkiler</span></div>
        </div></div>
    </div>
    <div class="flex  flex-col flex-1">
      <div class="flex">
        <div class="w-full bg-[#14293C] flex justify-between items-center">
          <div class="text-white p-4">LOGO</div>
<!--          <div class="flex gap-2 items-center justify-center text-gray-200 px-4"><Bell class="text-xs"/></div>-->
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger><div class="bg-[#508C9B] p-4 flex items-center justify-center gap-2">
            <span class="flex flex-col gap-0.5">
         <span class="flex gap-2">
           <UserRound class="text-white"/>
           <span class="text-white font-bold w-[100px]">
            {{shortenedName}}
          </span></span>
        </span>
            <span class="text-white"><ChevronDown /></span>
          </div></DropdownMenuTrigger>
          <DropdownMenuContent class="!w-full p-4">
            <DropdownMenuLabel>Hesap Bilgilerim</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="flex gap-1"><User class="!text-xs"/>Profilim</DropdownMenuItem>
            <DropdownMenuItem class="flex gap-1"><LogOut/>Cikis Yap</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
      <div class="bg-gray-50 p-4 shadow"><span>{{company.companyData.name}} YONETIM PANELI</span></div>
      <div class="flex flex-1">

        <slot/>
      </div>
    </div>
  </div>

</template>