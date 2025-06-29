<template>
  <div class="schedule-root">
    <h3>📦 設備・検査人稼働スケジュール</h3>
    <!-- 筛选区域 -->
    <el-form :inline="true" class="filter-bar" @submit.prevent>
      <el-form-item label="🏗️ 工程">
        <el-select v-model="filter.machineType" placeholder="設備タイプ" clearable filterable style="width: 150px"
          @change="filter.machineCd = ''">
          <el-option v-for="t in machineTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>
      <el-form-item label="📄 該当名">
        <el-select v-model="filter.machineCd" placeholder="設備名" clearable filterable style="width: 180px"
          :disabled="filteredMachinesByType(filter.machineType).length === 0">
          <el-option v-for="m in filteredMachinesByType(filter.machineType)" :key="m.machine_cd" :label="m.machine_name"
            :value="m.machine_cd" />
        </el-select>
      </el-form-item>
      <el-form-item label="📅 期間">
        <el-date-picker v-model="filter.dateRange" type="daterange" range-separator="～" start-placeholder="開始日"
          end-placeholder="終了日" value-format="YYYY-MM-DD" style="width: 240px" clearable />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onFilter">🔍 検索</el-button>
        <el-button @click="onClear">リセット</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openDialog">➕ 新規追加</el-button>
      <el-button type="info" @click="handleBatchCopy">📋 一括コピー</el-button>
    </div>

    <!-- 主表格 -->
    <el-table :data="workTimes" border stripe style="width: 100%" :height="tableHeight" row-key="id"
      class="worktime-table" :scrollbar-always-on="true" @sort-change="handleSortChange">
      <el-table-column label="工程" prop="machine_cd" min-width="80" align="center" />
      <el-table-column label="該当名" prop="machine_name" sortable="custom" min-width="120" align="center" />
      <el-table-column label="日付" prop="work_date" sortable="custom" min-width="110" align="center" />
      <el-table-column label="曜日" prop="weekday_jp" min-width="60" align="center" />
      <el-table-column label="開始" prop="start_time" sortable="custom" min-width="80" align="center" />
      <el-table-column label="終了" prop="end_time" min-width="80" align="center" />
      <el-table-column label="残業" prop="is_overtime" min-width="60" align="center"
        :formatter="row => row.is_overtime ? 'あり' : 'なし'" />
      <el-table-column label="備考" prop="remark" min-width="100" align="center" />
      <el-table-column label="操作" min-width="140" align="center" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editRow(scope.row)">✏️ 編集</el-button>
          <el-button type="danger" size="small" @click="deleteRow(scope.row)">🗑️ 削除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-area">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total"
        layout="total, prev, pager, next, jumper" :page-sizes="[10, 20, 50, 100]" background @current-change="loadData"
        @size-change="handlePageSizeChange" />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editId ? '編集' : '新規追加'" width="96vw" :style="{ maxWidth: '500px' }">
      <el-form :model="form" label-width="90px">
        <el-form-item label="🏗️工程" required>
          <el-select v-model="form.machine_type" placeholder="工程名" clearable filterable @change="form.machine_cd = ''">
            <el-option v-for="t in machineTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="該当名" required>
          <el-select v-model="form.machine_cd" style="width:100%" :disabled="!form.machine_type">
            <el-option v-for="m in filteredMachinesByType(form.machine_type)" :key="m.machine_cd"
              :label="m.machine_name" :value="m.machine_cd" />
          </el-select>
        </el-form-item>
        <el-form-item label="📅日付" required>
          <el-date-picker v-model="form.work_dates" type="dates" style="width:100%" value-format="YYYY-MM-DD"
            placeholder="複数日付選択可能" />
        </el-form-item>
        <el-form-item label="⏰時間帯" required>
          <div class="time-slots-container">
            <div v-for="(slot, index) in form.timeSlots" :key="index" class="time-slot-item">
              <el-time-picker v-model="slot.start_time" format="HH:mm" value-format="HH:mm:ss" placeholder="開始"
                style="width:45%" />
              <span class="time-separator">～</span>
              <el-time-picker v-model="slot.end_time" format="HH:mm" value-format="HH:mm:ss" placeholder="終了"
                style="width:45%" />
              <el-button type="danger" circle size="small" icon="Delete" class="remove-slot-btn"
                @click="removeTimeSlot(index)" v-if="form.timeSlots.length > 1" />
            </div>
            <div class="add-slot-row">
              <el-button type="primary" size="small" @click="addTimeSlot">
                <el-icon>
                  <Plus />
                </el-icon> 時間帯追加
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="残業時間帯">
          <div class="time-slots-container">
            <div v-for="(slot, index) in form.overtimeSlots" :key="index" class="time-slot-item">
              <el-time-picker v-model="slot.start_time" format="HH:mm" value-format="HH:mm:ss" placeholder="開始"
                style="width:45%" />
              <span class="time-separator">～</span>
              <el-time-picker v-model="slot.end_time" format="HH:mm" value-format="HH:mm:ss" placeholder="終了"
                style="width:45%" />
              <el-button type="danger" circle size="small" icon="Delete" class="remove-slot-btn"
                @click="removeOvertimeSlot(index)" v-if="form.overtimeSlots.length > 1" />
            </div>
            <div class="add-slot-row">
              <el-button type="primary" size="small" @click="addOvertimeSlot">
                <el-icon>
                  <Plus />
                </el-icon> 残業時間帯追加
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="備考">
          <el-input v-model="form.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">❌キャンセル</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveRow">💾 保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量复制弹窗 -->
    <el-dialog v-model="batchCopyVisible" title="稼働一括コピー" width="96vw" :style="{ maxWidth: '480px' }">
      <el-form :model="batchCopyForm" label-width="120px">
        <!-- 来源设备类型 -->
        <el-form-item label="工程" required>
          <el-select v-model="batchCopyForm.from_machine_type" placeholder="工程名" filterable clearable
            @change="batchCopyForm.from_machine_cd = ''">
            <el-option v-for="t in machineTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <!-- 来源设备 -->
        <el-form-item label="該当名" required>
          <el-select v-model="batchCopyForm.from_machine_cd" placeholder="該当名" filterable clearable
            :disabled="filteredMachinesByType(batchCopyForm.from_machine_type).length === 0">
            <el-option v-for="m in filteredMachinesByType(batchCopyForm.from_machine_type)" :key="m.machine_cd"
              :label="m.machine_name" :value="m.machine_cd" />
          </el-select>
        </el-form-item>
        <!-- 来源期间 -->
        <el-form-item label="期間" required>
          <el-date-picker v-model="batchCopyForm.from_range" type="daterange" style="width:100%"
            value-format="YYYY-MM-DD" range-separator="～" start-placeholder="開始日" end-placeholder="終了日" clearable />
        </el-form-item>

        <el-divider content-position="center">↓ コピー先へ</el-divider>

        <!-- 目标设备类型 -->
        <el-form-item label="コピー工程" required>
          <el-select v-model="batchCopyForm.to_machine_type" placeholder="工程名" filterable clearable
            @change="batchCopyForm.to_machine_cd = ''">
            <el-option v-for="t in machineTypes" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <!-- 目标设备 -->
        <el-form-item label="コピー該当名" required>
          <el-select v-model="batchCopyForm.to_machine_cd" placeholder="該当名" filterable clearable
            :disabled="filteredMachinesByType(batchCopyForm.to_machine_type).length === 0">
            <el-option v-for="m in filteredMachinesByType(batchCopyForm.to_machine_type)" :key="m.machine_cd"
              :label="m.machine_name" :value="m.machine_cd" />
          </el-select>
        </el-form-item>
        <!-- 目标期间 -->
        <el-form-item label="コピー期間" required>
          <el-date-picker v-model="batchCopyForm.to_range" type="daterange" style="width:100%" value-format="YYYY-MM-DD"
            range-separator="～" start-placeholder="開始日" end-placeholder="終了日" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchCopyVisible = false">キャンセル</el-button>
        <el-button type="primary" :loading="batchCopyLoading" @click="confirmBatchCopy">コピー実行</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { ElMessageBox, ElMessage } from "element-plus";
