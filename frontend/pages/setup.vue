<script setup lang="ts">
import {useForm} from 'vee-validate'
import {toTypedSchema} from '@vee-validate/zod'
import * as z from 'zod'
import {vAutoAnimate} from '@formkit/auto-animate/vue'

import {Button} from '@/components/ui/button'
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {toast} from "~/components/ui/toast";

const formSchema = toTypedSchema(z.object({
  companyName: z.string().min(2).max(50),
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(6),
}))

const {isFieldDirty, handleSubmit} = useForm({
  validationSchema: formSchema,
})

const onSubmit = handleSubmit(async(values) => {
  try{
    const response = await $fetch('http://localhost:3001/company', {
      method: 'POST',
      body: values,
    })
    localStorage.setItem('companyData', JSON.stringify(response))
    toast({
      variant:'default',
      title: 'Form submitted successfully',
    })
    navigateTo('/')

  }
  catch (e) {
    toast({
      variant:'destructive',
      title: 'An error occurred while submitting the form',
    })
  }

})

</script>

<template>
  <div class="flex flex-col gap-2 container p-4">
    <h1 class="text-xl font-medium">
      Hoşgeldiniz,
    </h1>
    <p class="text-slate-500">
      Uygulamayı kullanmaya başlamadan önce lütfen aşağıdaki formu doldurmanız gerekmetedir. Bu uygulama akıllı ev
      sistemlerini, her türlü ölçekteki kurumlarda kullanılan güvenlik sistemlerini ve daha birçok cihazı kontrol
      etmenizi sağlar.
    </p>
    <p class="text-slate-500">
      Bu formu doldurduktan sonra uygulamayı kullanmaya başlayabilirsiniz. Oluşturacağınız hesap ile
      uygulamaya yönetici olarak giriş yapabilirsiniz.
    </p>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="companyName" :validate-on-blur="!isFieldDirty">
        <FormItem v-auto-animate>
          <FormLabel>Şirket İsmi</FormLabel>
          <FormControl>
            <Input type="text" placeholder="shadcn" v-bind="componentField"/>
          </FormControl>
          <FormDescription>
            This is your public display name.
          </FormDescription>
          <FormMessage/>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="email" :validate-on-blur="!isFieldDirty">
        <FormItem v-auto-animate>
          <FormLabel>Yonetici emaili</FormLabel>
          <FormControl>
            <Input type="text" placeholder="shadcn" v-bind="componentField"/>
          </FormControl>
          <FormDescription>
            This is your admin email.
          </FormDescription>
          <FormMessage/>
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" name="name" :validate-on-blur="!isFieldDirty">
        <FormItem v-auto-animate>
          <FormLabel>Yonetici Isim soyisim</FormLabel>
          <FormControl>
            <Input type="text" placeholder="shadcn" v-bind="componentField"/>
          </FormControl>
          <FormDescription>
            This is your admin name.
          </FormDescription>
          <FormMessage/>
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password" :validate-on-blur="!isFieldDirty">
        <FormItem v-auto-animate>
          <FormLabel>Yonetici sifresi</FormLabel>
          <FormControl>
            <Input type="password" placeholder="shadcn" v-bind="componentField"/>
          </FormControl>
          <FormDescription>
            This is your admin password.
          </FormDescription>
          <FormMessage/>
        </FormItem>
      </FormField>

      <Button type="submit">
        Submit
      </Button>
    </form>
  </div>
</template>