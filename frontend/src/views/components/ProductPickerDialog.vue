<template>
  <el-dialog v-model="visible" title="📦 製品を選択" width="600px">
    <!-- 搜索框 -->
    <el-input
      v-model="searchKeyword"
      placeholder="製品CDまたは名称で検索"
      clearable
      style="margin-bottom: 12px"
      @input="filterProducts"
    />

    <!-- 表格 -->
    <el-table
      :data="filteredProducts"
      highlight-current-row
      @row-dblclick="select"
      height="400"
    >
      <el-table-column prop="product_cd" label="製品CD" width="120" />
      <el-table-column prop="product_name" label="製品名" />
      <el-table-column prop="lot_size" label="Lot数" width="100" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="select(row)">
            選択
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import axios from 'axios'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue', 'selected'])

const visible = ref(false)
const products = ref<any[]>([])
const filteredProducts = ref<any[]>([])
const searchKeyword = ref('')

// 监听 dialog 打开，加载数据
watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val && products.value.length === 0) {
    try {
      const res = await axios.get('/api/master/options/products-full')

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : []

      products.value = list
      filteredProducts.value = [...list]
    } catch (err) {
      console.error('製品データ取得失敗:', err)
      products.value = []
      filteredProducts.value = []
    }
  }
})



// 双向绑定 v-model
watch(visible, val => emit('update:modelValue', val))

// 选择行
function select(row: any) {
  emit('selected', row)
  visible.value = false
}

// 关键词过滤
function filterProducts() {
  const kw = searchKeyword.value.toLowerCase()
  filteredProducts.value = products.value.filter(p =>
    p.product_cd.toLowerCase().includes(kw) ||
    p.product_name.toLowerCase().includes(kw)
  )
}
</script>

