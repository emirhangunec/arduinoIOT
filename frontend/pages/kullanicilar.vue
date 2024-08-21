<script setup lang="ts">
import type {RoleWithPrivileges, UserWithRoleAndPrivileges} from "PrismaTypes";
import AddUser from "~/components/AddUser.vue";
import EditUser from "~/components/EditUser.vue";
import DeleteUser from "~/components/DeleteUser.vue";

definePageMeta({
  layout: 'admin-layout',
  middleware: to => {
    const user = useAuthStore()
    if (!user.can('user.read')) return navigateTo('/?message=no_permission')
  }
})
const user = useAuthStore()

const isRoleDetailDialogVisible = ref(false)
const roleDetail = ref<RoleWithPrivileges>()
const showRoleDetailDialog = (role: RoleWithPrivileges) => {
  roleDetail.value = role
  isRoleDetailDialogVisible.value = true
}

const isAddNewUserDialogVisible = ref(false)
const addNewUser = () => {
  isAddNewUserDialogVisible.value = true
}

const isEditUserDialogVisible = ref(false)
const userToEdit = ref<UserWithRoleAndPrivileges>()
const editUser = (user: UserWithRoleAndPrivileges) => {
  userToEdit.value = user
  isEditUserDialogVisible.value = true
}

const isDeleteUserDialogVisible = ref(false)
const userToDelete = ref<UserWithRoleAndPrivileges>()
const deleteUser = (user: UserWithRoleAndPrivileges) => {
  userToDelete.value = user
  isDeleteUserDialogVisible.value = true
}


const {data: users, status, error, refresh} = useApi<ApiResponse<UserWithRoleAndPrivileges[]>>('users')

</script>
<template>
  <AddUser @new-user-added="refresh()" v-model:is-open="isAddNewUserDialogVisible"/>
  <EditUser :user="userToEdit" @user-edited="refresh()" v-model:is-open="isEditUserDialogVisible"/>
  <DeleteUser :user="userToDelete" @user-deleted="refresh()" v-model:is-open="isDeleteUserDialogVisible"/>
  <Dialog v-model:visible="isRoleDetailDialogVisible" modal header="Rol Detaylari" :style="{ width: '25rem' }">
    <div v-if="roleDetail">
      <div class="flex gap-2">
        <span class="font-bold">Rol:</span>
        <span>{{ roleDetail.name }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <span class="font-bold">Yetkiler:</span>
        <div class="flex gap-2 flex-wrap">
          <span v-for="privilege in roleDetail.privileges" :key="privilege.id"
                class="bg-gray-200 text-gray-800 px-2 py-1 rounded">{{ privilege.label }}
          </span>

        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Kapat" @click="isRoleDetailDialogVisible = false"></Button>
    </div>
  </Dialog>
  <DataTable class="!h-full w-full"
             :value="users?.data"
             :loading="!users"
             size="large"
             striped-rows
             show-gridlines
             row-hover
             paginator
             :rows="10"
             :rows-per-page-options="[10, 25, 50, 100]"
             removableSort
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <span class="text-xl font-bold">Kullanicilar</span>
        <div class="flex items-center justify-center gap-2">
          <Button @click="addNewUser" v-if="user.can(['user.create','role.read'])" icon="pi pi-plus" rounded
                  raised class="bg-blue-500 text-white"/>
          <Button icon="pi pi-refresh" @click="refresh()" rounded raised link/>
        </div>
      </div>
    </template>
    <Column sortable field="name" header="İsim Soyisim"></Column>
    <Column sortable field="email" header="E-posta Adresi"></Column>
    <Column sortable field="role.name" header="Role">
      <template #body="{data}">
        <div class="flex items-center justify-between gap-2 ">
          <span>{{ data.role.name }}</span>
          <Button icon="pi pi-eye" icon-pos="right" severity="secondary"
                  v-if="user.can('role.read')"
                  @click="showRoleDetailDialog(data.role)"/>

        </div>
      </template>
    </Column>
    <Column header="İşlemler">
      <template #body="{data}">
        <div class="flex gap-2">
          <Button icon="pi pi-pencil" severity="info" v-if="user.can('user.update')" @click="editUser(data)"/>
          <Button icon="pi pi-trash" severity="danger" v-if="user.can('user.delete')" :disabled="data.role.id==='1'" @click="deleteUser(data)"/>
        </div>
      </template>
    </Column>

  </DataTable>

</template>

<style>

</style>