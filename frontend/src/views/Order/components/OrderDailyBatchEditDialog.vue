<template>
  <el-dialog
    :model-value="props.visible"
    @update:modelValue="(val) => emit('update:visible', val)"
    width="90%"
    center
    destroy-on-close
    :before-close="handleClose"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="modern-daily-edit-dialog"
    :show-close="false"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-content">
          <div class="title-section">
            <div class="title-icon">
              <el-icon>
                <Edit />
              </el-icon>
            </div>
            <div class="title-text">
              <h2 class="dialog-title">日別受注編集</h2>
              <p class="dialog-subtitle">月注文データの詳細編集・一括更新</p>
            </div>
          </div>
          <div class="header-actions">
            <el-button class="close-btn" @click="handleClose" text>
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </template>
    <!-- 信息卡片区域 -->
    <div class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <el-icon>
            <Document />
          </el-icon>
        </div>
        <div class="info-content">
          <label class="info-label">月注文ID</label>
          <div class="info-value">{{ orderDailyList[0]?.monthly_order_id ?? '-' }}</div>
        </div>
      </div>

      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon>
              <List />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ orderDailyList.length }}</div>
            <div class="stat-label">総件数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon changed">
            <el-icon>
              <Edit />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ changedRows.size }}</div>
            <div class="stat-label">変更済み</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon confirmed">
            <el-icon>
              <Check />
            </el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">
              {{ orderDailyList.filter((row) => row.status === '出荷済').length }}
            </div>
            <div class="stat-label">出荷済み</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="orderDailyList"
      border
      stripe
      show-summary
      :summary-method="getSummaries"
      sum-text="合計"
      class="daily-edit-table"
      height="65vh"
      :row-key="(row) => row.id"
      :row-class-name="tableRowClassName"
    >
      <!-- <el-table-column label="納入先CD" prop="destination_cd" width="90" align="center" /> -->
      <el-table-column label="納入先名" prop="destination_name" min-width="160" />
      <!-- <el-table-column label="製品CD" prop="product_cd" width="90" align="center" /> -->
      <el-table-column label="製品名" prop="product_name" min-width="160" />
      <el-table-column label="入数" prop="unit_per_box" width="80" align="center" />

      <el-table-column label="月" prop="month" width="60" align="center" />
      <el-table-column label="日" prop="day" width="50" align="center" />
      <el-table-column label="曜日" prop="weekday" width="60" align="center" />

      <!-- 確定箱数（编辑） -->
      <el-table-column label="確定箱数" prop="confirmed_boxes" min-width="90" align="center">
        <template #default="{ row, $index }">
          <el-input
            :disabled="saving"
            style="width: 100px; background-color: #f0f9ff"
            :model-value="row.confirmed_boxes === 0 ? '' : row.confirmed_boxes"
            @update:model-value="
              (val) => {
                row.confirmed_boxes = val === '' ? 0 : Number(val)
                handleConfirmedBoxesChange(row)
              }
            "
            @keydown.enter="focusNextInput($index)"
            :ref="
              (el) => {
                if (el && '$el' in el) {
                  confirmedBoxesInputs[$index] =
                    (el.$el.querySelector('input') as HTMLInputElement) || undefined
                }
              }
            "
          />
        </template>
      </el-table-column>

      <!-- 確定本数（可条件编辑） -->
      <el-table-column label="確定本数" prop="confirmed_units" min-width="100" align="center">
        <template #default="{ row }">
          <el-input
            :model-value="row.confirmed_units === 0 ? '' : row.confirmed_units"
            :disabled="saving || row.confirmed_boxes > 0"
            @update:model-value="
              (val) => {
                row.confirmed_units = val === '' ? 0 : Number(val)
                markRowChanged(row)
              }
            "
            style="width: 100px"
          />
        </template>
      </el-table-column>
      <!-- 内示本数（只读） -->
      <el-table-column label="内示本数" prop="forecast_units" min-width="100" align="center">
        <template #default="{ row }">
          <el-input
            :model-value="row.forecast_units === 0 ? '' : row.forecast_units"
            disabled
            style="width: 100px"
          />
        </template>
      </el-table-column>
      <!-- 納入日 -->
      <el-table-column label="納入日" prop="delivery_date" width="110" align="center">
        <template #default="{ row }">
          <span>{{ formatDate(row.delivery_date) }}</span>
        </template>
      </el-table-column>
      <!-- 状態 -->
      <el-table-column label="状態" prop="status" width="130" align="center">
        <template #default="{ row }">
          <el-select
            v-model="row.status"
            placeholder="選択"
            style="width: 100px"
            :disabled="saving"
            @change="markRowChanged(row)"
          >
            <el-option label="未出荷" value="未出荷" />
            <el-option label="出荷済み" value="出荷済み" />
            <el-option label="キャンセル" value="キャンセル" />
          </el-select>
        </template>
      </el-table-column>

      <!-- 備考 -->
      <!-- <el-table-column label="備考" min-width="150">
        <template #default="{ row }">
          <el-input v-model="row.remarks" placeholder="備考" :disabled="saving" @input="markRowChanged(row)" />
        </template>
      </el-table-column> -->
    </el-table>
    <div
      v-if="!loading && orderDailyList.length === 0"
      style="text-align: center; color: #999; padding: 32px 0"
    >
      データがありません
    </div>
    <div
      v-if="!loading && !props.monthlyOrderId"
      style="text-align: center; color: #999; padding: 32px 0"
    >
      月注文IDが指定されていません
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="footer-section">
        <div class="save-summary" v-if="changedRows.size > 0">
          <el-icon class="summary-icon">
            <InfoFilled />
          </el-icon>
          <span class="summary-text">{{ changedRows.size }}件の変更があります</span>
        </div>

        <div class="footer-buttons">
          <el-button :disabled="saving" @click="handleClose" class="cancel-btn">
            <el-icon><Close /></el-icon>
            キャンセル
          </el-button>
          <el-button
            type="primary"
            :loading="saving"
            @click="handleBatchSave"
            class="save-btn"
            :disabled="changedRows.size === 0"
          >
            <el-icon><Check /></el-icon>
            一括保存
          </el-button>
        </div>
      </div>
    </template>

    <!-- 保存中遮罩 -->
    <el-overlay v-if="saving" class="global-saving-overlay" />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { fetchDailyOrdersByMonthlyOrderId, batchUpdateDailyOrders } from '@/api/order/order'
