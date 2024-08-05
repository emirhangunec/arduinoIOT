import type {Company} from 'PrismaTypes'


function isValidCompany(company: Company): company is Company {
    return !!company.name && !!company.name
}


export const useCompanyStore = defineStore('company', () => {
    const {$api} = useNuxtApp()
    const companyData = ref<Company | null>(null)
    const isLoading = ref(false)

    async function handleInvalidOrMissingCompanyData() {
        isLoading.value = true
        localStorage.removeItem('companyData')
        try {
            const res = await $api<{
                message: string
                data: {
                    company: Company
                } | undefined
            }>('/company')

            if (!res.data) {
                console.error('Invalid company data from server', res)
                isLoading.value = false
                return null
            }
            if (isValidCompany(res.data.company)) {
                localStorage.setItem('companyData', JSON.stringify(res.data.company))
                // console.log('companyData fetched from server', res.data.company)
                isLoading.value = false
                return res.data.company

            } else {
                // console.error('Invalid company data from server', res.data.company)
                isLoading.value = false
                return null
            }
        } catch (e) {
            // console.error('Invalid company data from server')
            isLoading.value = false
            return null

        } finally {
            isLoading.value = false
        }
    }

    async function main() {
        isLoading.value = true
        const rawData = localStorage.getItem('companyData')

        try {
            if (rawData) {
                const parsedData = JSON.parse(rawData)
                if (isValidCompany(parsedData)) {
                    // console.log('company data found on localstorage', parsedData)
                    setTimeout(() => {
                        companyData.value = parsedData
                    }, 0)

                } else {
                    companyData.value = await handleInvalidOrMissingCompanyData()
                }
            } else {
                companyData.value = await handleInvalidOrMissingCompanyData()

            }
        } catch (e) {
            console.error('Error parsing companyData', e)
            companyData.value = await handleInvalidOrMissingCompanyData()

        } finally {
            setTimeout(() => {
                isLoading.value = false
            }, 0)
        }
    }

    // onMounted(main)
    main()
    return {
        companyData,
        isLoading,

    }
})
