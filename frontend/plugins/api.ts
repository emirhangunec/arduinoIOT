export default defineNuxtPlugin({
    setup() {
        const runtimeConfig = useRuntimeConfig()
        const api = $fetch.create({
            baseURL: runtimeConfig.public.backendUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        return {
            provide: {
                api
            }
        }
    }
})