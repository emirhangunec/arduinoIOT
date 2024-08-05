export default defineNuxtPlugin({
    setup() {
        const authStore = useAuthStore()
        const token = authStore.token ? `Bearer ${authStore.token}` : ``;

        const runtimeConfig = useRuntimeConfig()
        const api = $fetch.create({
            baseURL: runtimeConfig.public.backendUrl,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token,
            }
        })
        return {
            provide: {
                api
            }
        }
    }
})