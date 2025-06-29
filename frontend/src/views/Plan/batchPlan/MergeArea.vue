<template>
  <div class="merge-area" :class="{ 'dragging-over': isDraggingOver }">


    <!-- 上部分：产品合计卡片 -->
    <div class="summary-area">
      <h3>📜 合併製品一覧</h3>
      <div class="summary-list">
        <div v-for="product in productSummaries" :key="product.product_cd" class="summary-card"
          :style="{ borderLeftColor: colorByProduct(product.product_cd) }">
          <div class="summary-header">
            🌟 {{ product.product_cd }} - {{ product.product_name }}
            <span>合計: {{ product.total_quantity }} 個 ｜ バッチ: {{ product.batch_count }}</span>
          </div>
          <div class="summary-footer">
            <div>📊 生産No: <b>{{ product.merged_batch_no }}</b></div>
            <el-button type="primary" size="small" style="margin-left: 8px" @click="generatePlan(product)">
              📋 計画生成
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 下部分：バッチ明細 -->
    <div class="detail-area">
      <h4>📄生産No明細</h4>
      <draggable v-model="mergedBatches" group="batch" item-key="id" class="batch-draggable-list" @add="handleDrop"
        @remove="handleDragBack" @start="isDraggingOver = true" @end="isDraggingOver = false">
        <template #item="{ element }">
          <el-card class="batch-card" shadow="hover" draggable="true" @dragstart="onMergeDragStart($event, element)">
            <div class="card-header">
              {{ element.batch_no }}
            </div>
            <div class="card-body">
              {{ element.product_name }}
              /数量: {{ element.quantity }}
              <!-- <el-button type="danger" size="small" @click.stop="removeBatch(element)">削除</el-button> -->
            </div>
          </el-card>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import draggable from 'vuedraggable'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['update-merge', 'generate-plans'])

const mergedBatches = ref<any[]>([])
const isDraggingOver = ref(false)

/** 页面加载时加载合并池数据 */
onMounted(async () => {
  try {
    const res = await request.get('/api/p/batch-merge')
    mergedBatches.value = res
  } catch (err) {
    ElMessage.error('読み込みに失敗しました')
  }
})

/** 拖拽进入：保存数据库 + 本地添加 */
async function handleDrop(evt: any) {
  const item = evt?.added?.element
  if (!item) return
  try {
    await request.post('/api/p/batch-merge', {
      product_cd: item.product_cd,
      product_name: item.product_name,
      quantity: item.quantity,
      source_batch_id: item.id,
      batch_no: item.batch_no,
    })
  } catch (err: any) {
    ElMessage.error(err.message || '保存失敗')
  }
  emit('update-merge', mergedBatches.value)
}

/** 拖回左池：删除数据库 */
let draggingMergeBatch: any = null

function onMergeDragStart(evt: any, batch: any) {
  draggingMergeBatch = batch
}

async function handleDragBack(evt: any) {
  const batch = draggingMergeBatch
  draggingMergeBatch = null
  if (!batch || !batch.product_cd || !batch.quantity) {
    ElMessage.error('移動データ無くしました！')
    return
  }
  try {
    await request.post('/api/p/batch-pool', {
      product_cd: batch.product_cd,
      product_name: batch.product_name,
      quantity: batch.quantity,
      batch_no: batch.batch_no,
    })
    ElMessage.success('保存成功')
  } catch (err: any) {
    ElMessage.error(err.message || '保存失败')
  }
}

/** 删除按钮点击 */
async function removeBatch(item: any) {
  try {
    await request.delete(`/api/p/batch-merge/${item.id}`)
    mergedBatches.value = mergedBatches.value.filter(b => b.id !== item.id)
    ElMessage.success('削除しました')
  } catch (err) {
    ElMessage.error('削除に失敗しました')
  }
  emit('update-merge', mergedBatches.value)
}

