export function useApi<T>(url: string) {
    const {$api} = useNuxtApp()

    const data = useFetch<T>(url, {
        $fetch: $api
    })

    const toast = useToast()
    watch(data.status, (newStatus) => {
        switch (newStatus) {
            case 'pending':
                console.info(`API: fetching ${url}`)
                break
            case 'error':
                console.error(`API: error ${url}`, data.error.value)
                toast.add({
                    severity: 'error',
                    summary: 'API Error',
                    detail: `Fetch failed: ${url}`,
                    life: 2000
                })
                break
            case 'success':
                console.info(`API: success ${url}`, data.data.value)
        }

    }, {immediate: true})


    return data
}