<script setup lang="ts">
import type {RoomWithOpenHoursAndDeviceAndUsers} from "PrismaTypes";

definePageMeta({
  layout: false,
})

const {$api} = useNuxtApp()
const devicesStore = useDevicesStore()

// Get all rooms
const {data: roomsResponse, status: roomsStatus, error: roomsError, refresh} = useApi<{message: string, data: RoomWithOpenHoursAndDeviceAndUsers[]}>('rooms')
const rooms = computed(() => {
  if (!roomsResponse.value) {
    return []
  }
  // useFetch returns the response directly, so roomsResponse.value is already {message, data}
  if (typeof roomsResponse.value === 'object' && 'data' in roomsResponse.value) {
    return roomsResponse.value.data || []
  }
  return []
})

// Group rooms by floor
const roomsByFloor = computed(() => {
  const grouped: Record<string, RoomWithOpenHoursAndDeviceAndUsers[]> = {}
  rooms.value.forEach(room => {
    const floor = room.floor || '0'
    if (!grouped[floor]) {
      grouped[floor] = []
    }
    grouped[floor].push(room)
  })
  return grouped
})

// Selected floor for detailed view
const selectedFloor = ref<string | null>(null)
const searchQuery = ref('')

// Filter rooms by search
const filteredRooms = computed(() => {
  if (!searchQuery.value) return rooms.value
  const query = searchQuery.value.toLowerCase()
  return rooms.value.filter(room => 
    room.name.toLowerCase().includes(query) ||
    room.doorNumber?.toLowerCase().includes(query) ||
    room.floor?.toLowerCase().includes(query) ||
    room.sector?.toLowerCase().includes(query)
  )
})

// Get device status for a room
const getRoomDeviceStatus = (room: RoomWithOpenHoursAndDeviceAndUsers) => {
  if (!room.device) return null
  return devicesStore.getDeviceStatus(room.device.id)
}

// Control functions
const toggleRoomElectricity = (room: RoomWithOpenHoursAndDeviceAndUsers) => {
  if (!room.device) return
  devicesStore.toggleElectricity(room.device.id)
}

const toggleRoomHeating = (room: RoomWithOpenHoursAndDeviceAndUsers) => {
  if (!room.device) return
  devicesStore.toggleHeating(room.device.id)
}

const toggleRoomLight = (room: RoomWithOpenHoursAndDeviceAndUsers) => {
  if (!room.device) return
  devicesStore.toggleLight(room.device.id)
}

// Auto-refresh
onMounted(() => {
  setInterval(() => {
    refresh()
  }, 5000)
})