/** 上部产品汇总 */
const productSummaries = computed(() => {
  const map = new Map()
  for (const b of mergedBatches.value) {
    if (!map.has(b.product_cd)) {
      map.set(b.product_cd, {
        product_cd: b.product_cd,
        product_name: b.product_name,
        total_quantity: b.quantity,
        batch_count: 1,
        batch_dates: extractDates(b.batch_no),
      })
    } else {
      const obj = map.get(b.product_cd)
      obj.total_quantity += b.quantity
      obj.batch_count++
      obj.batch_dates.push(...extractDates(b.batch_no))
    }
  }

  const result = []
  for (const summary of map.values()) {
    const sorted = summary.batch_dates.filter(Boolean).sort()
    if (sorted.length >= 2) {
      summary.merged_batch_no = `PB-${summary.product_cd}-${sorted[0]}_to_${sorted[sorted.length - 1]}`
    } else if (sorted.length === 1) {
      summary.merged_batch_no = `PB-${summary.product_cd}-${sorted[0]}`
    } else {
      summary.merged_batch_no = `PB-${summary.product_cd}`
    }
    result.push(summary)
  }
  return result
})

function extractDates(batchNo: string): string[] {
  const withoutSuffix = batchNo.replace(/-\d{3}$/, '')
  const matches = withoutSuffix.match(/\d{4}-\d{2}-\d{2}/g)
  return matches || []
}

/** 按产品CD前缀分组颜色 */
const groupColorMap: Record<string, string> = {
  '91': '#a0c4ff',
  '92': '#bdb2ff',
  '93': '#ffc6ff',
  '94': '#caffbf',
  '95': '#fdffb6',
  '96': '#ffadad',
}

function colorByProduct(productCd: string): string {
  const prefix = productCd.slice(0, 2)
  return groupColorMap[prefix] || '#e0e0e0'
}

/** 点击生成计划 */
async function generatePlan(product: any) {
  try {
    await ElMessageBox.confirm(
      `${product.product_name} の計画を作成しますか？（作成後、合併一覧から削除されます）`,
      '確認',
      { type: 'warning' }
    )

    const batches = mergedBatches.value.filter(b => b.product_cd === product.product_cd)

    emit('generate-plans', {
      product_cd: product.product_cd,
      product_name: product.product_name,
      total_quantity: product.total_quantity,
      merged_batch_no: product.merged_batch_no,
      batch_nos: batches.map(b => b.batch_no),
      batches,
    })

    mergedBatches.value = mergedBatches.value.filter(b => b.product_cd !== product.product_cd)
    emit('update-merge', mergedBatches.value)
  } catch {
    // ユーザーがキャンセル
  }
}


</script>

<style scoped>
.merge-area {
  min-height: 600px;
  border: 2px dashed #aaa;
  border-radius: 6px;
  padding: 1px 5px;
  background-color: #f8f8f8;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.merge-area.dragging-over {
  background-color: #e0f7ff;
  border-color: #409eff;
}

.color-legend {
  display: flex;
  gap: 8px;
  font-size: 12px;
  margin-bottom: 1px;
}

.color-legend span {
  padding: 4px 1px;
  border-radius: 4px;
  color: #333;
}

.summary-area {
  border-bottom: 1px solid #ddd;
  padding-bottom: 2px;
}

.summary-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.summary-card {
  flex: 0 0 calc(50% - 6px);
  box-sizing: border-box;
  border-radius: 6px;
  padding: 3px 5px;
  background-color: #f4f7fa;
  transition: all 0.2s ease;
  border-left: 6px solid #a0c4ff;
}

.summary-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  flex-wrap: wrap;
}

.summary-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 3px;
  font-size: 13px;
}

.detail-area {
  flex-grow: 1;
}

.batch-draggable-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.batch-card {
  flex: 0 0 calc(50% - 5px);
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  transition: box-shadow 0.2s ease;
}

.batch-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 13px;
  margin-bottom: 4px;
}
.card-body {
  font-size: 18px;
  color: #855b02;
  line-height: 1.4;
}
@media (max-width: 768px) {
  .batch-card {
    flex: 0 0 100%;
  }
}
</style>
