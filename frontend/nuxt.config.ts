// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    runtimeConfig: {
        public: {
            backendUrl: process.env.BACKEND_URL,
            clientWebsocketUrl: process.env.CLIENT_WEBSOCKET_URL,
            iotWebsocketUrl: process.env.IOT_WEBSOCKET_URL
        }
    },
    compatibilityDate: '2024-04-03',
    devtools: {enabled: true},
    css: ['~/assets/css/main.css'],
    postcss: {
        plugins: {
            tailwindcss: {},
            autoprefixer: {},
        },
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
    modules: ["@nuxtjs/tailwindcss", "@nuxt/eslint", "@pinia/nuxt", "shadcn-nuxt"]
})