import { Plus, Delete } from '@element-plus/icons-vue';

// 所有设备及类型
const machines = ref([]);
const machineTypes = ref([]);

// 筛选区
const filter = ref({
  machineType: "",
  machineCd: "",
  dateRange: []
});

// 主表数据与分页
const workTimes = ref([]);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 弹窗表单（含设备类型、设备名）
const dialogVisible = ref(false);
const editId = ref(null);
const form = ref({
  machine_type: "",
  machine_cd: "",
  work_dates: [], // 多选日期
  timeSlots: [{ start_time: "08:00:00", end_time: "12:00:00" }], // 标准时间段
  overtimeSlots: [{ start_time: "17:00:00", end_time: "21:00:00" }], // 残業时间段
  remark: ""
});
const saveLoading = ref(false);
const sortField = ref("work_date");
const sortOrder = ref("asc"); // 'asc' or 'desc'

// 表格排序事件
function handleSortChange({ prop, order }) {
  if (!prop || !order) {
    // 若清除排序，则回到默认
    sortField.value = "work_date";
    sortOrder.value = "asc";
  } else {
    sortField.value = prop;
    sortOrder.value = order === "ascending" ? "asc" : "desc";
  }
  loadData();
}
// 设备类型筛选后的设备列表
function filteredMachinesByType(type) {
  if (!type) return machines.value;
  return machines.value.filter(m => m.machine_type === type);
}

