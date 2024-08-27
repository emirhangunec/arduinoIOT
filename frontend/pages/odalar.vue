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

</script>

<template>
  <div class="">
    odalar
  </div>
</template>