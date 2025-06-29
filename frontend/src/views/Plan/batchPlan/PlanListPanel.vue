<template>
  <div class="plan-list-panel">
    <h3 class="panel-title">📋 計画編集</h3>

    <el-table :data="plans" border class="plan-table" header-cell-class-name="table-header"
      cell-class-name="table-cell">
      <el-table-column label="最遅開始日" width="150">
        <template #default="{ row, $index }">
          <el-date-picker v-model="row.latest_start_date" type="date" size="small" placeholder="日付選択"
            style="width: 100%" @change="onDateChange($index, $event)" />
        </template>
      </el-table-column>
      <el-table-column prop="product_cd" label="製品CD" width="75" />
      <el-table-column prop="product_name" label="製品名" width="150" />
      <el-table-column prop="planned_quantity" label="数量" width="70" />
      <el-table-column prop="merged_batch_no" label="生産No" width="270" />
      <el-table-column label="サブ生産No一覧">
        <template #default="{ row }">
          <div v-for="bn in row.batch_nos" :key="bn">📦 {{ bn }}</div>
        </template>
      </el-table-column>

    </el-table>

    <div class="footer">
      <el-button type="primary" :disabled="plans.length === 0" @click="savePlans">
        💾 計画保存
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  plans: any[]
}>()

const emit = defineEmits(['update-plan', 'save'])

function onDateChange(index: number, date: string) {
  emit('update-plan', index, 'latest_start_date', date)
}

function savePlans() {
  // 可选：自动将 merged_batch_no 赋值到 plan_no
  const patchedPlans = props.plans.map(plan => ({
    ...plan,
    plan_no: plan.merged_batch_no || '',
  }))
  emit('save', patchedPlans)
}
</script>

<style scoped>
.plan-list-panel {
  width: 100%;
  border: 1px solid #ccc;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  height: 100%;
}

.panel-title {
  margin-bottom: 12px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.plan-table {
  flex-grow: 1;
  overflow-y: auto;
  margin-bottom: 16px;
}

.table-header {
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
}

.table-cell {
  text-align: center;
}

.footer {
  text-align: center;
  margin-top: auto;
}

.el-button {
  min-width: 160px;
}
</style>