// 表格高度
const tableHeight = computed(() => {
  if (window.innerWidth < 600) return 360;
  if (window.innerHeight > 650) return window.innerHeight - 320;
  return 400;
});

function formatDateString(dt) {
  if (!dt) return '';
  if (typeof dt === 'string' && dt.length >= 10) return dt.slice(0, 10);
  const d = new Date(dt);
  const pad = n => n < 10 ? '0' + n : n;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 设备初始化
async function loadMachines() {
  machines.value = await axios.get("/api/schedule/machines").then(res => res.data);
  // 使用后端新增的工程类型接口
  machineTypes.value = await axios.get("/api/schedule/machine-types").then(res => res.data);
}

// 主表数据加载
async function loadData() {
  const params = {
    page: page.value,
    limit: pageSize.value,
    sortField: sortField.value,
    sortOrder: sortOrder.value,
  };
  if (filter.value.machineCd) params.machine_cd = filter.value.machineCd;
  if (filter.value.machineType) params.machine_type = filter.value.machineType;
  if (filter.value.dateRange?.length === 2) {
    params.from_date = filter.value.dateRange[0];
    params.to_date = filter.value.dateRange[1];
  }
  try {
    const res = await axios.get("/api/schedule", { params }).then(r => r.data);
    workTimes.value = res.data || [];
    total.value = res.total || 0;
  } catch (error) {
    console.error("データロード失敗:", error);
    ElMessage.error("データロード失敗: " + (error.response?.data?.message || error.message));
    workTimes.value = [];
    total.value = 0;
  }
}

// 筛选&清除
function onFilter() {
  page.value = 1;
  loadData();
}
function onClear() {
  filter.value = { machineType: "", machineCd: "", dateRange: [] };
  page.value = 1;
  loadData();
}
function handlePageSizeChange(newSize) {
  pageSize.value = newSize;
  page.value = 1;
  loadData();
}

// 添加/移除时间段
function addTimeSlot() {
  form.value.timeSlots.push({ start_time: "08:00:00", end_time: "12:00:00" });
}

function removeTimeSlot(index) {
  form.value.timeSlots.splice(index, 1);
}

// 添加/移除残業时间段
function addOvertimeSlot() {
  form.value.overtimeSlots.push({ start_time: "17:00:00", end_time: "21:00:00" });
}

function removeOvertimeSlot(index) {
  form.value.overtimeSlots.splice(index, 1);
}

// 新建/编辑弹窗相关
function openDialog() {
  editId.value = null;
  form.value = {
    machine_type: filter.value.machineType || "",
    machine_cd: filter.value.machineCd || "",
    work_dates: filter.value.dateRange?.[0] ? [filter.value.dateRange[0]] : [],
    timeSlots: [{ start_time: "08:00:00", end_time: "12:00:00" }, { start_time: "13:00:00", end_time: "17:00:00" }, { start_time: "21:00:00", end_time: "01:00:00" }, { start_time: "02:00:00", end_time: "06:00:00" }],
    overtimeSlots: [{ start_time: "17:00:00", end_time: "19:00:00" }, { start_time: "06:00:00", end_time: "08:00:00" }],
    remark: ""
  };
  dialogVisible.value = true;
}

function editRow(row) {
  editId.value = row.id;

  // 将单个时间值转换为时间段
  const timeSlots = [];
  if (row.start_time && row.end_time) {
    timeSlots.push({
      start_time: (row.start_time || '').slice(0, 8),
      end_time: (row.end_time || '').slice(0, 8)
    });
  }

  // 假设现有数据没有多个时间段，所以只有一个残業时间段
  const overtimeSlots = [];
  if (row.is_overtime) {
    overtimeSlots.push({
      start_time: "17:00:00",
      end_time: "21:00:00"
    });
  }

  form.value = {
    machine_type: row.machine_type || "",
    machine_cd: row.machine_cd || "",
    work_dates: [formatDateString(row.work_date)],
    timeSlots: timeSlots.length > 0 ? timeSlots : [{ start_time: "08:00:00", end_time: "17:00:00" }],
    overtimeSlots: overtimeSlots.length > 0 ? overtimeSlots : [{ start_time: "17:00:00", end_time: "21:00:00" }],
    remark: row.remark || ""
  };
  dialogVisible.value = true;
}

async function saveRow() {
  if (!form.value.machine_type || !form.value.machine_cd || !form.value.work_dates?.length || form.value.timeSlots.length === 0) {
    ElMessage.error("必須項目を入力してください");
    return;
  }

  // 检查时间段输入是否完整
  for (const slot of form.value.timeSlots) {
    if (!slot.start_time || !slot.end_time) {
      ElMessage.error("時間帯を完全に入力してください");
      return;
    }
  }

  for (const slot of form.value.overtimeSlots) {
    if ((slot.start_time && !slot.end_time) || (!slot.start_time && slot.end_time)) {
      ElMessage.error("残業時間帯を完全に入力してください");
      return;
    }
  }

  saveLoading.value = true;

  try {
    // 准备发送到后端的数据
    const requestData = {
      machine_type: form.value.machine_type,
      machine_cd: form.value.machine_cd,
      work_dates: form.value.work_dates.map(d => formatDateString(d)),
      timeSlots: form.value.timeSlots,
      overtimeSlots: form.value.overtimeSlots,
      remark: form.value.remark
    };

    if (editId.value) {
      // 编辑现有记录
      await axios.patch(`/api/schedule/${editId.value}`, requestData);
    } else {
      // 新建记录
      await axios.post("/api/schedule", requestData);
    }

    dialogVisible.value = false;
    loadData();
    ElMessage.success("保存完了");
  } catch (error) {
    console.error("保存中にエラーが発生しました:", error);
    ElMessage.error("保存失敗: " + (error.response?.data?.message || error.message));
  } finally {
    saveLoading.value = false;
  }
}

async function deleteRow(row) {
  try {
    await ElMessageBox.confirm("削除しますか？", "確認");
    await axios.delete(`/api/schedule/${row.id}`);
    loadData();
    ElMessage.success("削除完了");
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      ElMessage.error("削除失敗: " + (error.response?.data?.message || error.message));
    }
  }
}
// 批量复制相关
const batchCopyVisible = ref(false);
const batchCopyLoading = ref(false);
const batchCopyForm = ref({
  from_machine_type: "",
  from_machine_cd: "",
  from_range: [],
  to_machine_type: "",
  to_machine_cd: "",
  to_range: []
});

