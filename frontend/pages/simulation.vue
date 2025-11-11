<script setup lang="ts">
import type {RoomWithOpenHoursAndDeviceAndUsers} from "PrismaTypes";

definePageMeta({
  layout: false,
})

const {$api, $socket} = useNuxtApp()
const devicesStore = useDevicesStore()
const toast = useToast()

// Track last command received from management
const lastCommand = ref<{type: string, value: any, timestamp: number} | null>(null)
const currentTime = ref(Date.now())

// Update current time for reactive highlighting
const timeInterval = setInterval(() => {
  currentTime.value = Date.now()
}, 100)

// Check if a command was recently received (for visual highlight)
const isCommandRecent = (type: string) => {
  if (!lastCommand.value || lastCommand.value.type !== type) return false
  return currentTime.value - lastCommand.value.timestamp < 2000
}

// Get first available room for simulation
const {data: roomsResponse, status: roomsStatus, error: roomsError} = useApi<{message: string, data: RoomWithOpenHoursAndDeviceAndUsers[]}>('rooms')
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
const selectedRoom = ref<RoomWithOpenHoursAndDeviceAndUsers | null>(null)
const deviceId = computed(() => selectedRoom.value?.device?.id ?? '')
const deviceStatus = computed(() => devicesStore.getDeviceStatus(deviceId.value))

// Simulation controls - allow sending sensor data
const windowStatus = ref(false)
const electricityStatus = ref(false)
const heatingStatus = ref(false)
const lightStatus = ref(false)
const temperature = ref(20)

// WebSocket connection for IoT device
const iotSocket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const deviceConnectedId = ref<string>('')

// Room selection
const showRoomSelector = ref(false)
const selectedFloor = ref<string>('1')
const selectedRoomNumber = ref<string>('1')

// Filter rooms by floor
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

// Get floors list
const floors = computed(() => {
  return Object.keys(roomsByFloor.value).sort((a, b) => parseInt(a) - parseInt(b))
})

// Select room function
const selectRoom = (room: RoomWithOpenHoursAndDeviceAndUsers) => {
  // Close existing connection
  if (iotSocket.value) {
    iotSocket.value.close()
    isConnected.value = false
  }
  
  selectedRoom.value = room
  deviceConnectedId.value = room.device?.id || `sim-device-${Date.now()}`
  showRoomSelector.value = false
  
  // Wait a bit for device status to be available
  nextTick(() => {
    const status = devicesStore.getDeviceStatus(deviceConnectedId.value)
    if (status) {
      windowStatus.value = status.windowStatus || false
      electricityStatus.value = status.electricityStatus || false
      heatingStatus.value = status.heatingStatus || false
      lightStatus.value = status.lightStatus || false
      temperature.value = status.temperature || 20
    } else {
      // Initialize device status in store if not exists
      if (room.device) {
        devicesStore.deviceStatus.push({
          deviceId: deviceConnectedId.value,
          windowStatus: false,
          electricityStatus: false,
          heatingStatus: false,
          lightStatus: false,
          temperature: 20,
          isBusy: false
        })
      }
      // Default values
      windowStatus.value = false
      electricityStatus.value = false
      heatingStatus.value = false
      lightStatus.value = false
      temperature.value = 20
    }
    
    // Connect to IoT WebSocket
    connectToIoT()
  })
}

