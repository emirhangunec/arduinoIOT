import {defineStore} from "pinia";

export const useAuthStore = defineStore('auth', () => {
    const token = ref(localStorage.getItem('token'))


    return {token}
})