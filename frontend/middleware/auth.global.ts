const PUBLIC_ROUTES = ['login', 'setup', 'index', 'forgot-password', 'reset-password']
export default defineNuxtRouteMiddleware(async (to, from) => {
    const userStore = useAuthStore()
    if (!to.name) return navigateTo('/login')
    if (PUBLIC_ROUTES.includes(to.name.toString())) {
        if (!userStore.isLoggedIn) return navigateTo('/login')

    }
})