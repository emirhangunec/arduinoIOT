<script setup lang="ts">
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from '~/components/ui/form'
import {Input} from '~/components/ui/input'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'
import {useForm} from 'vee-validate'
import {LockKeyhole, Mail} from 'lucide-vue-next'

const authStore = useAuthStore()
const {$api} = useNuxtApp()

const formSchema = toTypedSchema(
    z.object({
      email: z.string().email(),
      password: z.string().min(6),
    })
)

const {isFieldDirty, handleSubmit} = useForm({
  validationSchema: formSchema,
})
const toast = useToast()

const onSubmit = handleSubmit(async (values) => {
  try {
    const res = await $api<{
      message: string
      data:
          | {
        token: string
      }
          | undefined
    }>('/login', {
      method: 'POST',
      body: values,
    })
    if (res.data) {
      authStore.login(res.data.token)
      navigateTo('', {external: true})
    }
  } catch (e) {

    toast.add({
      severity: 'error',
      summary: 'Error on login, please control your credentials',
      life: 5000,
    })
  }
})
</script>

<template>
  <Toast/>
  <div class="w-full h-full flex flex-col lg:flex-row items-stretch justify-self-stretch">
    <div class="w-full h-ful">
      <img
          src="https://wallpapers.com/images/hd/abstract-royal-blue-background-81ofkj9kb4ws8pgp.jpg"
          alt="login image"
          class="w-full h-full object-cover"
      />
    </div>
    <div class="bg-white w-full h-full flex flex-col gap-4 items-center justify-center">

      <h1 class="text-3xl text-blue-950 font-bold py-8">Giriş Ekranı</h1>
      <form
          class="flex flex-col gap-4"
          @submit="onSubmit"
      >
        <div class="flex flex-col gap-2">
          <FormField
              v-slot="{ componentField }"
              name="email"
              :validate-on-blur="!isFieldDirty"
          >
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center"
              >
                <Mail class="text-xs"/>
                Yönetici emaili
              </FormLabel
              >
              <FormControl class="w-full">
                <Input
                    type="text"
                    placeholder="email "
                    v-bind="componentField"
                    class=" border-2 border-gray-300 rounded-md p-4 !w-[500px] "
                />
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Yönetici emaili ile giriş yapabilirsiniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>
        </div>

        <div class="flex flex-col gap-2">
          <FormField
              v-slot="{ componentField }"
              name="password"
              :validate-on-blur="!isFieldDirty"
          >
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center"
              >
                <LockKeyhole class="text-xs"/>
                Yönetici şifresi
              </FormLabel
              >
              <FormControl>
                <Input
                    type="password"
                    placeholder="şifre"
                    v-bind="componentField"
                    class="border-2 border-gray-300 rounded-md p-4"
                />
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Yönetici şifresi ile giriş yapabilirsiniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>
        </div>

        <div class=" flex items-center justify-end">
          <Button
              class="flex items-center justify-center bg-blue-950"
              type="submit"
          >
            Giris Yap
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
