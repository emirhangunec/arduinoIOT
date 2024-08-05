import {useLocalStorage} from "@vueuse/core";
import {jwtDecode, type JwtPayload} from "jwt-decode";
import type {User} from "PrismaTypes";

type PasswordlessUser = Omit<User, 'password'>
function isValidUser (user: PasswordlessUser): user is PasswordlessUser {
    return !!user.id && !!user.email && !!user.name && !!user.isAdmin
}

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
            if (decoded.user && isValidUser(decoded.user)){
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


    return {
        isLoggedIn,
        user,
        token,
        login,
        logout,
    }

})