// 批量复制弹窗按钮事件
function handleBatchCopy() {
  batchCopyForm.value = {
    from_machine_type: "",
    from_machine_cd: "",
    from_range: [],
    to_machine_type: "",
    to_machine_cd: "",
    to_range: []
  };
  batchCopyVisible.value = true;
}

// 复制执行
async function confirmBatchCopy() {
  const d = batchCopyForm.value;
  if (
    !d.from_machine_type ||
    !d.from_machine_cd ||
    !d.from_range[0] ||
    !d.from_range[1] ||
    !d.to_machine_type ||
    !d.to_machine_cd ||
    !d.to_range[0] ||
    !d.to_range[1]
  ) {
    ElMessage.error("全てのコピー条件を入力してください");
    return;
  }
  batchCopyLoading.value = true;
  try {
    await axios.post("/api/schedule/copy", {
      from_machine_cd: d.from_machine_cd,
      from_start: d.from_range[0],
      from_end: d.from_range[1],
      to_machine_cd: d.to_machine_cd,
      to_start: d.to_range[0],
      to_end: d.to_range[1]
    });
    batchCopyVisible.value = false;
    loadData();
    ElMessage.success("コピー完了");
  } catch (error) {
    ElMessage.error("コピー失敗: " + (error.response?.data?.message || error.message));
  } finally {
    batchCopyLoading.value = false;
  }
}

