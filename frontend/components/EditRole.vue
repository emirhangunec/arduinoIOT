<script setup lang="ts">
import type {Privilege, RoleWithPrivileges} from "PrismaTypes";

const user = useAuthStore()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})
interface EditRoleProps {
  role?: RoleWithPrivileges
}
const props = defineProps<EditRoleProps>()
const role = computed(() => props.role)

const toast = useToast()
const {$api} = useNuxtApp()

const emit = defineEmits(['roleEdited'])
watch(isOpen, async (val) => {
  if (val) {
    const hasPermission = user.can(['role.update'])
    if (!hasPermission) {
      toast.add({
        severity: 'error',
        summary: 'Hata',
        detail: 'Rol duzenleyebilmek icin yetkiniz olmali, lutfen yonetici ile iletisime geciniz',
        life: 10000
      })
      isOpen.value = false
    } else {
      const data = await $api<ApiResponse<Privilege[]>>('privileges')
      privileges.value = data.data || []
      if (role.value) {
        state.name = role.value.name
        state.privileges = role.value.privileges.map(p => p.id)
      }
    }
  }
})

const privileges = ref<Privilege[]>([])

const state = reactive({
  name: '',
  privileges: [] as string[]
})

const canSubmit = computed(() => state.name.length > 0 && state.privileges.length > 0 && role.value && role.value.id)

const handleSubmit = async () => {
  if (!canSubmit.value || !role.value || !role.value.id) return
  try {
    const response = await $api<ApiResponse<RoleWithPrivileges>>(`roles/${role.value.id}`, {
      method: 'PUT',
      body: state
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
        detail: 'Rol basariyla duzenlendi',
        life: 5000
      })
      emit('roleEdited')
      isOpen.value = false
    }
  } catch (e) {
    console.log(e)
    toast.add({
      severity: 'error',
      summary: 'Hata',
      detail: 'Rol duzenlenirken bir hata olustu',
      life: 10000
    })
  }
}


</script>

<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Rol Duzenle" :style="{ width: '25rem' }">
    <div class="flex flex-col items-center justify-center gap-8 py-8 w-full ">
      <FloatLabel class="w-full">
        <InputText v-model="state.name" class="w-full" id="name"/>
        <label for="name">Rol ismi</label>
      </FloatLabel>

      <FloatLabel class="w-full">
        <MultiSelect
            :loading="!privileges"
            display="chip"
            filter
            id="privileges"
            v-model="state.privileges"
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