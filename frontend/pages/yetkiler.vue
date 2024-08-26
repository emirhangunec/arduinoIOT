<script setup lang="ts">

import type {RoleWithPrivileges} from "PrismaTypes";
definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.can('role.read')) return navigateTo('/?message=no_permission')
  }
})
const user = useAuthStore()
const userCanDoAnyAction = computed(() => user.can('role.update') || user.can('role.delete'))

const {data: roles, status, error, refresh} = useApi<ApiResponse<RoleWithPrivileges[]>>('roles')

const isRoleDetailDialogVisible = ref(false)
const roleDetail = ref<RoleWithPrivileges>()
const showRoleDetailDialog = (role: RoleWithPrivileges) => {
  roleDetail.value = role
  isRoleDetailDialogVisible.value = true
}

const isAddNewRoleDialogVisible = ref(false)
const addNewRole = () => {
  isAddNewRoleDialogVisible.value = true
}

const isEditRoleDialogVisible = ref(false)
const roleToEdit = ref<RoleWithPrivileges>()
const editRole = (role: RoleWithPrivileges) => {
  roleToEdit.value = role
  isEditRoleDialogVisible.value = true
}

const isDeleteRoleDialogVisible = ref(false)
const roleToDelete = ref<RoleWithPrivileges>()
const deleteRole = (role: RoleWithPrivileges) => {
  roleToDelete.value = role
  isDeleteRoleDialogVisible.value = true
}

</script>

<template>
  <AddRole @new-role-added="refresh()" v-model:is-open="isAddNewRoleDialogVisible"/>
  <EditRole :role="roleToEdit" @role-edited="refresh()" v-model:is-open="isEditRoleDialogVisible"/>
  <DeleteRole :role="roleToDelete" @role-deleted="refresh()" v-model:is-open="isDeleteRoleDialogVisible"/>
  <RoleDetailDialog :role="roleDetail" v-model:is-open="isRoleDetailDialogVisible"/>
  <DataTable class="!h-full w-full"
             :value="roles?.data"
             :loading="!roles"
             striped-rolocalws
             show-gridlines
             row-hover
             paginator
             :rows="10"
             :rows-per-page-options="[10, 25, 50, 100]"
             removableSort
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">Roller</span>
        <div class="flex items-center justify-center gap-2">
          <Button @click="addNewRole" v-if="user.can('role.create')" icon="pi pi-plus" rounded
                  raised class="bg-blue-500 text-white"/>
          <Button icon="pi pi-refresh" @click="refresh()" rounded raised link/>
        </div>
      </div>
    </template>
    <Column sortable field="name" header="Rol ismi"></Column>
    <Column sortable field="privileges" header="Yetkiler">
      <template #body="{data}">
        <div class="flex items-center justify-between gap-2 ">
          <span>{{ data.privileges.length }} adet yetki</span>
          <Button icon="pi pi-eye" icon-pos="right" severity="secondary"
                  v-if="user.can('role.read')"
                  @click="showRoleDetailDialog(data)"/>

        </div>
      </template>
    </Column>
    <Column v-if="userCanDoAnyAction" header="İşlemler">
      <template #body="{data}">
        <div class="flex gap-2">
          <Button icon="pi pi-pencil" severity="info" v-if="user.can('role.update')" :disabled="data.id==='1'" @click="editRole(data)"/>
          <Button icon="pi pi-trash" severity="danger" v-if="user.can('role.delete')" :disabled="data.id==='1'" @click="deleteRole(data)"/>
        </div>
      </template>
    </Column>

  </DataTable>

</template>