import { ElMessage } from 'element-plus'
import { Edit, Close, Document, List, Check, InfoFilled } from '@element-plus/icons-vue'
import type { OrderDaily } from '@/types/order'

// 日期格式化函数
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    return `${date.getMonth() + 1}/${date.getDate()}`
  } catch (e) {
    return dateString.toString()
  }
}

const confirmedBoxesInputs = ref<(HTMLInputElement | undefined)[]>([])

// 回车跳到下一行
const focusNextInput = async (currentIndex: number) => {
  await nextTick()
  const nextInput = confirmedBoxesInputs.value[currentIndex + 1]
  if (nextInput) {
    nextInput.focus()
  }
}

const props = defineProps<{
  visible: boolean
  monthlyOrderId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'saved'): void
}>()

const orderDailyList = ref<OrderDaily[]>([])
const changedRows = ref<Set<number>>(new Set())
const loading = ref(false)
const saving = ref(false)

watch(
  () => props.monthlyOrderId,
  async (val) => {
    if (val) await loadDailyOrders()
    else orderDailyList.value = []
  },
  { immediate: true },
)

const loadDailyOrders = async () => {
  if (!props.monthlyOrderId) {
    orderDailyList.value = []
    return
  }
  loading.value = true
  try {
    const res = await fetchDailyOrdersByMonthlyOrderId(props.monthlyOrderId)
    console.log('接口返回:', res)
    let list: OrderDaily[] = []
    if (res && res.list) {
      if (Array.isArray(res.list)) {
        list = res.list
      } else if (typeof res.list === 'object') {
        list = [res.list]
      }
    }
    // 找到最后一个确定箱数大于0的日期索引
    let lastPositiveBoxIndex = -1
    for (let i = list.length - 1; i >= 0; i--) {
      if (list[i].confirmed_boxes > 0) {
        lastPositiveBoxIndex = i
        break
      }
    }
    // 从最后一个大于0的日期开始往前，如果确定箱数为空或小于等于0，则将确定本数设为空
    if (lastPositiveBoxIndex >= 0) {
      for (let i = lastPositiveBoxIndex; i >= 0; i--) {
        if (list[i].confirmed_boxes <= 0) {
          list[i].confirmed_units = 0
        }
      }
    }
    orderDailyList.value = list
    changedRows.value.clear()
  } catch (error) {
    console.error('まとめ編集データ取得失敗', error)
    orderDailyList.value = []
  } finally {
    loading.value = false
    await nextTick()
    confirmedBoxesInputs.value = Array.from(
      document.querySelectorAll<HTMLInputElement>('.daily-edit-table .el-input__inner'),
    )
  }
}

