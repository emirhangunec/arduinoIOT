<script setup lang="ts">
definePageMeta({
  layout: false,
})

const deviceType = ref<string | null>(null)
const isLoading = ref(true)

const loadingSteps = ref([
  { id: 'init', label: 'Sistem başlatılıyor...', icon: 'pi pi-spin pi-spinner', completed: false, active: false },
  { id: 'network', label: 'Ağ bağlantısı kontrol ediliyor...', icon: 'pi pi-wifi', completed: false, active: false },
  { id: 'devices', label: 'Cihazlar taranıyor...', icon: 'pi pi-server', completed: false, active: false },
  { id: 'ready', label: 'Sistem hazır', icon: 'pi pi-check-circle', completed: false, active: false },
])

const startLoadingSequence = async () => {
  // Step 1: Sistem başlatılıyor
  loadingSteps.value[0].active = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  loadingSteps.value[0].completed = true
  loadingSteps.value[0].active = false

  // Step 2: Ağ bağlantısı
  loadingSteps.value[1].active = true
  await new Promise(resolve => setTimeout(resolve, 1800))
  loadingSteps.value[1].completed = true
  loadingSteps.value[1].active = false

  // Step 3: Cihazlar taranıyor
  loadingSteps.value[2].active = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  loadingSteps.value[2].completed = true
  loadingSteps.value[2].active = false

  // Step 4: Sistem hazır
  loadingSteps.value[3].active = true
  await new Promise(resolve => setTimeout(resolve, 1200))
  loadingSteps.value[3].completed = true
  loadingSteps.value[3].active = false

  // Hide loading after a brief moment
  await new Promise(resolve => setTimeout(resolve, 800))
  isLoading.value = false
}

const selectDeviceType = (type: 'simulation' | 'management') => {
  deviceType.value = type
  sessionStorage.setItem('deviceType', type)
  if (type === 'simulation') {
    navigateTo('/simulation')
  } else {
    navigateTo('/management')
  }
}

onMounted(async () => {
  // Check if device type is already selected
  const stored = sessionStorage.getItem('deviceType')
  if (stored === 'simulation') {
    navigateTo('/simulation')
    return
  } else if (stored === 'management') {
    navigateTo('/management')
    return
  }

  // Start loading sequence
  await startLoadingSequence()
})
</script>

<template>
  <LoadingScreen
    v-if="isLoading"
    :steps="loadingSteps"
    title="Akıllı Bina Yönetim Sistemi"
    subtitle="Sistem başlatılıyor..."
  />
  <div v-else class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="max-w-4xl w-full">
      <div class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-800 mb-4">Akıllı Bina Yönetim Sistemi</h1>
        <p class="text-xl text-gray-600">20 Katlı Bina Simülasyonu</p>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Simulation Device Card -->
        <div 
          @click="selectDeviceType('simulation')"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
        >
          <div class="text-center">
            <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Simülasyon Cihazı</h2>
            <p class="text-gray-600 mb-6">
              Tek bir oda için sensör verilerini görüntüleyin. Pencere, elektrik, ısıtma, ışık ve sıcaklık durumunu anlık olarak takip edin.
            </p>
            <div class="bg-blue-50 rounded-lg p-4 text-left">
              <p class="text-sm text-gray-700 font-semibold mb-2">Özellikler:</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• Anlık sensör verileri</li>
                <li>• Pencere durumu</li>
                <li>• Elektrik kontrolü</li>
                <li>• Isıtma kontrolü</li>
                <li>• Işık durumu</li>
                <li>• Sıcaklık ölçümü</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Management Device Card -->
        <div 
          @click="selectDeviceType('management')"
          class="bg-white rounded-2xl shadow-xl p-8 cursor-pointer transform transition-all hover:scale-105 hover:shadow-2xl"
        >
          <div class="text-center">
            <div class="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg class="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Yönetim Cihazı</h2>
            <p class="text-gray-600 mb-6">
              Tüm binayı yönetin. 20 katlı binadaki tüm odaları görüntüleyin ve kontrol edin. Anlık durum takibi ve merkezi kontrol.
            </p>
            <div class="bg-indigo-50 rounded-lg p-4 text-left">
              <p class="text-sm text-gray-700 font-semibold mb-2">Özellikler:</p>
              <ul class="text-sm text-gray-600 space-y-1">
                <li>• 20 kat × 10 oda = 200 oda</li>
                <li>• Tüm odaları görüntüleme</li>
                <li>• Merkezi kontrol</li>
                <li>• Anlık durum güncellemeleri</li>
                <li>• Kat bazlı görünüm</li>
                <li>• Toplu işlemler</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center text-gray-500 text-sm">
        <p>Gerçek zamanlı IoT yönetim sistemi</p>
      </div>
    </div>
  </div>
</template>
