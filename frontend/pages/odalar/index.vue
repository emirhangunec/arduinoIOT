<script setup lang="ts">

definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.canOr(['room.all.read','room.user.read'])) return navigateTo('/?message=no_permission')
  }
})

const user = useAuthStore()
const roomStore = useRoomsStore()

watch(roomStore.devices, (devices) => {
  console.log(devices)
})
</script>

<template>
  <div class="p-4 w-full flex flex-col gap-4">
    <div class="flex w-full items-center justify-between">
      <h3>
        Odalar
      </h3>
      <div class="flex gap-2">

        <Button @click="navigateTo('/odalar/ekle')" class="btn btn-primary">Oda Ekle</Button>
      </div>
    </div>
    <div class="" v-if="roomStore.devices.length">

    </div>
    <div v-else class="">
      <div class="text-center">
        <h1 class="text-2xl font-bold">Oda Bulunamadı</h1>
        <p class="text-gray-500">Henüz hiç oda eklenmemiş.</p>
      </div>
    </div>
  </div>
</template>