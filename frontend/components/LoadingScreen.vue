<script setup lang="ts">
interface LoadingStep {
    id: string;
    label: string;
    icon: string;
    completed: boolean;
    active: boolean;
}

const props = defineProps<{
    steps: LoadingStep[];
    title?: string;
    subtitle?: string;
}>();

const progress = computed(() => {
    const completed = props.steps.filter((s) => s.completed).length;
    return (completed / props.steps.length) * 100;
});
</script>

<template>
    <div class="fixed inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 z-50 flex items-center justify-center">
        <div class="max-w-2xl w-full px-8">
            <!-- Logo/Title -->
            <div class="text-center mb-12">
                <div class="inline-block mb-6">
                    <div class="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-pulse">
                        <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>
                <h1 v-if="title" class="text-4xl font-bold text-white mb-3">{{ title }}</h1>
                <p v-if="subtitle" class="text-xl text-blue-100">{{ subtitle }}</p>
            </div>

            <!-- Progress Bar -->
            <div class="mb-8">
                <div class="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                        class="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 transition-all duration-500 ease-out rounded-full"
                        :style="{ width: `${progress}%` }"
                    >
                        <div class="h-full w-full bg-white/30 animate-pulse"></div>
                    </div>
                </div>
                <div class="text-center mt-2 text-blue-100 text-sm">
                    {{ Math.round(progress) }}% Tamamlandı
                </div>
            </div>

            <!-- Steps -->
            <div class="space-y-4">
                <div
                    v-for="(step, index) in steps"
                    :key="step.id"
                    class="flex items-center gap-4 p-4 rounded-lg transition-all duration-300"
                    :class="
                        step.completed
                            ? 'bg-green-500/20 border-2 border-green-400'
                            : step.active
                            ? 'bg-white/10 border-2 border-white/50 shadow-lg scale-105'
                            : 'bg-white/5 border-2 border-transparent'
                    "
                >
                    <!-- Icon -->
                    <div class="flex-shrink-0">
                        <div
                            class="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300"
                            :class="
                                step.completed
                                    ? 'bg-green-500 text-white'
                                    : step.active
                                    ? 'bg-white text-indigo-600 animate-pulse'
                                    : 'bg-white/20 text-white/50'
                            "
                        >
                            <i
                                v-if="step.completed"
                                class="pi pi-check text-xl"
                            ></i>
                            <i
                                v-else-if="step.active"
                                :class="step.icon"
                                class="text-xl animate-spin"
                            ></i>
                            <i
                                v-else
                                :class="step.icon"
                                class="text-xl"
                            ></i>
                        </div>
                    </div>

                    <!-- Label -->
                    <div class="flex-1">
                        <p
                            class="font-semibold transition-colors duration-300"
                            :class="
                                step.completed
                                    ? 'text-green-200'
                                    : step.active
                                    ? 'text-white'
                                    : 'text-white/60'
                            "
                        >
                            {{ step.label }}
                        </p>
                    </div>

                    <!-- Animated dots for active step -->
                    <div v-if="step.active && !step.completed" class="flex gap-1">
                        <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0s"></div>
                        <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-white rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

