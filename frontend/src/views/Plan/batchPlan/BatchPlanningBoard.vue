<template>
  <div class="order-daily-page">
    <div class="batch-planning-board">
      <!-- 左侧：批次池 -->
      <div class="left-panel">
        <BatchListPanel @drag-batch="handleBatchDragged" />
      </div>

      <!-- 右侧：合并池（上 80%） + 计划列表（下 20%） -->
      <div class="right-panel">
        <div class="merge-area">
          <MergeArea @update-merge="handleMergeUpdate" @generate-plans="handleGeneratePlans" />
        </div>
        <div class="plan-list">
          <PlanListPanel :plans="plans" @update-plan="handlePlanUpdate" @save="handleSavePlans" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BatchListPanel from './BatchListPanel.vue'
import MergeArea from './MergeArea.vue'
import PlanListPanel from './PlanListPanel.vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'



interface MergedItem {
  product_cd: string
  product_name: string
  total_quantity: number
  batches: any[]
}

const mergeMap = ref<Record<string, MergedItem>>({})
const plans = ref<any[]>([])

function handleBatchDragged(batch: any) {
  const productCd = batch.product_cd
  if (!mergeMap.value[productCd]) {
    mergeMap.value[productCd] = {
      product_cd: batch.product_cd,
      product_name: batch.product_name,
      total_quantity: batch.quantity,
      batches: [batch],
    }
  } else {
    mergeMap.value[productCd].batches.push(batch)
    mergeMap.value[productCd].total_quantity += batch.quantity
  }
}

function handleMergeUpdate(list: MergedItem[]) {
  mergeMap.value = list.reduce((acc, cur) => {
    acc[cur.product_cd] = cur
    return acc
  }, {} as Record<string, MergedItem>)
}

function handleGeneratePlans(data: any) {
  const exists = plans.value.find(p => p.product_cd === data.product_cd)
  if (!exists) {
    plans.value.push({
      product_cd: data.product_cd,
      product_name: data.product_name,
      planned_quantity: data.total_quantity,
      merged_batch_no: data.merged_batch_no,
      batch_nos: data.batch_nos,
      batches: data.batches,
      latest_start_date: ''
    })
  }
}
// await request.post('/api/p/create-from-batch', { plans: plans.value })


function handlePlanUpdate(index: number, field: string, value: any) {
  plans.value[index][field] = value
}

async function handleSavePlans(plansToSave: any[]) {
  if (plans.value.some(p => !p.latest_start_date)) {
    ElMessage.warning('最遅開始日を入力してください')
    return
  }
  try {
    await request.post('/api/p/create-from-batch', {
      plans: plansToSave.map((plan) => ({
        product_cd: plan.product_cd,
        planned_quantity: plan.planned_quantity,
        latest_start_date: plan.latest_start_date,
        merged_batch_no: plan.merged_batch_no,
        batch_nos: plan.batch_nos || [],
      })),
    })

    ElMessage.success('📋 計画保存成功')
    plans.value = []
  } catch (err) {
    ElMessage.error('❌ 計画保存失敗')
    console.error('[计划保存失败]', err)
  }
}


</script>

<style scoped>
.batch-planning-board {
  display: flex;
  gap: 16px;
  padding: 16px;
  /* height: calc(100vh - 64px); */
  /* 高度调整为页面剩余高度，可根据需要改 */
  box-sizing: border-box;
}

/* 左侧：固定宽度 */
.left-panel {
  flex: 0 0 420px;
  border-right: 1px solid #ddd;
  padding-right: 16px;
  overflow-y: auto;
}

/* 右侧：垂直拆分，上下比例 80:20 */
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

/* 合并池：占比 80% */
.merge-area {
  flex: 6;
  overflow: auto;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 8px;
}

/* 计划池：占比 20% */
.plan-list {
  flex: 4;
  overflow: auto;
}
.order-daily-page {
  transform: scale(0.8);
  transform-origin: top left;
  width: 125%;
  height: 125vh;
  /* 关键！保证缩放后仍然填满视口 */
  min-height: 125vh;
  /* 防止内容比窗口还短时高度撑满 */
  overflow: auto;
  /* 防止出现滚动条问题 */
}
</style>
