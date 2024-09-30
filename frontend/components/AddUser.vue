<script setup lang="ts">
import type {RoleWithPrivileges} from "PrismaTypes";

const user = useAuthStore()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})
const emit = defineEmits(['new-user-added'])
const toast = useToast()
const {$api} = useNuxtApp()

watch(isOpen, async (val) => {
  if (val) {
    const userCanReadRoles = user.can('role.read')
    if (!userCanReadRoles) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'You do not have permission to create a new user',
        life: 10000
      })
      isOpen.value = false
    } else {
      const data = await $api<ApiResponse<RoleWithPrivileges[]>>('roles')
      roles.value = data.data || []
    }
  }
})

const onNewRoleAdded = async () => {
  const data = await $api<ApiResponse<RoleWithPrivileges[]>>('roles')
  roles.value = data.data || []

  state.roleId = roles.value[roles.value.length - 1].id
}

const roles = ref<RoleWithPrivileges[]>([])

const state =reactive({
  name: '',
  email: '',
  password: '',
  roleId: ''
})

const canSubmit = computed(() => state.name.length > 0 && state.email.length > 0 && state.password.length > 0 && state.roleId.length > 0)
const handleSubmit = async () => {
  if (!canSubmit.value) return
  try {
    const response = await $api<ApiResponse<RoleWithPrivileges>>('users', {
      method: 'POST',
      body: state
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
        detail: 'User added successfully',
        life: 5000
      })
      emit('new-user-added')
      isOpen.value = false
    }
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An error occurred while adding the user',
      life: 10000
    })
  }
}

const isNewRoleDialogVisible = ref(false)
const showNewRoleDialog = () => {
  isNewRoleDialogVisible.value = true
}
</script>

<template>
  <AddRole @new-role-added="onNewRoleAdded" v-model:is-open="isNewRoleDialogVisible"/>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Add New User" :style="{ width: '25rem' }">
    <div class="flex flex-col items-center justify-center gap-8 py-8 w-full ">
      <FloatLabel class="w-full">
        <InputText v-model="state.name" class="w-full" id="name"/>
        <label for="name">
          Full Name
        </label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <InputText v-model="state.email" id="email" type="email" class="w-full" />
        <label for="email">
          Email
        </label>
      </FloatLabel>
      <FloatLabel class="w-full" >
        <InputText id="password" v-model="state.password" type="password" class="w-full" />
        <label for="password">
          Password
        </label>
      </FloatLabel>
      <div class="flex w-full gap-2 items-center justify-stretch">
        <FloatLabel class="w-full">
          <Select id="role"
                  v-model="state.roleId"
                  :options="roles.filter(role => role.id !== '1')"
                  option-label="name"
                  option-value="id"
                  filter
                  checkmark
           class="w-full" />
          <label for="role">
            Role
          </label>
        </FloatLabel>
        <Button v-if="user.can('role.create')" type="button" @click="showNewRoleDialog" severity="info" icon="pi pi-plus"/>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Close" @click="isOpen = false" severity="secondary"></Button>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Save" class="bg-green-500 text-white"></Button>
      </div>
    </template>

  </Dialog>
</template>