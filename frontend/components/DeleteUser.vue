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
        summary: 'Error',
        detail: response.error,
        life: 10000
      })
    } else {
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'User deleted successfully',
        life: 5000
      })
      emit('user-deleted')
      isOpen.value = false
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Delete User" :style="{ width: '25rem' }">
    <div v-if="userToDelete" class="flex flex-col items-center justify-center gap-8 py-8 w-full ">

      <div class="flex gap-2">
        <span class="font-bold">Name:</span>
        <span>{{ userToDelete.name }}</span>
      </div>
      <div class="flex gap-2">
        <span class="font-bold">Email:</span>
        <span>{{ userToDelete.email }}</span>
      </div>
      <div class="flex gap-2">
        <span class="font-bold">Role:</span>
        <span>{{ userToDelete.role.name }}</span>
      </div>

      <p>
        Are you sure you want to delete this user?
      </p>
    </div>
    <template #footer>
      <div class="flex justify-end w-full gap-2">


        <Button type="button" label="Close" @click="isOpen = false" severity="secondary"/>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Delete"
               severity="danger"  class="bg-green-500 text-white"/>

      </div>
    </template>

  </Dialog>
</template>