// Floor numbers for navigation
const floors = computed(() => {
  return Object.keys(roomsByFloor.value).sort((a, b) => parseInt(b) - parseInt(a))
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
    <!-- Header -->
    <div class="bg-white shadow-md sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800">Yönetim Paneli</h1>
            <p class="text-gray-600">20 Katlı Bina - {{ rooms.length }} Oda</p>
          </div>
          <div class="flex items-center gap-4">
            <IconField>
              <InputIcon>
                <i class="pi pi-search"/>
              </InputIcon>
              <InputText 
                v-model="searchQuery" 
                placeholder="Oda ara..." 
                class="w-64"
              />
            </IconField>
            <Button 
              label="Ana Sayfa" 
              icon="pi pi-home" 
              @click="navigateTo('/')"
              outlined
            />
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- Floor Navigation -->
      <div v-if="rooms.length > 0" class="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 class="text-xl font-semibold mb-4">Katlar ({{ floors.length }} kat)</h2>
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="floor in floors"
            :key="floor"
            :label="`Kat ${floor}`"
            :severity="selectedFloor === floor ? 'info' : 'secondary'"
            @click="selectedFloor = selectedFloor === floor ? null : floor"
            outlined
          />
          <Button
            label="Tümü"
            :severity="selectedFloor === null ? 'info' : 'secondary'"
            @click="selectedFloor = null"
            outlined
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="roomsStatus === 'pending'" class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-gray-500">Odalar yükleniyor...</div>
      </div>

      <!-- Error State -->
      <div v-else-if="roomsStatus === 'error'" class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-red-500 mb-2">Odalar yüklenirken hata oluştu</div>
        <div class="text-sm text-gray-500 mb-4" v-if="roomsError">{{ roomsError.message || 'Bilinmeyen hata' }}</div>
        <Button label="Yeniden Dene" @click="refresh()" class="mt-4" />
      </div>

      <!-- Empty State -->
      <div v-else-if="rooms.length === 0" class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-gray-500">Oda bulunamadı</div>
      </div>

      <!-- Rooms Grid -->
      <div v-else-if="searchQuery">
        <!-- Search Results -->
        <div class="mb-4 text-gray-600">
          "{{ searchQuery }}" için {{ filteredRooms.length }} sonuç bulundu
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="room in filteredRooms"
            :key="room.id"
            class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
            <!-- Room Card -->
            <div>
              <!-- Room Header -->
              <div class="mb-3">
                <h3 class="font-bold text-lg text-gray-800">{{ room.name }}</h3>
                <p class="text-sm text-gray-600">Oda {{ room.doorNumber }} - {{ room.sector }}</p>
              </div>

              <!-- Device Status -->
              <div v-if="room.device" class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Durum:</span>
                  <div class="flex items-center gap-1">
                    <div 
                      class="w-2 h-2 rounded-full"
                      :class="room.device.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
                    ></div>
                    <span class="text-xs" :class="room.device.isOnline ? 'text-green-600' : 'text-red-600'">
                      {{ room.device.isOnline ? 'Online' : 'Offline' }}
                    </span>
                  </div>
                </div>

                <!-- Window Status -->
                <div v-if="room.device.hasWindowSensor && getRoomDeviceStatus(room)" class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Pencere:</span>
                  <span :class="getRoomDeviceStatus(room)?.windowStatus ? 'text-green-600' : 'text-red-600'">
                    {{ getRoomDeviceStatus(room)?.windowStatus ? 'Kapalı' : 'Açık' }}
                  </span>
                </div>

                <!-- Temperature -->
                <div v-if="getRoomDeviceStatus(room)" class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Sıcaklık:</span>
                  <span class="font-semibold text-blue-600">
                    {{ getRoomDeviceStatus(room)?.temperature?.toFixed(1) || 'N/A' }}°C
                  </span>
                </div>

                <!-- Controls -->
                <div class="pt-2 border-t border-gray-200 space-y-2">
                  <!-- Electricity -->
                  <div v-if="room.device.hasElectricityControl" class="flex items-center justify-between">
                    <span class="text-xs text-gray-600">Elektrik</span>
                    <ToggleSwitch 
                      :modelValue="getRoomDeviceStatus(room)?.electricityStatus || false"
                      @update:modelValue="toggleRoomElectricity(room)"
                      :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                    />
                  </div>

                  <!-- Heating -->
                  <div v-if="room.device.hasHeaterControl" class="flex items-center justify-between">
                    <span class="text-xs text-gray-600">Isıtma</span>
                    <ToggleSwitch 
                      :modelValue="getRoomDeviceStatus(room)?.heatingStatus || false"
                      @update:modelValue="toggleRoomHeating(room)"
                      :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                    />
                  </div>

                  <!-- Light -->
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-600">Işık</span>
                    <ToggleSwitch 
                      :modelValue="getRoomDeviceStatus(room)?.lightStatus || false"
                      @update:modelValue="toggleRoomLight(room)"
                      :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                    />
                  </div>
                </div>
              </div>

              <!-- No Device -->
              <div v-else class="text-center py-4">
                <span class="text-sm text-red-500">Cihaz Yok</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <!-- Floor-based View -->
        <div v-for="floor in floors" :key="floor">
          <div v-if="!selectedFloor || selectedFloor === floor" class="mb-8">
            <div class="bg-white rounded-lg shadow-md p-4 mb-4">
              <h2 class="text-2xl font-bold text-gray-800 mb-2">Kat {{ floor }}</h2>
              <p class="text-gray-600">{{ roomsByFloor[floor]?.length || 0 }} oda</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              <div
                v-for="room in roomsByFloor[floor]"
                :key="room.id"
                class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                <!-- Room Card -->
                <div>
                  <!-- Room Header -->
                  <div class="mb-3">
                    <h3 class="font-bold text-lg text-gray-800">{{ room.name }}</h3>
                    <p class="text-sm text-gray-600">Oda {{ room.doorNumber }} - {{ room.sector }}</p>
                  </div>

                  <!-- Device Status -->
                  <div v-if="room.device" class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-sm text-gray-600">Durum:</span>
                      <div class="flex items-center gap-1">
                        <div 
                          class="w-2 h-2 rounded-full"
                          :class="room.device.isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
                        ></div>
                        <span class="text-xs" :class="room.device.isOnline ? 'text-green-600' : 'text-red-600'">
                          {{ room.device.isOnline ? 'Online' : 'Offline' }}
                        </span>
                      </div>
                    </div>

                    <!-- Window Status -->
                    <div v-if="room.device.hasWindowSensor && getRoomDeviceStatus(room)" class="flex items-center justify-between text-sm">
                      <span class="text-gray-600">Pencere:</span>
                      <span :class="getRoomDeviceStatus(room)?.windowStatus ? 'text-green-600' : 'text-red-600'">
                        {{ getRoomDeviceStatus(room)?.windowStatus ? 'Kapalı' : 'Açık' }}
                      </span>
                    </div>

                    <!-- Temperature -->
                    <div v-if="getRoomDeviceStatus(room)" class="flex items-center justify-between text-sm">
                      <span class="text-gray-600">Sıcaklık:</span>
                      <span class="font-semibold text-blue-600">
                        {{ getRoomDeviceStatus(room)?.temperature?.toFixed(1) || 'N/A' }}°C
                      </span>
                    </div>

                    <!-- Controls -->
                    <div class="pt-2 border-t border-gray-200 space-y-2">
                      <!-- Electricity -->
                      <div v-if="room.device.hasElectricityControl" class="flex items-center justify-between">
                        <span class="text-xs text-gray-600">Elektrik</span>
                        <ToggleSwitch 
                          :modelValue="getRoomDeviceStatus(room)?.electricityStatus || false"
                          @update:modelValue="toggleRoomElectricity(room)"
                          :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                        />
                      </div>

                      <!-- Heating -->
                      <div v-if="room.device.hasHeaterControl" class="flex items-center justify-between">
                        <span class="text-xs text-gray-600">Isıtma</span>
                        <ToggleSwitch 
                          :modelValue="getRoomDeviceStatus(room)?.heatingStatus || false"
                          @update:modelValue="toggleRoomHeating(room)"
                          :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                        />
                      </div>

                      <!-- Light -->
                      <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-600">Işık</span>
                        <ToggleSwitch 
                          :modelValue="getRoomDeviceStatus(room)?.lightStatus || false"
                          @update:modelValue="toggleRoomLight(room)"
                          :disabled="!room.device.isOnline || devicesStore.isDeviceBusy(room.device.id)"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- No Device -->
                  <div v-else class="text-center py-4">
                    <span class="text-sm text-red-500">Cihaz Yok</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

