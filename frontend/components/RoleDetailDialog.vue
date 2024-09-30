<script setup lang="ts">

import type {RoleWithPrivileges} from "PrismaTypes";

interface RoleDetailDialogProps {
  role?: RoleWithPrivileges
}

const props = defineProps<RoleDetailDialogProps>()
const isOpen = defineModel('isOpen', {type: Boolean, default: false})

const roleDetail = computed(() => props.role)
</script>


<template>
  <Dialog dismissableMask v-model:visible="isOpen" modal header="Role Details" :style="{ width: '25rem' }">
    <div v-if="roleDetail">
      <div class="flex gap-2">
        <span class="font-bold">Role:</span>
        <span>{{ roleDetail.name }}</span>
      </div>
      <div class="flex flex-col gap-2">
        <span class="font-bold">
          Privileges:
        </span>
        <div class="flex gap-2 flex-wrap">
          <span v-for="privilege in roleDetail.privileges" :key="privilege.id"
                class="bg-gray-200 text-gray-800 px-2 py-1 rounded">{{ privilege.label }}
          </span>

        </div>
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Close" @click="isOpen = false"></Button>
    </div>
  </Dialog>
</template>