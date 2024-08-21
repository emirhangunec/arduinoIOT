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
        summary: 'Hata',
        detail: 'Rol ekleyebilmek icin yetkiniz olmali, lutfen yonetici ile iletisime geciniz',
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
        summary: 'Hata',
        detail: response.error,
        life: 10000
      })
    } else {
      toast.add({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Rol basariyla eklendi',
        life: 5000
      })
      emit('newRoleAdded')
      isOpen.value = false
    }
  } catch (e) {
    console.log(e)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Rol eklerken bir hata olustu',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog v-model:visible="isOpen" modal header="Yeni Rol Ekle" :style="{ width: '25rem' }">
    <div class="flex flex-col items-center justify-center gap-8 py-8 w-full ">
      <FloatLabel class="w-full">
        <InputText v-model="data.name" class="w-full" id="name"/>
        <label for="name">Rol ismi</label>
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
        <label for="privileges">Yetkiler</label>
      </FloatLabel>

    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Kapat" @click="isOpen = false" severity="secondary"></Button>
        <Button :disabled="!canSubmit" @click="handleSubmit" type="button" label="Kaydet"
                class="bg-green-500 text-white"></Button>
      </div>
    </template>

  </Dialog>
</template>