const markRowChanged = (row: OrderDaily) => {
  if (row.id) changedRows.value.add(Number(row.id))
}

const handleConfirmedBoxesChange = (row: OrderDaily) => {
  const unitPerBox = row.unit_per_box ?? 0
  if (unitPerBox > 0) {
    row.confirmed_units = row.confirmed_boxes * unitPerBox
    console.log(`计算确定本数: ${row.confirmed_boxes} × ${unitPerBox} = ${row.confirmed_units}`)
  } else {
    // 如果入数为0，使用确定箱数作为确定本数
    row.confirmed_units = row.confirmed_boxes
    console.log(`入数为0，使用确定箱数作为确定本数: ${row.confirmed_units}`)
  }
  markRowChanged(row)
}

const handleBatchSave = async () => {
  if (saving.value) return
  if (changedRows.value.size === 0) {
    ElMessage.warning('変更されたデータがありません')
    return
  }

  saving.value = true
  try {
    const updates = orderDailyList.value
      .filter((row) => {
        const id = Number(row.id)
        return Number.isInteger(id) && id > 0 && changedRows.value.has(id)
      })
      .map((row) => ({
        id: Number(row.id),
        forecast_units: Number(row.forecast_units ?? 0),
        confirmed_boxes: Number(row.confirmed_boxes ?? 0),
        confirmed_units: Number(row.confirmed_units ?? 0),
        status: row.status ?? '未出荷',
        remarks: row.remarks ?? '',
      }))

    if (updates.length === 0) {
      ElMessage.warning('送信データがありません')
      return
    }
    console.log('✅ 即将发送 updates:', JSON.stringify(updates, null, 2))

    await batchUpdateDailyOrders({ list: updates })

    ElMessage.success('一括保存成功しました！')
    changedRows.value.clear()
    emit('saved')
    emit('update:visible', false)
  } catch (error: unknown) {
    console.error('一括保存失敗', error)
    const errorMessage = error instanceof Error ? error.message : '保存に失敗しました'
    ElMessage.error(errorMessage)
  } finally {
    saving.value = false
  }
}

const tableRowClassName = ({ row }: { row: OrderDaily }) => {
  return changedRows.value.has(row.id!) ? 'edited-row' : ''
}

interface SummaryMethodProps {
  columns: Array<{ property: string; label: string }>
  data: OrderDaily[]
}

const getSummaries = ({ columns, data }: SummaryMethodProps) => {
  console.log('调用getSummaries方法', columns.length, '列', data.length, '行数据')
  console.log(
    '列属性:',
    columns.map((c) => c.property),
  )
  const sums: string[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合計'
      console.log('第一列设置为 合計')
      return
    }

    console.log(`处理列 ${index}: ${column.property}`)
    if (['forecast_units', 'confirmed_boxes', 'confirmed_units'].includes(column.property)) {
      let sum = 0
      data.forEach((item, rowIndex) => {
        const value = Number(item[column.property as keyof OrderDaily]) || 0
        console.log(`行 ${rowIndex + 1} - ${column.property} = ${value}`)
        sum += value
      })
      console.log(`合计值 ${column.property}: ${sum}`)
      sums[index] = sum > 0 ? sum.toLocaleString() : ''
    } else {
      sums[index] = ''
    }
  })
  console.log('返回的合计数组:', sums)
  return sums
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<style scoped>
/* 现代化弹窗样式 - 调整间距和背景 */
.modern-daily-edit-dialog {
  max-width: 95vw;
  width: 90vw;
  border-radius: 12px; /* 稍微减小圆角 */
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  background-color: #f8fafc; /* 为整个对话框设置基础背景色 */
}

.modern-daily-edit-dialog :deep(.el-dialog__body) {
  padding: 0 16px 16px; /* 减小内边距 */
  background-color: #f8fafc;
}

.modern-daily-edit-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px; /* 减小内边距 */
  background-color: #ffffff;
  border-top: 1px solid #e2e8f0;
}

/* 自定义头部样式 - 使用浅色背景和深色文字 */
.dialog-header {
  background: #ffffff;
  padding: 16px 24px;
  margin: 0; /* 移除负边距，使其在对话框内部 */
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  width: 40px;
  height: 40px;
  background: #eef2ff; /* 浅紫色背景 */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon .el-icon {
  font-size: 20px;
  color: #6366f1; /* 深紫色图标 */
}

.title-text {
  color: #1e293b; /* 深色文字 */
}

