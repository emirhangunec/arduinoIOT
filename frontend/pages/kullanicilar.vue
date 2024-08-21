<script setup lang="ts">
import type {RoleWithPrivileges, UserWithRoleAndPrivileges} from "PrismaTypes";
import AddUser from "~/components/AddUser.vue";
import EditUser from "~/components/EditUser.vue";
import DeleteUser from "~/components/DeleteUser.vue";
import RoleDetailDialog from "~/components/RoleDetailDialog.vue";

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

const userCanDoAnyAction = computed(() =>user.can('user.update') || user.can('user.delete'))
</script>
<template>
  <AddUser @new-user-added="refresh()" v-model:is-open="isAddNewUserDialogVisible"/>
  <EditUser :user="userToEdit" @user-edited="refresh()" v-model:is-open="isEditUserDialogVisible"/>
  <DeleteUser :user="userToDelete" @user-deleted="refresh()" v-model:is-open="isDeleteUserDialogVisible"/>
 <RoleDetailDialog :role="roleDetail" v-model:is-open="isRoleDetailDialogVisible"/>
  <DataTable class="!h-full w-full"
             :value="users?.data"
             :loading="!users"

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
    <Column v-if="userCanDoAnyAction" header="İşlemler">
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