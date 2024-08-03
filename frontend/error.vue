<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})


const errorCode = JSON.parse(typeof props.error?.data === "string" ? props.error.data : '{}')?.code ?? ''
</script>

<template>
  <div v-if="error">
    <div class="fixed inset-4 z-20 shadow-2xl rounded-md  bg-gray-900/90 text-white" v-if="errorCode === 'RUNTIME_CONFIG_ERROR'">
      <div class="p-4">
        <h1 class="text-2xl font-medium text-red-500">Uygulama Ayarları Hatası</h1>
        <p class="mt-2">Uygulama ayarlarında bir hata oluştu. Lütfen teknik destek ile iletişime geçin.
        Bu hata, uygulamanin duzgun kurulmamasi veya calistirilmamasi durumunda olusabilir.
          <br>
          <br>
          Destek kodu: <span class="font-mono bg-gray-600 p-1 rounded-md">{{ errorCode }}</span>
        </p>
      </div>
    </div>
  </div>
  <div class="" v-else>
    Bilinmeyen bir hata oluştu, lütfen teknik destek ile iletişime geçin.
  </div>
</template>