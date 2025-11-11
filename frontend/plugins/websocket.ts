export default defineNuxtPlugin({
    setup() {
        const runtimeConfig = useRuntimeConfig()
        // Demo mode: always connect
        const backendUrl = runtimeConfig.public.backendUrl?.replace('http://', '') || '46.62.241.130:3001'
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