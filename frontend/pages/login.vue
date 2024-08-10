<script setup lang="ts">
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useForm } from 'vee-validate'
import { Button } from '~/components/ui/button'
import { toast } from '~/components/ui/toast'

const authStore = useAuthStore()
const { $api } = useNuxtApp()
const formSchema = toTypedSchema(
	z.object({
		email: z.string().email(),
		password: z.string().min(6),
	})
)

const { isFieldDirty, handleSubmit } = useForm({
	validationSchema: formSchema,
})

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
			navigateTo('', { external: true })
		}
	} catch (e) {
		toast({
			title: 'Error on login, please control your credentials',
			variant: 'destructive',
		})
	}
})
</script>

<template>
	<div
		class="flex flex-col gap-6 items-center justify-center !h-full !w-full bg-gray-100"
	>
		<div
			class="border-1-solid shadow flex flex-col gap-20 items-center justify-center rounded-md border-gray-900 p-10 bg-gray-200"
		>
			<h1 class="font-bold text-gray-700 text-4xl">Giris Ekrani</h1>
			<div class="container items-center justify-center flex flex-col gap-6">
				<div class="flex flex-col gap-6">
					<form
						class="flex flex-col gap-6"
						@submit="onSubmit"
					>
						<div class="flex flex-col gap-2">
							<FormField
								v-slot="{ componentField }"
								name="email"
								:validate-on-blur="!isFieldDirty"
							>
								<FormItem v-auto-animate>
									<FormLabel class="font-bold text-xl"
										>Yonetici emaili</FormLabel
									>
									<FormControl>
										<Input
											type="text"
											placeholder="your email"
											v-bind="componentField"
											class="w-[500px] border-2 border-gray-300 rounded-md p-4"
										/>
									</FormControl>
									<FormDescription>
										*Yonetici emaili ile giris yapabilirsiniz.
									</FormDescription>
									<FormMessage />
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
									<FormLabel class="font-bold text-xl"
										>Yonetici sifresi</FormLabel
									>
									<FormControl>
										<Input
											type="password"
											placeholder="your password"
											v-bind="componentField"
											class="w-[500px] border-2 border-gray-300 rounded-md p-4"
										/>
									</FormControl>
									<FormDescription>
										*Yonetici sifresi ile giris yapabilirsiniz.
									</FormDescription>
									<FormMessage />
								</FormItem>
							</FormField>
						</div>

						<div class="m-4 flex items-center justify-end">
							<Button
								class="flex items-center justify-center"
								type="submit"
							>
								Giris Yap
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	</div>
</template>
