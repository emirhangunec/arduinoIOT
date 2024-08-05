import {useCompanyStore} from "~/stores/company-store";

export default defineNuxtRouteMiddleware(async (to,from) => {
    // skip middleware on server
    if (import.meta.server) return

    const nuxtApp = useNuxtApp()


    const companyStore = useCompanyStore()

    let timeout = 0
    while (companyStore.isLoading && timeout < 5000 && !companyStore.companyData) {
        await new Promise(resolve => setTimeout(resolve, 100))
        timeout += 100
    }

    if (!companyStore.companyData && to.name !== 'setup') {
        console.log('no company data found, redirecting to setup')
        return navigateTo('/setup')
    }
    if (companyStore.companyData && to.name === 'setup') {
        console.log('company data found, redirecting to dashboard')
        return navigateTo('/?message=already_setup')
    }

})