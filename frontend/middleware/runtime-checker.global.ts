export default defineNuxtRouteMiddleware((to, from) => {
    const runtimeConfig = useRuntimeConfig()

    if (!runtimeConfig.public.backendUrl || !runtimeConfig.public.clientWebsocketUrl || !runtimeConfig.public.iotWebsocketUrl) {
        return createError({
            statusCode: 500,
            // fatal:true,
            statusMessage: 'Runtime configuration is not set up correctly',
            data: {
                code: 'RUNTIME_CONFIG_ERROR'
            }
        })
    } else {
        //     check general settings to see if they are set up correctly, otherwise redirect to setup page
    }

})