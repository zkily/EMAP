<template>
  <el-dialog v-model="visible" title="📦 製品選択" width="80%" top="5vh" :close-on-click-modal="false">
    <el-input v-model="keyword" placeholder="🔍 製品CDまたは名称を検索" clearable style="margin-bottom: 12px; width: 300px" />

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane v-for="group in groupedTabs" :key="group.prefix" :label="group.label" :name="group.prefix">
        <el-table ref="tableRef" :data="group.pagedData" border stripe highlight-current-row
          @selection-change="selection => onSelectionChange(selection, group.prefix)" :row-key="row => row.product_cd"
          :reserve-selection="true" style="max-height: 60vh; overflow-y: auto">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="product_cd" label="製品CD" width="120" sortable />
          <el-table-column prop="product_name" label="製品名称" sortable/>
        </el-table>

        <div style="margin: 10px 0; text-align: right">
          <el-pagination :total="group.filtered.length" :page-size="pageSize" v-model:current-page="group.currentPage"
            size="small" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="visible = false">キャンセル</el-button>
      <el-button type="primary" @click="handleConfirm">決定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { getProductOptions } from '@/api/options'

const props = defineProps<{
  modelValue: boolean
  returnObject?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm', selected: string[]): void
  (e: 'select', selected: { product_cd: string; product_name: string }[]): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const keyword = ref('')
const pageSize = 10
const selectedSet = ref(new Set<string>())
const activeTab = ref('0')

// 全量产品列表缓存
const allProducts = ref<{ product_cd: string; product_name: string; category?: string }[]>([])

interface TabGroup {
  prefix: string
  label: string
  filtered: any[]
  pagedData: any[]
  currentPage: number
}

const groupedTabs = ref<TabGroup[]>([])

const getLetterGroup = (char: string): string => {
  if (/[A-E]/.test(char)) return 'AE'
  if (/[F-J]/.test(char)) return 'FJ'
  if (/[K-O]/.test(char)) return 'KO'
  if (/[P-T]/.test(char)) return 'PT'
  if (/[U-Z]/.test(char)) return 'UZ'
  return 'other'
}

// 初次加载：抓取全部产品
const fetchData = async () => {
  const all = await getProductOptions()
  allProducts.value = all.map(p => ({
    product_cd: p.cd,
    product_name: p.name,
  }))
  applyFilter()
}

// 搜索 + 分类过滤
const applyFilter = () => {
  const k = keyword.value.trim()
  const matched = !k
    ? allProducts.value
    : allProducts.value.filter(p => `${p.product_cd}${p.product_name}`.includes(k))

  const groupMap: Record<string, TabGroup> = {}

  // 初始化数字 0~9
  for (let i = 0; i <= 9; i++) {
    const key = String(i)
    groupMap[key] = {
      prefix: key,
      label: `${key} 製品`,
      filtered: [],
      pagedData: [],
      currentPage: 1
    }
  }

  const letterGroups: Record<string, string> = {
    AE: 'A〜E製品',
    FJ: 'F〜J製品',
    KO: 'K〜O製品',
    PT: 'P〜T製品',
    UZ: 'U〜Z製品',
    other: 'その他'
  }

  for (const key in letterGroups) {
    groupMap[key] = {
      prefix: key,
      label: letterGroups[key],
      filtered: [],
      pagedData: [],
      currentPage: 1
    }
  }

  for (const item of matched) {
    const firstChar = item.product_name?.charAt(0).toUpperCase() || ''
    if (/[0-9]/.test(firstChar)) {
      groupMap[firstChar].filtered.push(item)
    } else if (/[A-Z]/.test(firstChar)) {
      const g = getLetterGroup(firstChar)
      groupMap[g].filtered.push(item)
    } else {
      groupMap.other.filtered.push(item)
    }
  }

  groupedTabs.value = [
    ...[...Array(10).keys()].map(i => groupMap[String(i)]).filter(g => g.filtered.length > 0),
    ...['AE', 'FJ', 'KO', 'PT', 'UZ'].map(k => groupMap[k]).filter(g => g.filtered.length > 0),
    ...(groupMap['other'].filtered.length > 0 ? [groupMap['other']] : [])
  ]

  activeTab.value = groupedTabs.value.length ? groupedTabs.value[0].prefix : ''
  updatePagedData()
}

const updatePagedData = () => {
  for (const group of groupedTabs.value) {
    const start = (group.currentPage - 1) * pageSize
    group.pagedData = group.filtered.slice(start, start + pageSize)
  }
}

// 监听分页更新
watch(() => groupedTabs.value.map(g => g.currentPage), updatePagedData, { deep: true })

// 实时过滤
watch(keyword, applyFilter)

// 弹窗初始化
watch(visible, async (val) => {
  if (val) {
    keyword.value = ''
    selectedSet.value.clear()
    await fetchData()
  }
})

const onSelectionChange = (selection: any[], prefix: string) => {
  const group = groupedTabs.value.find(g => g.prefix === prefix)
  if (!group) return
  const currentPageCds = group.pagedData.map(r => r.product_cd)
  for (const cd of currentPageCds) selectedSet.value.delete(cd)
  for (const row of selection) selectedSet.value.add(row.product_cd)
}

const handleConfirm = () => {
  const selectedProducts = allProducts.value.filter(p => selectedSet.value.has(p.product_cd))

  emit('confirm', selectedProducts.map(p => p.product_cd)) // ✅ 保留旧行为
  emit('select', selectedProducts)                         // ✅ 支持新页面完整对象

  visible.value = false
}
</script>

<style scoped>
.el-table {
  font-size: 13px;
}
</style>