// Connect to IoT WebSocket
const connectToIoT = () => {
  const runtimeConfig = useRuntimeConfig()
  const backendUrl = runtimeConfig.public.iotWebsocketUrl?.replace('http://', '') || runtimeConfig.public.backendUrl?.replace('http://', '') || 'localhost:3001'
  iotSocket.value = new WebSocket(`ws://${backendUrl}/iot`)
  
  iotSocket.value.onopen = () => {
    isConnected.value = true
    // Send device ID
    iotSocket.value?.send(`id:${deviceConnectedId.value}`)
    console.log('[IoT WS] Connected as device:', deviceConnectedId.value)
  }
    
  iotSocket.value.onmessage = (event) => {
    const message = event.data.toString()
    console.log('[IoT WS] Received:', message)
    
    // Parse commands from management panel
    const [command, value] = message.split(':')
    
    switch (command) {
      case 'electricity':
        const newElectricityStatus = parseInt(value) === 1
        if (electricityStatus.value !== newElectricityStatus) {
          electricityStatus.value = newElectricityStatus
          lastCommand.value = {type: 'electricity', value: newElectricityStatus, timestamp: Date.now()}
          toast.add({
            severity: 'info',
            summary: 'Yönetim Paneli Komutu',
            detail: `Elektrik ${newElectricityStatus ? 'açıldı' : 'kapatıldı'}`,
            life: 3000
          })
        }
        // Update device status in store if available
        if (deviceStatus.value) {
          const status = devicesStore.deviceStatus.find(s => s.deviceId === deviceId.value)
          if (status) {
            status.electricityStatus = electricityStatus.value
          }
        }
        break
      case 'heating':
        const newHeatingStatus = parseInt(value) === 1
        if (heatingStatus.value !== newHeatingStatus) {
          heatingStatus.value = newHeatingStatus
          lastCommand.value = {type: 'heating', value: newHeatingStatus, timestamp: Date.now()}
          toast.add({
            severity: 'info',
            summary: 'Yönetim Paneli Komutu',
            detail: `Isıtma ${newHeatingStatus ? 'açıldı' : 'kapatıldı'}`,
            life: 3000
          })
        }
        if (deviceStatus.value) {
          const status = devicesStore.deviceStatus.find(s => s.deviceId === deviceId.value)
          if (status) {
            status.heatingStatus = heatingStatus.value
          }
        }
        break
      case 'light':
        const newLightStatus = parseInt(value) === 1
        if (lightStatus.value !== newLightStatus) {
          lightStatus.value = newLightStatus
          lastCommand.value = {type: 'light', value: newLightStatus, timestamp: Date.now()}
          toast.add({
            severity: 'info',
            summary: 'Yönetim Paneli Komutu',
            detail: `Işık ${newLightStatus ? 'açıldı' : 'kapatıldı'}`,
            life: 3000
          })
        }
        if (deviceStatus.value) {
          const status = devicesStore.deviceStatus.find(s => s.deviceId === deviceId.value)
          if (status) {
            status.lightStatus = lightStatus.value
          }
        }
        break
      case 'temperature':
        // Temperature updates from management (if needed)
        break
      default:
        // Other messages like ping, etc.
        break
    }
  }
  
  iotSocket.value.onclose = () => {
    isConnected.value = false
    console.log('[IoT WS] Connection closed')
  }
  
  iotSocket.value.onerror = (error) => {
    console.error('[IoT WS] Error:', error)
  }
}

// Watch for rooms to load and auto-select first room
watch([rooms, roomsStatus], () => {
  if (roomsStatus.value === 'success' && rooms.value.length > 0 && !selectedRoom.value) {
    selectRoom(rooms.value[0])
  }
}, { immediate: true })

// Send sensor updates
const sendWindowStatus = () => {
  if (iotSocket.value && isConnected.value) {
    iotSocket.value.send(`window:${windowStatus.value ? 1 : 0}`)
  }
}

const sendElectricityStatus = () => {
  if (iotSocket.value && isConnected.value) {
    iotSocket.value.send(`electricity:${electricityStatus.value ? 1 : 0}`)
  }
}

const sendHeatingStatus = () => {
  if (iotSocket.value && isConnected.value) {
    iotSocket.value.send(`heating:${heatingStatus.value ? 1 : 0}`)
  }
}

const sendLightStatus = () => {
  if (iotSocket.value && isConnected.value) {
    iotSocket.value.send(`light:${lightStatus.value ? 1 : 0}`)
  }
}

const sendTemperature = () => {
  if (iotSocket.value && isConnected.value) {
    iotSocket.value.send(`temperature:${temperature.value}`)
  }
}

// Auto-send temperature updates
watch(temperature, () => {
  sendTemperature()
})

