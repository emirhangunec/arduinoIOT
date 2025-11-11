// Demo mode: bypass authentication
export default defineNuxtRouteMiddleware(async (to, from) => {
    // All routes are public in demo mode
    return
})