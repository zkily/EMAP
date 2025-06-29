<!-- ✅ src/views/master/components/ProductDetail.vue -->
<template>
  <el-card shadow="always" style="margin-bottom: 15px;">
    <template #header>
      <div style="font-weight: bold; display: flex; align-items: center;">
        🏷️ 製品情報
      </div>
    </template>

    <el-descriptions :column="2" border>
      <el-descriptions-item label="製品CD">{{ product?.product_cd ?? '' }}</el-descriptions-item>
      <el-descriptions-item label="製品名">{{ product?.product_name ?? '' }}</el-descriptions-item>
      <el-descriptions-item label="工程ルートCD">{{ product?.route_cd ?? '' }}</el-descriptions-item>
      <el-descriptions-item label="工程ルート名">{{ product?.route_name ?? '' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import request from '@/utils/request'

const props = defineProps<{ productCd: string }>()
const product = ref<any>(null)

watch(() => props.productCd, async () => {
  if (props.productCd) {
    product.value = await request.get(`/api/master/product/process/routes/${props.productCd}`)
  }
}, { immediate: true })
</script>
