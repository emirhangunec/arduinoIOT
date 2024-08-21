<script setup lang="ts">
import type {RoleWithPrivileges} from "PrismaTypes";

const user = useAuthStore()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})

interface EditRoleProps {
  role?: RoleWithPrivileges
}

const props = defineProps<EditRoleProps>()
const role = computed(() => props.role)

const toast = useToast()
const {$api} = useNuxtApp()

const emit = defineEmits(['roleDeleted'])


const canSubmit = computed(() => role.value && role.value.id)

const handleSubmit = async () => {
  if (!canSubmit.value || !role.value || !role.value.id) return
  try {
    const response = await $api<ApiResponse<RoleWithPrivileges>>(`roles/${role.value.id}`, {
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
        detail: 'Rol basariyla silindi',
        life: 5000
      })
      emit('roleDeleted')
      isOpen.value = false
    }
  } catch (e) {
    console.log(e)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Rol silinirken bir hata olustu, bir rolu silmek icin o rolu kullanan tum kullanicilarin rolunu degistirmeniz veya silmeniz gerekmektedir',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Rol Sil" :style="{ width: '25rem' }">
    <div class="flex flex-col items-center justify-center gap-8 py-8 w-full ">
      <div class="text-center">
        <p class="text-lg">Rolü silmek istediğinize emin misiniz?</p>
        <p class="text-sm text-gray-500">Bu işlem geri alınamaz.</p>
      </div>

    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Kapat" @click="isOpen = false" severity="secondary"></Button>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Sil" severity="danger"
                class="bg-green-500 text-white"></Button>
      </div>
    </template>

  </Dialog>
</template>