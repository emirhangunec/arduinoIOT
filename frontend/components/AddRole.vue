<script setup lang="ts">
import type {Privilege, RoleWithPrivileges} from "PrismaTypes";

const user = useAuthStore()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})

const toast = useToast()
const {$api} = useNuxtApp()

const emit = defineEmits(['newRoleAdded'])
watch(isOpen, async (val) => {
  if (val) {
    const hasPermission = user.can(['role.create'])
    if (!hasPermission) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'You do not have permission to create a new role',
        life: 10000
      })
      isOpen.value = false
    } else {
      const data = await $api<ApiResponse<Privilege[]>>('privileges')
      privileges.value = data.data || []
    }
  }
})

const privileges = ref<Privilege[]>([])

const data = reactive({
  name: '',
  privileges: []
})

const canSubmit = computed(() => data.name.length > 0 && data.privileges.length > 0)

const handleSubmit = async () => {
  if (!canSubmit.value) return
  try {
    const response = await $api<ApiResponse<RoleWithPrivileges>>('roles', {
      method: 'POST',
      body: data
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
        detail: 'Role added successfully',
        life: 5000
      })
      emit('newRoleAdded')
      isOpen.value = false
    }
  } catch (e) {
    console.log(e)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while adding the role',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Add New Role" :style="{ width: '25rem' }">
    <div class="flex flex-col items-center justify-center gap-8 py-8 w-full ">
      <FloatLabel class="w-full">
        <InputText v-model="data.name" class="w-full" id="name"/>
        <label for="name">Role Name</label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <MultiSelect
            :loading="!privileges"
            display="chip"
            filter
            id="privileges"
            v-model="data.privileges"
            :options="privileges"
            option-label="label"
            option-value="id"
            checkmark
            class="w-full"/>
        <label for="privileges">
          Privileges
        </label>
      </FloatLabel>

    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Close" @click="isOpen = false" severity="secondary"></Button>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Save"
                class="bg-green-500 text-white"></Button>
      </div>
    </template>

  </Dialog>
</template>