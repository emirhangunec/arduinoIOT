<script setup lang="ts">

definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.can('room.all.create')) return navigateTo('/?message=no_permission')
  }
})

const user = useAuthStore()
const roomStore = useRoomsStore()

</script>
<template>
  <div class="p-4"></div>
</template>