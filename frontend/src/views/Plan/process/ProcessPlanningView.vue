<template>
    <div class="process-planning-page">
        <div class="title-bar">
            <h2 class="title">🔧 工程工序計画</h2>
            <div>
                <el-button type="primary" icon="Refresh" @click="fetchData">更新</el-button>
            </div>
        </div>

        <!-- 筛选栏 -->
        <el-form :inline="true" class="filter-bar">
            <el-form-item label="工程" style="margin-right: 12px;">
                <el-select v-model="filters.process_cd" placeholder="工程を選択" filterable clearable style="width: 180px;"
                    @change="onFilterChange">
                    <el-option v-for="item in processOptions" :key="item.process_cd"
                        :label="`${item.process_cd} - ${item.process_name} (${item.batch_count}件)`"
                        :value="item.process_cd" />
                </el-select>
            </el-form-item>
            <el-form-item label="設備" style="margin-right: 12px;">
                <el-select v-model="filters.equipment_cd" placeholder="設備を選択" filterable clearable style="width: 180px;"
                    @change="onFilterChange">
                    <el-option v-for="item in equipmentOptions" :key="item.equipment_cd"
                        :label="`${item.equipment_cd} - ${item.equipment_name}`" :value="item.equipment_cd" />
                </el-select>
            </el-form-item>
            <el-form-item label="状態" style="margin-right: 12px;">
                <el-select v-model="filters.status" placeholder="状態選択" clearable style="width: 120px;"
                    @change="onFilterChange">
                    <el-option label="すべて" value="" />
                    <el-option label="未開始" value="未開始" />
                    <el-option label="進行中" value="進行中" />
                    <el-option label="完了" value="完了" />
                </el-select>
            </el-form-item>
            <el-form-item label="製品" style="margin-right: 12px;">
                <el-input v-model="filters.product_cd" placeholder="製品CD" clearable style="width: 120px;"
                    @input="onFilterChange" />
            </el-form-item>
        </el-form>

        <!-- 工序列表表格 -->
        <el-table :data="processList" border stripe style="margin-top: 18px" size="small" height="500"
            :loading="loading" @row-click="onRowClick">
            <el-table-column label="バッチNo" prop="batch_no" width="200" />
            <el-table-column label="製品CD" prop="product_cd" width="80" align="center" />
            <el-table-column label="製品名" prop="product_name" min-width="150" />
            <el-table-column label="工程CD" prop="process_cd" width="80" align="center" />
            <el-table-column label="工程名" prop="process_name" width="120" />
            <el-table-column label="工序No" prop="step_no" width="70" align="center" />
            <el-table-column label="計画数量" prop="planned_qty" width="80" align="center" />
            <el-table-column label="実績数量" prop="actual_qty" width="80" align="center" />
            <el-table-column label="設備" width="120">
                <template #default="{ row }">
                    <span v-if="row.equipment_cd">{{ row.equipment_cd }}</span>
                    <el-tag v-else type="info" size="small">未割当</el-tag>
                </template>
            </el-table-column>
            <el-table-column label="状態" prop="status" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === '未開始' ? 'info' :
                        row.status === '進行中' ? 'warning' :
                            row.status === '完了' ? 'success' : 'primary'" disable-transitions>
                        {{ row.status }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="開始日" prop="start_date" width="100" align="center">
                <template #default="{ row }">{{ formatDate(row.start_date) }}</template>
            </el-table-column>
            <el-table-column label="終了日" prop="end_date" width="100" align="center">
                <template #default="{ row }">{{ formatDate(row.end_date) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
                <template #default="{ row }">
                    <el-button size="small" type="primary" @click.stop="onEditProcess(row)">編集</el-button>
                    <el-button size="small" type="success" @click.stop="onAssignEquipment(row)"
                        v-if="!row.equipment_cd">設備割当</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div v-if="!loading && processList.length === 0" class="empty-tip">
            （該当する工程工序がありません）
        </div>

        <!-- 工序编辑对话框 -->
        <el-dialog v-model="showEditDialog" title="工程工序編集" width="500px">
            <el-form :model="editForm" label-width="100px">
                <el-form-item label="バッチNo">
                    <el-input v-model="editForm.batch_no" readonly />
                </el-form-item>
                <el-form-item label="工程">
                    <el-input v-model="editForm.process_name" readonly />
                </el-form-item>
                <el-form-item label="状態">
                    <el-select v-model="editForm.status" style="width: 100%;">
                        <el-option label="未開始" value="未開始" />
                        <el-option label="進行中" value="進行中" />
                        <el-option label="完了" value="完了" />
                    </el-select>
                </el-form-item>
                <el-form-item label="設備">
                    <el-select v-model="editForm.equipment_cd" filterable clearable style="width: 100%;">
                        <el-option v-for="item in equipmentOptions" :key="item.equipment_cd"
                            :label="`${item.equipment_cd} - ${item.equipment_name}`" :value="item.equipment_cd" />
                    </el-select>
                </el-form-item>
                <el-form-item label="実績数量">
                    <el-input-number v-model="editForm.actual_qty" :min="0" :max="editForm.planned_qty" />
                </el-form-item>
                <el-form-item label="開始日">
                    <el-date-picker v-model="editForm.start_date" type="date" value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item label="終了日">
                    <el-date-picker v-model="editForm.end_date" type="date" value-format="YYYY-MM-DD" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showEditDialog = false">キャンセル</el-button>
                <el-button type="primary" @click="handleSaveEdit">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
    getBatchProcesses,
    updateBatchProcessStatus,
    getPlanningOptions,
    type BatchProcess,
    type ProcessOption,
    type EquipmentOption
} from '@/api/plan/batchProcesses'

