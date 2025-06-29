<template>
  <div class="kpi-filter-card">
    <el-form :inline="true" class="kpi-filter-form">
      <el-form-item label="👥 顧客">
        <el-select v-model="filters.customer_cd" placeholder="全て" clearable filterable style="width: 200px">
          <el-option v-for="item in customerOptions" :key="item.cd" :label="item.name" :value="item.cd" />
        </el-select>
      </el-form-item>

      <el-form-item label="🏭 製品">
        <el-select v-model="filters.product_cd" placeholder="全て" clearable filterable style="width: 200px">
          <el-option v-for="item in productOptions" :key="item.cd" :label="item.name" :value="item.cd" />
        </el-select>
      </el-form-item>

      <el-form-item label="📦 納入先">
        <el-select v-model="filters.destination_cd" placeholder="全て" clearable filterable style="width: 200px">
          <el-option v-for="item in destinationOptions" :key="item.cd" :label="item.name" :value="item.cd" />
        </el-select>
      </el-form-item>

      <el-form-item label="📅 期間">
        <el-date-picker v-model="filters.date_range" type="daterange" start-placeholder="開始日" end-placeholder="終了日"
          format="YYYY-MM-DD" value-format="YYYY-MM-DD" style="width: 240px" />
      </el-form-item>

      <el-form-item class="filter-btn">
        <el-button type="primary" @click="emitSearch">🔍 検索</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps, watch } from 'vue'
import { getCustomerOptions, getProductOptions, getDestinationOptions } from '@/api/options'

const emit = defineEmits(['search'])
interface FilterValue {
  customer_cd?: string
  product_cd?: string
  destination_cd?: string
  date_range?: [string, string]
}

const props = defineProps<{ modelValue: FilterValue }>()
const filters = ref({ ...props.modelValue })

watch(() => props.modelValue, (newVal) => {
  filters.value = { ...newVal }
})

// 🎯 選択肢
const customerOptions = ref<{ cd: string; name: string }[]>([])
const productOptions = ref<{ cd: string; name: string }[]>([])
const destinationOptions = ref<{ cd: string; name: string }[]>([])

const loadOptions = async () => {
  customerOptions.value = await getCustomerOptions()
  productOptions.value = await getProductOptions()
  destinationOptions.value = await getDestinationOptions()
}

const emitSearch = () => emit('search', filters.value)

loadOptions()
</script>

<style scoped>
.kpi-filter-card {
  background-color: #ffffff;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.kpi-filter-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.filter-btn {
  display: flex;
  align-items: center;
}
</style>
