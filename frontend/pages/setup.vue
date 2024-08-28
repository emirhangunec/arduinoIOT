<script setup lang="ts">
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'
import {vAutoAnimate} from '@formkit/auto-animate/vue'
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import type {Company} from "PrismaTypes";
import {Building2} from 'lucide-vue-next'
import { User } from 'lucide-vue-next'
import { Mail} from 'lucide-vue-next'
  import { LockKeyhole } from 'lucide-vue-next'


const {$api} = useNuxtApp()
const authStore = useAuthStore()

const formSchema = toTypedSchema(z.object({
  companyName: z.string().min(2).max(50),
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6),
}))

const {isFieldDirty, handleSubmit} = useForm({
  validationSchema: formSchema,
})

const onSubmit = handleSubmit(async (values) => {
  const res = await $api<{
    message: string,
    data: {
      company: Company,
      token: string
    } | undefined
  }>('/setup', {
    method: 'POST',
    body: values

  })

  if (res.data) {
    authStore.login(res.data.token)
    navigateTo('/?message=success-setup', {external: true})
  }
})

</script>

<template>
  <div class="w-full h-full flex flex-col lg:flex-row items-stretch justify-self-stretch">
    <div class="w-full h-ful">
      <img
          src="https://wallpapers.com/images/hd/abstract-royal-blue-background-81ofkj9kb4ws8pgp.jpg"
          alt="login image"
          class="w-full h-full object-cover"
      />
    </div>
    <div class="bg-white w-full h-full flex flex-col gap-4 items-center justify-center">
      <h1 class="text-3xl text-blue-950 font-bold py-8">Yönetici Kayıt Ekranı</h1>
        <form @submit="onSubmit" class="flex flex-col gap-6">
          <FormField
              class="!w-full"
              v-slot="{ componentField }" name="companyName" :validate-on-blur="!isFieldDirty">
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center">
                <Building2 class="text-xs"/>
                Şirket İsmi</FormLabel>
              <FormControl class="!w-full">
                <Input
                    class="!w-[500px] border-2 border-gray-300 rounded-md p-4"
                    type="text" placeholder="" v-bind="componentField"/>
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Şirketinizin ismini giriniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="email" :validate-on-blur="!isFieldDirty">
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center"><Mail class="text-xs" />Yönetici emaili</FormLabel>
              <FormControl>
                <Input type="text" placeholder="" v-bind="componentField"/>
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Yönetici emaili giriniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>
          <FormField v-slot="{ componentField }" name="name" :validate-on-blur="!isFieldDirty">
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center"><User class="text-xs"/>Yönetici Isim soyisim</FormLabel>
              <FormControl>
                <Input type="text" placeholder="" v-bind="componentField"/>
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Yönetici isim soyisim giriniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="password" :validate-on-blur="!isFieldDirty">
            <FormItem v-auto-animate>
              <FormLabel class="font-bold text-lg text-blue-950 flex gap-2 items-center"><LockKeyhole class="text-xs" />Yönetici sifresi</FormLabel>
              <FormControl>
                <Input type="password" placeholder="" v-bind="componentField"/>
              </FormControl>
              <FormDescription class="text-gray-400 text-xs">
                *Yönetici şifresi giriniz.
              </FormDescription>
              <FormMessage/>
            </FormItem>
          </FormField>

          <div class=" flex items-center justify-end">
            <Button
                class="flex items-center justify-center bg-blue-950"
                type="submit"
            >
              Kayıt Ol
            </Button>
          </div>
        </form>
    </div>
    </div>
</template>