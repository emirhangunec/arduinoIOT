// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primevue/themes/aura';

export default defineNuxtConfig({
    ssr: false,
    runtimeConfig: {
        public: {
            backendUrl: process.env.BACKEND_URL,
            clientWebsocketUrl: process.env.CLIENT_WEBSOCKET_URL,
            iotWebsocketUrl: process.env.IOT_WEBSOCKET_URL
        }
    },
    alias: {
        'PrismaTypes': '../backend/prisma/prisma.ts',
    },
    compatibilityDate: '2024-04-03',
    devtools: {enabled: true},
    primevue: {
        options: {
            theme: {
                preset: Aura,
                options: {
                    darkModeSelector: 'do-not-enter-dark-mode',
                    cssLayer: false
                }
            },
            // @ts-expect-error
            locale: {
                startsWith: 'Başlayan',
                contains: 'İçeren',
                notContains: 'İçermeyen',
                endsWith: 'Biten',
                equals: 'Eşit',
                notEquals: 'Eşit Değil',
                apply: 'Uygula',
                clear: 'Temizle',
            }

        },

    },
    css: ['~/assets/css/main.css'],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
    },
    vite: {
        optimizeDeps: {
            exclude: ['jwt-decode','exceljs']
        }
    },
    shadcn: {
        /**
         * Prefix for all the imported component
         */
        prefix: '',
        /**
         * Directory that the component lives in.
         * @default "./components/ui"
         */
        componentDir: './components/ui'
    },
    modules: ["@nuxtjs/tailwindcss", "@nuxt/eslint", "@pinia/nuxt", "shadcn-nuxt", "@primevue/nuxt-module", '@vueuse/nuxt'],
})