// 首次加载
onMounted(async () => {
  await loadMachines();
  await loadData();
});
</script>

<style scoped>
.schedule-root {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 6px 6px 6px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px #0001;
}

.filter-bar {
  margin-bottom: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px 10px;
}

.filter-bar .el-form-item {
  margin-bottom: 0;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  padding-left: 2px;
}

.toolbar .el-button {
  min-width: 110px;
  font-size: 15px;
}

.worktime-table {
  background: #fcfcfd;
  border-radius: 8px;
  overflow: hidden;
  font-size: 15px;
}

.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin: 12px 0 4px 0;
  padding-right: 4px;
}

.el-table th,
.el-table td {
  text-align: center !important;
  vertical-align: middle !important;
  padding: 5px 2px !important;
}

.el-table th {
  background: #f0f6fc;
  font-weight: 600;
}

.el-dialog {
  max-width: 96vw !important;
  min-width: 290px;
  width: auto !important;
  padding: 0;
}

.el-dialog__body {
  padding: 18px 14px 8px 14px !important;
}

.el-form-item {
  margin-bottom: 14px;
}

.time-slots-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-slot-item {
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
}

.time-separator {
  margin: 0 2px;
}

.remove-slot-btn {
  margin-left: 5px;
}

.add-slot-row {
  margin-top: 5px;
  display: flex;
  justify-content: center;
}

@media (max-width: 700px) {
  .schedule-root {
    padding: 2vw 0.5vw;
    border-radius: 0;
    box-shadow: none;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 6px 2vw;
    margin-bottom: 8px;
  }

  .toolbar {
    gap: 2px;
    margin-bottom: 8px;
    padding-left: 0;
  }

  .worktime-table {
    font-size: 12.5px;
    border-radius: 0;
  }

  .el-dialog {
    min-width: 95vw;
    max-width: 99vw !important;
    margin: 0;
    border-radius: 0;
  }

  .el-dialog__body {
    padding: 12px 4vw 4px 4vw !important;
  }

  .pagination-area {
    margin: 10px 0 0 0;
    padding-right: 0;
  }

  .time-slot-item {
    flex-wrap: wrap;
  }

  .time-separator {
    margin: 0 4px;
  }

  .remove-slot-btn {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
  }
}
</style>
