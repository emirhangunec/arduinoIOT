<script setup lang="ts">
import type {RoomWithOpenHoursAndDeviceAndUsers} from "PrismaTypes";

definePageMeta({
  layout: false,
})

const {$api, $socket} = useNuxtApp()
const devicesStore = useDevicesStore()
const toast = useToast()

// Track last command received from management or schedule
const lastCommand = ref<{type: string, value: any, timestamp: number, origin: 'schedule' | 'management' | 'device'} | null>(null)
const currentTime = ref(Date.now())

// Update current time for reactive highlighting
const timeInterval = setInterval(() => {
  currentTime.value = Date.now()
}, 100)

// Highlight helper for recent commands
const scheduleHighlightClasses: Record<string, string> = {
  electricity: 'ring-4 ring-blue-400 shadow-lg',
  heating: 'ring-4 ring-red-400 shadow-lg',
  light: 'ring-4 ring-yellow-400 shadow-lg'
}

const managementHighlightClasses: Record<string, string> = {
  electricity: 'ring-2 ring-blue-200 shadow',
  heating: 'ring-2 ring-red-200 shadow',
  light: 'ring-2 ring-yellow-200 shadow'
}

const getCommandHighlightClass = (type: 'electricity' | 'heating' | 'light') => {
  if (!lastCommand.value || lastCommand.value.type !== type) return ''
  if (currentTime.value - lastCommand.value.timestamp >= 2000) return ''
  if (lastCommand.value.origin === 'schedule') {
    return scheduleHighlightClasses[type] || ''
  }
  if (lastCommand.value.origin === 'management') {
    return managementHighlightClasses[type] || ''
  }
  return ''
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
    
    // Schedule worker will check schedule when device connects
    // Wait a bit for backend to process the connection
    setTimeout(() => {
      console.log('[IoT WS] Device connected, schedule will be applied automatically if configured')
    }, 3000)

    startTemperatureSimulation()
  }
    
  iotSocket.value.onmessage = (event) => {
    const message = event.data.toString()
    console.log('[IoT WS] Received:', message)
    
    // Parse commands from management panel or schedule
    const [command, value, meta] = message.split(':')
    const origin: 'schedule' | 'management' | 'device' = meta === 'schedule' ? 'schedule' : meta === 'management' ? 'management' : 'device'
    
    switch (command) {
      case 'electricity':
        const newElectricityStatus = parseInt(value) === 1
        if (electricityStatus.value !== newElectricityStatus) {
          electricityStatus.value = newElectricityStatus
          lastCommand.value = {type: 'electricity', value: newElectricityStatus, timestamp: Date.now(), origin}
          if (origin !== 'device') {
            toast.add({
              severity: 'info',
              summary: origin === 'schedule' ? 'Çizelge Komutu' : 'Yönetim Paneli Komutu',
              detail: `Elektrik ${newElectricityStatus ? 'açıldı' : 'kapatıldı'}`,
              life: 3000
            })
          }
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
          lastCommand.value = {type: 'heating', value: newHeatingStatus, timestamp: Date.now(), origin}
          if (origin !== 'device') {
            toast.add({
              severity: 'info',
              summary: origin === 'schedule' ? 'Çizelge Komutu' : 'Yönetim Paneli Komutu',
              detail: `Isıtma ${newHeatingStatus ? 'açıldı' : 'kapatıldı'}`,
              life: 3000
            })
          }
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
          lastCommand.value = {type: 'light', value: newLightStatus, timestamp: Date.now(), origin}
          if (origin !== 'device') {
            toast.add({
              severity: 'info',
              summary: origin === 'schedule' ? 'Çizelge Komutu' : 'Yönetim Paneli Komutu',
              detail: `Işık ${newLightStatus ? 'açıldı' : 'kapatıldı'}`,
              life: 3000
            })
          }
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
    if (temperatureSimulationInterval) {
      clearInterval(temperatureSimulationInterval)
      temperatureSimulationInterval = null
    }
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

const sendTemperature = (value?: number) => {
  if (iotSocket.value && isConnected.value) {
    const tempToSend = typeof value === 'number' ? value : temperature.value
    iotSocket.value.send(`temperature:${tempToSend}`)
  }
}

const updateTemperature = (value: number | null | undefined, source: 'manual' | 'simulation' = 'manual') => {
  if (value === null || value === undefined || Number.isNaN(value)) return
  const clamped = Math.max(15, Math.min(35, value))
  const rounded = Number(clamped.toFixed(2))
  temperature.value = rounded
  sendTemperature(rounded)
  const status = devicesStore.deviceStatus.find(s => s.deviceId === deviceId.value)
  if (status) {
    status.temperature = rounded
  }
}

let temperatureSimulationInterval: ReturnType<typeof setInterval> | null = null

const startTemperatureSimulation = () => {
  if (temperatureSimulationInterval) {
    clearInterval(temperatureSimulationInterval)
  }
  temperatureSimulationInterval = setInterval(() => {
    const current = temperature.value
    const ambient = 22 + Math.sin(Date.now() / 600000) * 0.5
    let delta = (Math.random() - 0.5) * 0.1

    if (electricityStatus.value && heatingStatus.value) {
      delta += 0.4 + Math.random() * 0.2
    } else {
      if (current > ambient) {
        delta -= 0.15 + Math.random() * 0.1
      } else {
        delta += (Math.random() - 0.5) * 0.05
      }
    }

    const nextTemperature = Math.max(15, Math.min(35, current + delta))
    updateTemperature(nextTemperature, 'simulation')
  }, 5000)
}

onUnmounted(() => {
  if (iotSocket.value) {
    iotSocket.value.close()
  }
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (temperatureSimulationInterval) {
    clearInterval(temperatureSimulationInterval)
    temperatureSimulationInterval = null
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
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Akıllı Bina Yönetim Sistemi - Simülasyon</h1>
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

      <!-- 3D Room Visualization -->
      <div v-if="selectedRoom" class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Oda Görünümü</h2>
        <div class="relative bg-gradient-to-b from-blue-100 to-gray-100 rounded-lg p-8 min-h-[400px] overflow-hidden">
          <!-- Room Background -->
          <div class="absolute inset-0 bg-gradient-to-br from-sky-200 via-blue-50 to-gray-100"></div>
          
          <!-- Window -->
          <div class="absolute top-4 right-4 w-32 h-48 bg-gray-300 rounded-lg border-4 border-gray-400 shadow-lg" 
               :class="windowStatus ? 'bg-gray-800' : 'bg-sky-300'">
            <div class="absolute inset-0 flex items-center justify-center">
              <div v-if="windowStatus" class="text-white text-xs font-bold">KAPALI</div>
              <div v-else class="text-blue-800 text-xs font-bold">AÇIK</div>
            </div>
            <!-- Window frame -->
            <div class="absolute inset-2 border-2 border-gray-500"></div>
          </div>
          
          <!-- Light Bulb (ceiling) -->
          <div class="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div class="relative">
              <!-- Light cord -->
              <div class="w-1 h-16 bg-gray-600 mx-auto"></div>
              <!-- Bulb -->
              <div 
                class="w-16 h-16 rounded-full border-4 border-gray-400 transition-all duration-300"
                :class="lightStatus ? 'bg-yellow-300 shadow-[0_0_30px_20px_rgba(255,255,0,0.6)]' : 'bg-gray-200'"
              >
                <div v-if="lightStatus" class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 14h-1v-1h2v1zm0-4h-1v-1h2v1zm0-4h-1V7h2v1z"/>
                  </svg>
                </div>
                <div v-else class="absolute inset-0 flex items-center justify-center">
                  <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm0 14h-1v-1h2v1zm0-4h-1v-1h2v1zm0-4h-1V7h2v1z"/>
                  </svg>
                </div>
              </div>
              <!-- Light rays when on -->
              <div v-if="lightStatus" class="absolute top-full left-1/2 transform -translate-x-1/2 w-32 h-32">
                <div class="absolute inset-0 rounded-full" style="background: radial-gradient(circle, rgba(255,255,0,0.3) 0%, rgba(255,255,0,0.1) 50%, transparent 100%);"></div>
              </div>
            </div>
          </div>
          
          <!-- Heater (bottom left) -->
          <div class="absolute bottom-8 left-8">
            <div class="relative">
              <div 
                class="w-24 h-16 bg-gray-700 rounded-lg border-2 border-gray-800 shadow-lg transition-all duration-300"
                :class="heatingStatus ? 'bg-red-600 shadow-[0_0_20px_10px_rgba(239,68,68,0.5)]' : ''"
              >
                <div class="absolute inset-0 flex items-center justify-center">
                  <div v-if="heatingStatus" class="text-white text-xs font-bold">ISITMA AÇIK</div>
                  <div v-else class="text-gray-400 text-xs">KAPALI</div>
                </div>
                <!-- Heat waves when on -->
                <div v-if="heatingStatus" class="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <div class="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Electricity indicator (bottom right) -->
          <div class="absolute bottom-8 right-8">
            <div class="relative">
              <div 
                class="w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center"
                :class="electricityStatus ? 'bg-yellow-400 border-yellow-600 shadow-[0_0_25px_15px_rgba(234,179,8,0.6)]' : 'bg-gray-300 border-gray-500'"
              >
                <svg 
                  class="w-12 h-12 transition-all duration-300"
                  :class="electricityStatus ? 'text-yellow-800 animate-pulse' : 'text-gray-500'"
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- Temperature Display (center) -->
          <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div class="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-xl border-2 border-blue-300">
              <div class="text-center">
                <div class="text-4xl font-bold text-blue-600 mb-1">{{ temperature.toFixed(1) }}°C</div>
                <div class="text-sm text-gray-600">Sıcaklık</div>
              </div>
            </div>
          </div>
          
          <!-- Room Info Overlay -->
          <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div class="text-sm font-semibold text-gray-800">{{ selectedRoom.name }}</div>
            <div class="text-xs text-gray-600">Kat {{ selectedRoom.floor }} - Oda {{ selectedRoom.doorNumber }}</div>
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
          :class="getCommandHighlightClass('electricity')"
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
          :class="getCommandHighlightClass('heating')"
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
          :class="getCommandHighlightClass('light')"
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
                :modelValue="temperature" 
                :min="10" 
                :max="35" 
                :step="0.1"
                @update:modelValue="value => updateTemperature(value ?? temperature.value)"
                class="flex-1"
              />
              <Button 
                icon="pi pi-send" 
                @click="() => updateTemperature(temperature.value, 'manual')"
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

