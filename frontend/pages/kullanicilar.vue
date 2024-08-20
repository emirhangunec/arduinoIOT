<script setup lang="ts">
definePageMeta({
  layout: 'admin-layout',
})

const products = [
  { code: 'A1', name: 'Apple', category: 'Fruit', quantity: 5 },
  { code: 'B1', name: 'Banana', category: 'Fruit', quantity: 10 },
  { code: 'O1', name: 'Orange', category: 'Fruit', quantity: 15 },
  { code: 'C1', name: 'Carrot', category: 'Vegetable', quantity: 20 },
  { code: 'T1', name: 'Tomato', category: 'Vegetable', quantity: 25 },
  { code: 'P1', name: 'Potato', category: 'Vegetable', quantity: 30 },
]

const showProduct = (product) => {
  console.log(product)
}
const visible = ref(false)
const dialogContent = ref('')
const showDialog = (content:string) => {
  dialogContent.value = content
  visible.value = true

}
</script>
<template>
  <Dialog v-model:visible="visible" modal header="Edit Profile" :style="{ width: '25rem' }">
    {{dialogContent}}
  </Dialog>
  <DataTable :value="products" tableStyle="min-width: 50rem">
    <Column field="code" header="Code">
      <template #body="slotProps">
        <Button label="Show" @click="showDialog(JSON.stringify(slotProps.data))" />

      </template>
    </Column>
    <Column field="name" header="Name"></Column>
    <Column field="category" header="Category"></Column>
    <Column field="quantity" header="Quantity"></Column>
  </DataTable>


</template>