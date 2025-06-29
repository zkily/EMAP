<template>
  <div class="batch-list-panel">
    <!-- 📌 标题与操作 -->
    <div class="panel-header">
      <h3 class="panel-title">📦 製品生産リスト</h3>
      <el-button class="panel-text" type="success" icon="Download" size="small" @click="syncFromProductionBatches">
        予定生産No読込
      </el-button>
    </div>

    <!-- 📌 筛选 + 添加区域 -->
    <div class="filter-add-area">
      <el-form :inline="true" class="filter-form">

        <el-form-item label="製品検索">
          <el-input v-model="filterProductText" placeholder="🗂️ 製品を選択" readonly class="product-input"
            @click="filterDialogVisible = true" />
          <el-button icon="Close" @click="clearFilterProduct" />
        </el-form-item>

      </el-form>

      <!-- <el-form :inline="true" class="add-form">
        <el-form-item label="製品">
          <el-input v-model="selectedProductText" placeholder="📦 製品を選択" readonly class="product-input"
            @click="productDialogVisible = true" />
          <el-button icon="Close" @click="clearSelectedProduct" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="quantity" :min="1" :step="100" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addBatch" :disabled="!selectedProduct">
            ➕ 追加
          </el-button>
        </el-form-item>
      </el-form> -->
    </div>

    <!-- 📌 批次列表（纵向展示） -->
    <div class="batch-list-area">
      <draggable :list="filteredBatches" group="batch" item-key="id" class="batch-draggable-list"
        @remove="handleDragOut" :move="checkCanDrag">


        <template #item="{ element, index }">
          <el-card class="batch-card" shadow="hover" draggable="true" @dragstart="onDragStart($event, element)">

            <el-tooltip :content="getBatchTooltip(element)" placement="top" effect="dark">
              <div class="card-header">
                {{ element.batch_no }}
                <span v-if="!isDraggableBatch(element)" style="color: #aaa">🔒</span>
              </div>
            </el-tooltip>

            <div class="card-body-row">
              <div class="card-text">
                {{ element.product_name }} / 数量: {{ element.quantity }}
              </div>
              <!-- <el-button type="danger" size="small" @click.stop="removeBatch(index)">削除</el-button> -->
            </div>
          </el-card>

        </template>
      </draggable>
    </div>

    <!-- 📌 产品选择弹窗 -->
    <ProductSelectDialog v-model="productDialogVisible" @selected="handleProductSelected" />
    <ProductSelectDialog v-model="filterDialogVisible" @selected="handleFilterProductSelected" />

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import ProductSelectDialog from '../../components/ProductPickerDialog.vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import draggable from 'vuedraggable'

const emit = defineEmits(['drag-batch'])

const batches = ref<any[]>([])
const productOptions = ref<any[]>([])
const quantity = ref<number>(1000)

const filterProduct = ref<any>(null)
const filterProductText = ref('')
const filterDialogVisible = ref(false)

const selectedProduct = ref<any>(null)
const selectedProductText = ref('')
const productDialogVisible = ref(false)
const loading = ref(false)

onMounted(async () => {
  try {
    const [batchRes, prodRes] = await Promise.all([
      request.get('/api/p/batch-pool'),
      request.get('/api/master/products', { params: { simple: 1 } }),
    ])
    batches.value = batchRes
    productOptions.value = prodRes
  } catch (err) {
    ElMessage.error('データ取得に失敗しました')
  }
})

function getBatchTooltip(batch: any): string {
  const matchDate = batch.batch_no?.match(/PB-[^-]+-(\d{4}-\d{2}-\d{2})/)
  const fromDate = matchDate ? matchDate[1] : '不明'

  const matchNum = batch.batch_no?.match(/-(\d{3})$/)
  const suffixNum = matchNum ? matchNum[1] : '---'

  const draggable = isDraggableBatch(batch)

  return `📅 出荷予定日: ${fromDate}
🧮 生産No: ${suffixNum}
${draggable ? '✅ 生産Noはドラッグ可能です' : '🔒 ドラッグ不可'}`
}


function isDraggableBatch(batch: any): boolean {
  const sameProductBatches = batches.value.filter(b => b.product_cd === batch.product_cd)

  const extractFromDate = (batch_no: string): string => {
    const match = batch_no.match(/PB-[^-]+-(\d{4}-\d{2}-\d{2})/)
    return match ? match[1] : ''
  }

  const extractBatchSuffix = (batch_no: string): number => {
    const match = batch_no.match(/-(\d{3})$/)
    return match ? parseInt(match[1], 10) : 0
  }

  const sorted = [...sameProductBatches].sort((a, b) => {
    const dateA = extractFromDate(a.batch_no)
    const dateB = extractFromDate(b.batch_no)
    if (dateA < dateB) return -1
    if (dateA > dateB) return 1

    // 同日期时，按 batch 编号排序
    const numA = extractBatchSuffix(a.batch_no)
    const numB = extractBatchSuffix(b.batch_no)
    return numA - numB
  })

  return sorted.length > 0 && sorted[0].id === batch.id
}



