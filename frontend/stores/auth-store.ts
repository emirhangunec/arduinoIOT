import {useLocalStorage} from "@vueuse/core";
import {jwtDecode, type JwtPayload} from "jwt-decode";
import type {UserWithRoleAndPrivileges} from "PrismaTypes";

type PasswordlessUser = Omit<UserWithRoleAndPrivileges, 'password'>

interface UserJWT extends JwtPayload {
    user: PasswordlessUser
}

export const useAuthStore = defineStore('auth', () => {
    const token = useLocalStorage('token', '')
    const isLoggedIn = computed(() => !!token.value)

    function login(_token: string) {
        token.value = _token
    }

    function logout() {
        token.value = ''
        reloadNuxtApp()
    }

    const user = computed(()=>{
        if (isLoggedIn.value){
            const decoded = jwtDecode<UserJWT>(token.value)
            if (decoded.user ){
                return decoded.user
            }
            else {
                return null
            }
        }
        else {
            return null
        }
    })
    const role = computed(() => user.value?.role)
    const username = computed(() => user.value?.name)
    const isAdmin = computed(() => user.value?.isAdmin)
    const privileges = computed(() => role.value?.privileges)
    const can = (privilege: string | string[]) =>{
        if (Array.isArray(privilege)){
            return privilege.every(_p =>  privileges.value?.some(p => p.name === _p))
        }
        else {
            return  privileges.value?.some(p => p.name === privilege)
        }
    }

    return {
        isLoggedIn,
        user,
        token,
        role,
        username,
        isAdmin,
        privileges,
        login,
        logout,
        can
    }

})