const loading = ref(false)
const showEditDialog = ref(false)

const filters = ref({
    process_cd: '',
    equipment_cd: '',
    status: '',
    product_cd: ''
})

const processList = ref<BatchProcess[]>([])
const processOptions = ref<ProcessOption[]>([])
const equipmentOptions = ref<EquipmentOption[]>([])

const editForm = ref<BatchProcess>({
    id: 0,
    batch_id: 0,
    product_cd: '',
    route_cd: '',
    step_no: 0,
    process_cd: '',
    process_name: '',
    planned_qty: 0,
    actual_qty: 0,
    status: '未開始',
    process_time_sec: 0,
    setup_time: 0,
    created_at: '',
    updated_at: '',
    batch_no: '',
    equipment_cd: '',
    start_date: '',
    end_date: ''
})

// 获取计划选项
const fetchPlanningOptions = async () => {
    try {
        const res = await getPlanningOptions()
        if (res.success) {
            processOptions.value = res.data.processes
            equipmentOptions.value = res.data.equipment
        }
    } catch (error) {
        console.error('❌ 计划选项获取失败:', error)
        ElMessage.error('計画オプションの取得に失敗しました')
    }
}

// 获取工序列表
const fetchProcessList = async () => {
    loading.value = true
    try {
        const params = {
            process_cd: filters.value.process_cd || undefined,
            status: filters.value.status || undefined,
            product_cd: filters.value.product_cd || undefined
        }

        const res = await getBatchProcesses(params)
        if (res.success) {
            processList.value = res.data
        }
    } catch (error) {
        console.error('❌ 工序列表获取失败:', error)
        ElMessage.error('工程工序リストの取得に失敗しました')
    } finally {
        loading.value = false
    }
}

// 筛选条件变化
const onFilterChange = () => {
    fetchProcessList()
}

// 获取所有数据
const fetchData = async () => {
    await fetchPlanningOptions()
    await fetchProcessList()
}

// 行点击事件
const onRowClick = (row: BatchProcess) => {
    console.log('选中工序:', row)
}

// 编辑工序
const onEditProcess = (row: BatchProcess) => {
    editForm.value = { ...row }
    showEditDialog.value = true
}

// 分配设备
const onAssignEquipment = (row: BatchProcess) => {
    editForm.value = { ...row }
    editForm.value.status = '進行中'
    showEditDialog.value = true
}

// 保存编辑
const handleSaveEdit = async () => {
    try {
        const updateData = {
            id: editForm.value.id,
            status: editForm.value.status,
            equipment_cd: editForm.value.equipment_cd,
            equipment_name: equipmentOptions.value.find(e => e.equipment_cd === editForm.value.equipment_cd)?.equipment_name,
            actual_qty: editForm.value.actual_qty,
            start_date: editForm.value.start_date,
            end_date: editForm.value.end_date
        }

        const res = await updateBatchProcessStatus(updateData)
        if (res.success) {
            ElMessage.success('更新成功！')
            showEditDialog.value = false
            fetchProcessList()
        }
    } catch (error) {
        console.error('❌ 工序更新失败:', error)
        ElMessage.error('工程工序の更新に失敗しました')
    }
}

// 格式化日期
const formatDate = (val: string | null | undefined) => {
    return val ? dayjs(val).format('YYYY-MM-DD') : ''
}

onMounted(() => {
    fetchData()
})
</script>

<style scoped>
.process-planning-page {
    padding: 40px 24px 32px 24px;
    max-width: 1600px;
    background: #f7f9fb;
    border-radius: 18px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
}

.title {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 12px;
    border-bottom: 2px solid #409EFF;
    padding-bottom: 6px;
    color: #222;
    letter-spacing: 1px;
}

.title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.filter-bar {
    background: #fff;
    padding: 10px 12px 4px 12px;
    border-radius: 12px;
    margin-bottom: 18px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 4px 4px;
}

.el-table {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.el-table th {
    background-color: #f2f3f5;
    color: #555;
    font-weight: bold;
    font-size: 15px;
}

.el-table tr:hover {
    background-color: #f0f9ff;
    cursor: pointer;
}

.el-table td {
    padding: 12px 8px;
    font-size: 14px;
}

.el-tag {
    font-size: 13px;
    border-radius: 6px;
    padding: 0 12px;
}

.empty-tip {
    margin-top: 18px;
    color: #999;
    text-align: center;
    font-size: 16px;
}

.el-dialog {
    border-radius: 14px;
}

.el-dialog__header {
    font-size: 20px;
    font-weight: bold;
    color: #409EFF;
    border-bottom: 1px solid #eee;
    margin-bottom: 10px;
}

.el-form-item__label {
    font-weight: bold;
    color: #333;
}

.el-input,
.el-select,
.el-input-number,
.el-date-picker {
    border-radius: 8px;
}

.el-button {
    border-radius: 8px;
    transition: all 0.3s;
}

.el-button:hover {
    opacity: 0.92;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
}
</style>
