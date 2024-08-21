<script setup lang="ts">
import type {RoleWithPrivileges, UserWithRoleAndPrivileges} from "PrismaTypes";

const user = useAuthStore()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})
const emit = defineEmits(['user-deleted'])
const toast = useToast()
const {$api} = useNuxtApp()

interface DeleteUserProps {
  user?: UserWithRoleAndPrivileges
}

const props = defineProps<DeleteUserProps>()
const userToDelete = computed(() => props.user)

const canSubmit = computed(() => userToDelete.value?.id)
const handleSubmit = async () => {
  if (!canSubmit.value || !userToDelete.value || !userToDelete.value.id) return
  try {
    const response = await $api<ApiResponse<RoleWithPrivileges>>(`users/${userToDelete.value.id}`, {
      method: 'DELETE',
    })
    if (response.error) {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: response.error,
        life: 10000
      })
    } else {
      toast.add({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Kullanici basariyla silindi',
        life: 5000
      })
      emit('user-deleted')
      isOpen.value = false
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Kullanici silinirken bir hata olustu, lutfen yonetici ile iletisime geciniz',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Kullaniciyi sil" :style="{ width: '25rem' }">
    <div v-if="userToDelete" class="flex flex-col items-center justify-center gap-8 py-8 w-full ">

      <div class="flex gap-2">
        <span class="font-bold">Ad:</span>
        <span>{{ userToDelete.name }}</span>
      </div>
      <div class="flex gap-2">
        <span class="font-bold">Email:</span>
        <span>{{ userToDelete.email }}</span>
      </div>
      <div class="flex gap-2">
        <span class="font-bold">Rol:</span>
        <span>{{ userToDelete.role.name }}</span>
      </div>

      <p>
        Kullaniciyi silmek istediginize emin misiniz?
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end w-full gap-2">


        <Button type="button" label="Kapat" @click="isOpen = false" severity="secondary"/>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Sil"
               severity="danger"  class="bg-green-500 text-white"/>

      </div>
    </template>

  </Dialog>
</template>