onUnmounted(() => {
  if (iotSocket.value) {
    iotSocket.value.close()
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
    <Toast />
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Simülasyon Cihazı</h1>
            <p class="text-gray-600" v-if="selectedRoom">
              {{ selectedRoom.name }} - Kat {{ selectedRoom.floor }}, Oda {{ selectedRoom.doorNumber }}
            </p>
          </div>
          <div class="flex items-center gap-4">
            <Button 
              label="Oda Seç" 
              icon="pi pi-building" 
              @click="showRoomSelector = true"
              outlined
            />
            <div class="flex items-center gap-2">
              <div 
                class="w-3 h-3 rounded-full"
                :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"
              ></div>
              <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
                {{ isConnected ? 'Bağlı' : 'Bağlantı Yok' }}
              </span>
            </div>
            <Button 
              label="Ana Sayfa" 
              icon="pi pi-home" 
              @click="navigateTo('/')"
              outlined
            />
          </div>
        </div>
      </div>

      <!-- Sensor Cards -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6" v-if="selectedRoom">
        <!-- Window Sensor -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Pencere Durumu</h3>
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div class="flex items-center gap-4">
            <ToggleSwitch v-model="windowStatus" @update:modelValue="sendWindowStatus" />
            <span class="text-lg font-medium" :class="windowStatus ? 'text-green-600' : 'text-red-600'">
              {{ windowStatus ? 'Kapalı' : 'Açık' }}
            </span>
          </div>
        </div>

        <!-- Electricity Control -->
        <div 
          class="bg-white rounded-lg shadow-md p-6 transition-all duration-300"
          :class="isCommandRecent('electricity') ? 'ring-4 ring-blue-400 shadow-lg' : ''"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Elektrik</h3>
            <svg class="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="flex items-center gap-4">
            <ToggleSwitch v-model="electricityStatus" @update:modelValue="sendElectricityStatus" />
            <span class="text-lg font-medium" :class="electricityStatus ? 'text-green-600' : 'text-red-600'">
              {{ electricityStatus ? 'Açık' : 'Kapalı' }}
            </span>
          </div>
        </div>

        <!-- Heating Control -->
        <div 
          class="bg-white rounded-lg shadow-md p-6 transition-all duration-300"
          :class="isCommandRecent('heating') ? 'ring-4 ring-red-400 shadow-lg' : ''"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Isıtma</h3>
            <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="flex items-center gap-4">
            <ToggleSwitch v-model="heatingStatus" @update:modelValue="sendHeatingStatus" />
            <span class="text-lg font-medium" :class="heatingStatus ? 'text-green-600' : 'text-red-600'">
              {{ heatingStatus ? 'Açık' : 'Kapalı' }}
            </span>
          </div>
        </div>

        <!-- Light Control -->
        <div 
          class="bg-white rounded-lg shadow-md p-6 transition-all duration-300"
          :class="isCommandRecent('light') ? 'ring-4 ring-yellow-400 shadow-lg' : ''"
        >
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Işık</h3>
            <svg class="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div class="flex items-center gap-4">
            <ToggleSwitch v-model="lightStatus" @update:modelValue="sendLightStatus" />
            <span class="text-lg font-medium" :class="lightStatus ? 'text-green-600' : 'text-red-600'">
              {{ lightStatus ? 'Açık' : 'Kapalı' }}
            </span>
          </div>
        </div>

        <!-- Temperature Sensor -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Sıcaklık</h3>
            <svg class="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div class="space-y-4">
            <div class="text-4xl font-bold text-blue-600">
              {{ temperature.toFixed(1) }}°C
            </div>
            <div class="flex items-center gap-4">
              <InputNumber 
                v-model="temperature" 
                :min="10" 
                :max="35" 
                :step="0.1"
                @update:modelValue="sendTemperature"
                class="flex-1"
              />
              <Button 
                icon="pi pi-send" 
                @click="sendTemperature"
                label="Gönder"
                outlined
              />
            </div>
          </div>
        </div>

        <!-- Room Info -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-gray-800">Oda Bilgileri</h3>
            <svg class="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div class="space-y-2 text-gray-600">
            <div><span class="font-semibold">İsim:</span> {{ selectedRoom.name }}</div>
            <div><span class="font-semibold">Kat:</span> {{ selectedRoom.floor }}</div>
            <div><span class="font-semibold">Oda No:</span> {{ selectedRoom.doorNumber }}</div>
            <div><span class="font-semibold">Sektör:</span> {{ selectedRoom.sector }}</div>
            <div><span class="font-semibold">Cihaz ID:</span> {{ deviceConnectedId }}</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="bg-white rounded-lg shadow-md p-12 text-center">
        <div class="text-gray-500" v-if="roomsStatus === 'pending'">Odalar yükleniyor...</div>
        <div class="text-red-500" v-else-if="roomsStatus === 'error'">
          <div>Odalar yüklenirken hata oluştu</div>
          <div class="text-sm mt-2" v-if="roomsError">{{ roomsError.message || 'Bilinmeyen hata' }}</div>
        </div>
        <div class="text-gray-500" v-else-if="rooms.length === 0">Oda bulunamadı</div>
      </div>
    </div>

    <!-- Room Selector Dialog -->
    <Dialog 
      v-model:visible="showRoomSelector" 
      modal 
      header="Oda Seç" 
      :style="{ width: '600px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Kat Seç</label>
          <Dropdown 
            v-model="selectedFloor" 
            :options="floors" 
            placeholder="Kat seçin"
            class="w-full"
          />
        </div>
        
        <div v-if="roomsByFloor[selectedFloor]" class="grid grid-cols-5 gap-2 max-h-96 overflow-y-auto">
          <div
            v-for="room in roomsByFloor[selectedFloor]"
            :key="room.id"
            @click="selectRoom(room)"
            class="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition-colors"
            :class="selectedRoom?.id === room.id ? 'bg-blue-100 border-blue-500' : ''"
          >
            <div class="text-sm font-semibold">{{ room.name }}</div>
            <div class="text-xs text-gray-500">Oda {{ room.doorNumber }}</div>
            <div class="text-xs text-gray-400">{{ room.sector }}</div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-8">
          Bu katta oda bulunamadı
        </div>
      </div>
      <template #footer>
        <Button label="İptal" @click="showRoomSelector = false" outlined />
      </template>
    </Dialog>
  </div>
</template>

