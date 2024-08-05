<script setup lang="ts">
import {FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "~/components/ui/form";
import {Input} from "~/components/ui/input";
import {toTypedSchema} from "@vee-validate/zod";
import * as z from "zod";
import {useForm} from "vee-validate";
import {Button} from "~/components/ui/button";
import {toast} from "~/components/ui/toast";


const authStore = useAuthStore()
const {$api} = useNuxtApp()
const formSchema = toTypedSchema(z.object({
  email: z.string().email(),
  password: z.string().min(6),
}))

const {isFieldDirty, handleSubmit} = useForm({
  validationSchema: formSchema,
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const res = await $api<{
      message: string,
      data: {
        token: string
      } | undefined
    }>('/login', {
      method: 'POST',
      body: values

    })
    if (res.data) {
      authStore.login(res.data.token)
      navigateTo('', {external: true})
    }
  }
  catch (e) {
    toast({
      title: 'Error on login, please control your credentials',
      variant: 'destructive'
    })
  }
})
</script>

<template>
  <div class="flex flex-col gap-2 container p-4">
    login page
    <form @submit="onSubmit">
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