.dialog-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.dialog-subtitle {
  font-size: 14px;
  margin: 2px 0 0;
  color: #64748b; /* 灰色副标题 */
  font-weight: 400;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8; /* 灰色关闭按钮 */
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

/* 信息区域样式 - 优化间距和卡片样式 */
.info-section {
  margin: 16px 0; /* 减小外边距 */
  display: flex;
  gap: 16px;
  align-items: stretch;
  flex-wrap: wrap;
}

.info-card,
.stat-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.info-card:hover,
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.info-card {
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  width: 40px;
  height: 40px;
  background: #6366f1; /* 实色背景 */
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 2px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.stats-cards {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 120px;
  padding: 12px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  flex-shrink: 0;
}

.stat-icon.total {
  background: #3b82f6; /* 蓝色 */
}

.stat-icon.changed {
  background: #f59e0b; /* 橙色 */
}

.stat-icon.confirmed {
  background: #10b981; /* 绿色 */
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
  margin-top: 2px;
}

/* 现代化表格样式 - 浅色表头 */
.daily-edit-table {
  font-size: 14px;
  border-radius: 12px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

/* 表头样式 */
.daily-edit-table :deep(.el-table__header) th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
  padding: 10px 0;
  height: 44px;
  border-bottom: 1px solid #e2e8f0;
}

.daily-edit-table :deep(.el-table__header) th:first-child {
  border-top-left-radius: 12px;
}

.daily-edit-table :deep(.el-table__header) th:last-child {
  border-top-right-radius: 12px;
}

/* 表格行样式 */
.daily-edit-table :deep(.el-table__row) {
  height: 48px;
  transition: background-color 0.2s ease;
}

.daily-edit-table :deep(.el-table__row:hover) {
  background-color: #f7f8ff !important;
}

/* 表格单元格内容样式 */
.daily-edit-table :deep(.el-table__cell) {
  padding: 6px 0;
  border-bottom: 1px solid #f1f5f9;
}

/* 输入框样式优化 */
.daily-edit-table :deep(.el-input__wrapper) {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  box-shadow: none;
}

.daily-edit-table :deep(.el-input__wrapper:hover) {
  border-color: #c7d2fe;
}

.daily-edit-table :deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.daily-edit-table :deep(.el-input__inner) {
  text-align: center;
  font-size: 14px;
  height: 32px;
  line-height: 32px;
  padding: 0 10px;
  font-weight: 500;
  color: #1e293b;
}

/* 下拉选择框样式 */
.daily-edit-table :deep(.el-select .el-input__wrapper) {
  background-color: #ffffff;
}

/* 编辑状态行样式 */
.edited-row {
  background: #fefce8 !important; /* 浅黄色背景 */
}
.edited-row td:first-child {
  position: relative;
}
.edited-row td:first-child::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #facc15; /* 黄色左边框 */
}

/* 合计行样式 */
.daily-edit-table :deep(.el-table__footer) td {
  background-color: #f8fafc;
  font-weight: 600;
  color: #1e293b;
  padding: 12px 0;
  height: 48px;
  border-top: 1px solid #e2e8f0;
}

/* 底部区域样式 */
.footer-section {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.save-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  color: #b45309;
}

.summary-icon {
  color: #f59e0b;
  font-size: 16px;
}

.summary-text {
  font-size: 14px;
  font-weight: 500;
  color: #b45309;
}

.footer-buttons {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

/* 按钮样式现代化 */
.cancel-btn,
.save-btn {
  min-width: 120px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
}

.cancel-btn {
  background: #ffffff;
  color: #4b5563;
}

.cancel-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.save-btn {
  background: #6366f1; /* 主题色 */
  border-color: #6366f1;
  color: white;
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.2);
}

.save-btn:hover:not(:disabled) {
  background: #4f46e5;
  border-color: #4f46e5;
  box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: #e5e7eb;
  border-color: #e5e7eb;
  color: #9ca3af;
  box-shadow: none;
  cursor: not-allowed;
}

.save-btn .el-icon,
.cancel-btn .el-icon {
  font-size: 16px;
}

/* 保存遮罩层样式 */
.global-saving-overlay {
  position: fixed;
  inset: 0;
  background: rgba(248, 250, 252, 0.6);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

/* 响应式调整 */
@media (max-width: 900px) {
  .modern-daily-edit-dialog {
    width: 98vw;
    max-width: 100vw;
    border-radius: 0;
  }
  .dialog-header {
    padding: 12px 16px;
  }
  .dialog-title {
    font-size: 18px;
  }
  .info-section,
  .stats-cards {
    gap: 12px;
  }
}
@media (max-width: 700px) {
  .footer-section {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .footer-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    width: 100%;
  }
  .save-summary {
    justify-content: center;
  }
}
</style>
