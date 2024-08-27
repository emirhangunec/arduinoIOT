export default defineNuxtPlugin({
    setup() {
        const runtimeConfig = useRuntimeConfig()
        const authStore = useAuthStore()
        if (!authStore.isLoggedIn) {
            return
        }
        const backendUrl = runtimeConfig.public.backendUrl.replace('http://', '')
        const socket = new WebSocket(`ws://${backendUrl}/client`);
        socket.onopen = () => {
            console.log('[WS] Connected to websocket server.');
        }

        socket.onmessage = (event) => {
            console.log(`[WS] Message: ${event.data}`);
        }

        socket.onclose = () => {
            console.log('[WS] Connection closed.');
        }

        return {
            provide: {
                socket
            }
        }
    }
})