function checkCanDrag(evt: any): boolean {
  const dragged = evt.draggedContext.element
  if (!isDraggableBatch(dragged)) {
    ElMessage.warning('❌ この製品では、最も早い生産Noのみドラッグ可能です')
    return false
  }
  return true
}




const filteredBatches = computed(() => {
  const list = filterProduct.value
    ? batches.value.filter(b => b.product_cd === filterProduct.value.product_cd)
    : batches.value

  return [...list].sort((a, b) => {
    const nameA = a.product_name || ''
    const nameB = b.product_name || ''
    if (nameA < nameB) return -1
    if (nameA > nameB) return 1

    // 提取 batch_no 中的末尾数字编号
    const extractBatchNumber = (no: string) => {
      const match = no?.match(/-(\d{1,})$/)
      return match ? parseInt(match[1], 10) : 0
    }

    const baseA = a.batch_no || ''
    const baseB = b.batch_no || ''
    const prefixA = baseA.replace(/-\d{1,}$/, '')
    const prefixB = baseB.replace(/-\d{1,}$/, '')

    // 如果前缀不同，按字典序排
    if (prefixA < prefixB) return -1
    if (prefixA > prefixB) return 1

    // 否则比较末尾编号
    const numA = extractBatchNumber(baseA)
    const numB = extractBatchNumber(baseB)
    return numA - numB
  })
})


function handleFilterProductSelected(product: any) {
  filterProduct.value = product
  filterProductText.value = `${product.product_cd} - ${product.product_name}`
}

function clearFilterProduct() {
  filterProduct.value = null
  filterProductText.value = ''
}

async function syncFromProductionBatches() {
  loading.value = true
  try {
    // 第一阶段：POST 请求取得 message
    const res = await request.post('/api/p/batch-pool/sync-from-production')
    const msg = res?.message || '読み込み完了'

    // 第二阶段：GET 请求刷新批次池
    const newData = await request.get('/api/p/batch-pool')
    batches.value = newData

    // 清除筛选条件，刷新视图
    filterProduct.value = null
    filterProductText.value = ''

    ElMessage.success(msg)
  } catch (err: any) {
    ElMessage.error(err?.message || '読込に失敗しました')
  } finally {
    loading.value = false
  }
}


function handleFilterChange() {
  // 切换产品筛选后，如需清除选中项可在此处理
}

async function addBatch() {
  if (!selectedProduct.value || quantity.value <= 0) {
    ElMessage.warning('製品と数量を入力してください')
    return
  }
  try {
    const res = await request.post('/api/p/batch-pool', {
      product_cd: selectedProduct.value.product_cd,
      product_name: selectedProduct.value.product_name,
      quantity: quantity.value
    })
    batches.value.unshift(res)
    clearSelectedProduct()
    ElMessage.success('生産Noを追加しました')
  } catch (err: any) {
    ElMessage.error(err.message || '追加に失敗しました')
  }
}

async function removeBatch(index: number) {
  const batch = filteredBatches.value[index]
  try {
    await request.delete(`/api/p/batch-pool/${batch.id}`)
    const realIdx = batches.value.findIndex(b => b.id === batch.id)
    if (realIdx !== -1) batches.value.splice(realIdx, 1)
    ElMessage.success('削除しました')
  } catch (err: any) {
    ElMessage.error(err.message || '削除に失敗しました')
  }
}

let draggingBatch: any = null

function onDragStart(evt: any, batch: any) {
  draggingBatch = batch
}

async function handleDragOut(evt: any) {
  const batch = draggingBatch
  draggingBatch = null
  if (!batch || !batch.id) {
    // ElMessage.error('データなくしました!(id 未取得)')
    return
  }
  try {
    await request.delete(`/api/p/batch-pool/${batch.id}`)
    const idx = batches.value.findIndex(b => b.id === batch.id)
    if (idx !== -1) batches.value.splice(idx, 1)
    ElMessage.success('ドラッグ成功!')
  } catch (err: any) {
    ElMessage.error(err.message || '削除に失敗しました')
  }
}

function handleProductSelected(product: any) {
  selectedProduct.value = product
  selectedProductText.value = `${product.product_cd} - ${product.product_name}`
  quantity.value = product.lot_size || 1000
}
function clearSelectedProduct() {
  selectedProduct.value = null
  selectedProductText.value = ''
}
</script>

<style scoped>
.batch-list-panel {
  border: 1px solid #c4c2c2;
  padding: 5px;
}

.product-input {
  width: 210px;
  margin-right: 4px;
}

.batch-draggable-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.batch-card {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.batch-card:hover {
  border-color: #409eff;
  background-color: rgb(118, 250, 162);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.18);
}

.card-header {
  font-weight: bold;
  font-size: 13px;
  color: #666;
}

.panel-text {
  font-size: 15px;
  height: 28px;
}

.card-body-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-text {
  font-size: 16px;
  color: #152cf8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 10px;
}

.name {
  font-weight: 500;
  font-size: 16px;
  margin-bottom: 1px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.panel-title {
  margin: 0;
  font-size: 18px;
}

.filter-add-area {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2px;
  margin-bottom: 1px;
}

.filter-form,
.add-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.batch-list-area {
  max-height: 800px;
  overflow-y: auto;
  padding-right: 6px;
}
</style>
