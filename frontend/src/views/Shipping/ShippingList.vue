<template>
  <div
    class="shipping-list-container"
    v-loading="pageLoading"
    element-loading-text="ページを読み込み中..."
    element-loading-background="rgba(255, 255, 255, 0.9)"
  >
    <!-- 页面头部 -->
    <div class="page-header" :class="{ 'page-loaded': !pageLoading }">
      <div class="header-content">
        <div class="title-section">
          <h2 class="title">
            <div class="title-icon">
              <el-icon>
                <Van />
              </el-icon>
            </div>
            <span class="title-text">出荷一覧</span>
            <div class="title-badge">
              <span class="badge-text">{{ shippingList.length }}</span>
            </div>
          </h2>
          <p class="subtitle">出荷情報の検索・管理が行えます</p>
        </div>
        <div class="header-decoration">
          <div class="decoration-circle circle-1"></div>
          <div class="decoration-circle circle-2"></div>
          <div class="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>

    <!-- フィルター -->
    <el-card
      class="filter-card modern-card"
      :class="{ 'filter-card-expanded': showAdvancedFilters }"
    >
      <template #header>
        <div class="filter-header">
          <div class="filter-title">
            <el-icon class="filter-icon">
              <Search />
            </el-icon>
            <span>検索条件</span>
          </div>
          <el-button link @click="toggleAdvancedFilters" class="toggle-button">
            {{ showAdvancedFilters ? '簡易検索' : '詳細検索' }}
            <el-icon class="el-icon--right toggle-icon" :class="{ rotated: showAdvancedFilters }">
              <ArrowDown />
            </el-icon>
          </el-button>
        </div>
      </template>
      <el-form :inline="true" :model="filters" class="filter-bar">
        <!-- 基本検索条件 -->
        <div class="compact-filter-row">
          <div class="filter-group date-group">
            <label class="filter-label">期間</label>
            <div class="date-range-container">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="〜"
                start-placeholder="開始日"
                end-placeholder="終了日"
                value-format="YYYY-MM-DD"
                @change="handleDateRangeChange"
                class="modern-date-picker"
                size="small"
                style="width: 220px"
              />
              <div class="date-quick-buttons">
                <el-button size="small" @click="adjustDate(-1)" class="date-btn">
                  <el-icon><ArrowLeft /></el-icon>
                </el-button>
                <el-button size="small" @click="setToday" class="date-btn today-btn">
                  今日
                </el-button>
                <el-button size="small" @click="adjustDate(1)" class="date-btn">
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>

          <div class="filter-group destination-group">
            <label class="filter-label">納入先</label>
            <div class="destination-controls">
              <!-- 传统下拉选择 -->
              <el-select
                v-model="singleDestination"
                placeholder="選択"
                clearable
                filterable
                class="destination-dropdown"
                size="small"
                style="width: 120px"
                @change="handleSingleDestinationChange"
                :disabled="selectedDestinations.length > 0 || !!selectedGroupFilter"
              >
                <el-option
                  v-for="dest in destinationOptions"
                  :key="dest.value"
                  :label="dest.value"
                  :value="dest.value"
                >
                  <div class="destination-option">
                    <span class="dest-code">{{ dest.value }}</span>
                    <span class="dest-name">{{ dest.label.split(' - ')[1] }}</span>
                  </div>
                </el-option>
              </el-select>

              <!-- 分组筛选下拉框 -->
              <el-select
                v-model="selectedGroupFilter"
                placeholder="グループ"
                clearable
                class="group-filter-dropdown"
                size="small"
                style="width: 100px"
                @change="handleGroupFilterChange"
                :disabled="!!singleDestination || selectedDestinations.length > 0"
              >
                <el-option
                  v-for="(group, index) in availableGroups"
                  :key="index"
                  :label="group.name"
                  :value="index"
                >
                  <div class="group-option">
                    <span class="group-name">{{ group.name }}</span>
                    <span class="group-count">({{ group.destinations.length }})</span>
                  </div>
                </el-option>
              </el-select>

              <!-- 分组管理按钮 -->
              <el-button
                @click="destinationDragDialogVisible = true"
                class="group-manage-button"
                size="small"
                :disabled="!!singleDestination || !!selectedGroupFilter"
              >
                <el-icon><Grid /></el-icon>
                <span v-if="activeGroups.length === 0">管理</span>
                <span v-else>{{ activeGroups.length }}選択</span>
              </el-button>
            </div>
          </div>

          <div class="filter-group status-group">
            <label class="filter-label">状態</label>
            <el-select
              v-model="filters.status"
              placeholder="選択"
              clearable
              class="modern-select"
              size="small"
              style="width: 80px"
            >
              <el-option label="未発行" value="未発行" />
              <el-option label="発行済" value="発行済" />
            </el-select>
          </div>

          <div class="filter-group actions-group">
            <el-button
              type="primary"
              @click="fetchData"
              :loading="loading"
              class="search-button compact-btn"
              size="small"
              :class="{ searching: searchAnimating }"
            >
              <el-icon v-if="!loading">
                <Search />
              </el-icon>
              <el-icon v-else>
                <Loading />
              </el-icon>
              {{ loading ? '検索中' : '検索' }}
            </el-button>
            <el-button @click="resetFilters" class="reset-button compact-btn" size="small">
              <el-icon>
                <Refresh />
              </el-icon>
              リセット
            </el-button>
          </div>
        </div>

        <!-- 活跃分组显示 -->
        <div v-if="activeGroups.length > 0" class="active-groups-display">
          <div class="groups-header">
            <span class="groups-title">
              <el-icon><Collection /></el-icon>
              選択中のグループ
            </span>
            <el-button
              size="small"
              type="danger"
              link
              @click="clearAllGroups"
              class="clear-groups-btn"
            >
              全てクリア
            </el-button>
          </div>
          <div class="groups-list">
            <div v-for="(group, index) in activeGroups" :key="index" class="group-tag">
              <span class="group-name">{{ group.name }}</span>
              <span class="group-count">{{ group.destinations.length }}件</span>
              <el-button
                size="small"
                type="danger"
                circle
                @click="removeGroup(index)"
                class="remove-group-btn"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 詳細検索条件 -->
        <div v-if="showAdvancedFilters" class="advanced-filters">
          <el-divider content-position="left" class="advanced-divider">
            <span class="divider-text">詳細検索</span>
          </el-divider>
          <el-row :gutter="20" class="filter-row">
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="出荷番号" class="modern-form-item">
                <el-input
                  v-model="filters.shipping_no"
                  placeholder="出荷番号"
                  clearable
                  class="modern-input"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="製品CD" class="modern-form-item">
                <el-input
                  v-model="filters.product_cd"
                  placeholder="製品CD"
                  clearable
                  class="modern-input"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="製品名" class="modern-form-item">
                <el-input
                  v-model="filters.product_name"
                  placeholder="製品名"
                  clearable
                  class="modern-input"
                />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="6" :lg="6">
              <el-form-item label="箱タイプ" class="modern-form-item">
                <el-select
                  v-model="filters.box_type"
                  placeholder="選択"
                  clearable
                  class="modern-select"
                  style="width: 100%"
                >
                  <el-option v-for="type in boxTypes" :key="type" :label="type" :value="type" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-form>
    </el-card>

    <!-- 一覧表 -->
    <el-card class="table-card modern-card">
      <template #header>
        <div class="table-header">
          <div class="table-title">
            <el-icon class="table-icon">
              <Document />
            </el-icon>
            <span>出荷リスト</span>
            <div class="count-badge" :class="{ 'animate-count': searchAnimating }">
              <el-icon class="count-icon">
                <Document />
              </el-icon>
              <span>{{ shippingList.length }}件</span>
            </div>
            <div v-if="totalSelectedCount > 0" class="selected-badge">
              <el-icon class="selected-icon">
                <Select />
              </el-icon>
              <span>{{ totalSelectedCount }}件選択中</span>
            </div>
          </div>
          <div class="header-buttons">
            <el-button type="primary" @click="openCreateDialog" class="action-button create-button">
              <el-icon>
                <Plus />
              </el-icon>
              出荷単作成
            </el-button>
            <el-button
              type="warning"
              @click="printSelected"
              :disabled="allSelectedIds.size === 0"
              class="action-button print-button"
            >
              <el-icon>
                <Printer />
              </el-icon>
              選択印刷
              <span class="button-badge" v-if="totalSelectedCount > 0">{{
                totalSelectedCount
              }}</span>
            </el-button>
            <el-button
              type="info"
              @click="columnSelectVisible = true"
              class="action-button setting-button"
            >
              <el-icon>
                <Setting />
              </el-icon>
              列表示設定
            </el-button>
            <el-button
              type="success"
              @click="exportPickingCSVData"
              :loading="exportLoading"
              class="action-button export-button"
            >
              <el-icon>
                <Download />
              </el-icon>
              ピッキング出力
            </el-button>
            <el-button
              type="warning"
              @click="openUnpickedDialog"
              class="action-button unpicked-button"
            >
              <el-icon>
                <Warning />
              </el-icon>
              未ピッキング検出
            </el-button>
          </div>
        </div>
      </template>

      <div class="table-wrapper">
        <el-table
          ref="tableRef"
          :data="displayedList"
          border
          highlight-current-row
          v-loading="loading"
          element-loading-text="データを読み込み中..."
          element-loading-background="rgba(255, 255, 255, 0.8)"
          class="modern-table"
          style="width: 100%"
          :empty-text="emptyText"
          @row-click="handleRowClick"
          :row-class-name="tableRowClassName"
          @selection-change="handleSelectionChange"
          @select="handleSelectRow"
          @select-all="handleSelectAll"
          :key="tableKey"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            label="出荷番号"
            prop="shipping_no"
            min-width="100"
            show-overflow-tooltip
            v-if="columnVisible.shipping_no"
            key="shipping_no"
          >
            <template #default="{ row }">
              <div class="shipping-no-cell">
                <el-tag type="info" effect="light" size="small">
                  {{ row.shipping_no }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="出荷日"
            prop="shipping_date"
            width="110"
            sortable
            v-if="columnVisible.shipping_date"
            key="shipping_date"
          >
            <template #default="{ row }">
              <div class="date-cell">
                <el-icon class="date-icon">
                  <Calendar />
                </el-icon>
                {{ formatDate(row.shipping_date) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="納入日"
            prop="delivery_date"
            width="110"
            sortable
            v-if="columnVisible.delivery_date"
            key="delivery_date"
          >
            <template #default="{ row }">
              <div class="date-cell">
                <el-icon class="date-icon">
                  <Calendar />
                </el-icon>
                {{ formatDate(row.delivery_date) }}
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="納入先"
            prop="destination_name"
            min-width="130"
            show-overflow-tooltip
            v-if="columnVisible.destination_name"
            key="destination_name"
          >
            <template #default="{ row }">
              <el-tooltip
                :content="`${row.destination_cd} - ${row.destination_name}`"
                placement="top"
                :show-after="500"
                effect="light"
              >
                <div class="destination-cell">
                  <el-icon class="location-icon">
                    <Location />
                  </el-icon>
                  <span>{{ row.destination_name }}</span>
                </div>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column
            label="製品CD"
            prop="product_cd"
            width="80"
            show-overflow-tooltip
            v-if="columnVisible.product_cd"
            key="product_cd"
          >
            <template #default="{ row }">
              <el-tooltip
                :content="row.product_name"
                placement="top"
                :show-after="500"
                effect="light"
              >
                <el-tag type="primary" effect="plain" size="small">
                  {{ row.product_cd }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column
            label="製品名"
            prop="product_name"
            min-width="120"
            show-overflow-tooltip
            v-if="columnVisible.product_name"
            key="product_name"
          >
            <template #default="{ row }">
              <div class="product-name-cell">
                <span>{{ row.product_name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="箱数"
            prop="confirmed_boxes"
            width="60"
            align="right"
            v-if="columnVisible.confirmed_boxes"
            key="confirmed_boxes"
          >
            <template #default="{ row }">
              <div class="number-cell">
                <span class="number-value">{{ (row.confirmed_boxes || 0).toLocaleString() }}</span>
                <span class="number-unit">箱</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="数量"
            prop="confirmed_units"
            width="90"
            align="right"
            v-if="columnVisible.confirmed_units"
            key="confirmed_units"
          >
            <template #default="{ row }">
              <div class="number-cell">
                <span class="number-value">{{ (row.confirmed_units || 0).toLocaleString() }}</span>
                <span class="number-unit">本</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="箱タイプ"
            prop="box_type"
            width="90"
            v-if="columnVisible.box_type"
            key="box_type"
          >
            <template #default="{ row }">
              <el-tag size="small" :type="getBoxTypeTagType(row.box_type)" effect="dark">
                {{ row.box_type || '未設定' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="コード" width="120" v-if="columnVisible.code" key="code">
            <template #default="{ row }">
              <el-tooltip
                :content="`${row.shipping_no}_${row.product_cd}`"
                placement="top"
                :show-after="500"
                effect="light"
              >
                <el-tag :type="statusColor(row.status)" effect="light" class="code-tag">
                  {{ row.shipping_no.substring(0, 6) }}_{{ row.product_cd }}
                </el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="状態" width="80" v-if="columnVisible.status" key="status">
            <template #default="{ row }">
              <el-tag :type="statusColor(row.status)" effect="dark" class="status-tag">
                <el-icon v-if="row.status === '発行済'" class="status-icon">
                  <Check />
                </el-icon>
                <el-icon v-else-if="row.status === '未発行'" class="status-icon">
                  <Clock />
                </el-icon>
                <el-icon v-else-if="row.status === 'キャンセル'" class="status-icon">
                  <Close />
                </el-icon>
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" key="actions">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-tooltip content="編集" placement="top" :show-after="500">
                  <el-button
                    size="small"
                    @click.stop="editShipping(row)"
                    type="primary"
                    class="table-action-button icon-only"
                    circle
                  >
                    <el-icon>
                      <Edit />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip content="印刷" placement="top" :show-after="500">
                  <el-button
                    size="small"
                    type="success"
                    @click.stop="printShipping(row)"
                    :loading="actionLoading"
                    class="table-action-button icon-only"
                    circle
                  >
                    <el-icon>
                      <Printer />
                    </el-icon>
                  </el-button>
                </el-tooltip>
                <el-tooltip
                  content="取消"
                  placement="top"
                  :show-after="500"
                  v-if="row.status !== 'キャンセル'"
                >
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="cancel(row)"
                    :loading="actionLoading"
                    class="table-action-button icon-only"
                    circle
                  >
                    <el-icon>
                      <Close />
                    </el-icon>
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- ページネーション -->
      <div class="pagination-container" v-if="shippingList.length">
        <div class="pagination-info">
          <span class="info-text">
            {{ (currentPage - 1) * pageSize + 1 }}-{{
              Math.min(currentPage * pageSize, shippingList.length)
            }}
            / {{ shippingList.length }}件
          </span>
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          :total="shippingList.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="modern-pagination"
        />
      </div>
    </el-card>

    <!-- 詳細ダイアログ -->
    <ShippingDetailDialog
      v-if="detailVisible && selectedItem"
      :shippingItem="selectedItem"
      @close="detailVisible = false"
      @refresh="fetchData"
    />

    <!-- 出荷単作成ダイアログ -->
    <ShippingCreateDialog
      v-if="createDialogVisible"
      @close="createDialogVisible = false"
      @submitted="handleShippingCreated"
    />

    <!-- 納入先拖拽分组选择ダイアログ -->
    <DestinationDragFilter
      v-model="destinationDragDialogVisible"
      :selectedDestinations="selectedDestinations"
      @confirm="handleDestinationGroupsConfirm"
    />

    <!-- 未ピッキング検出ダイアログ -->
    <UnpickedOrdersDialog
      v-model="unpickedDialogVisible"
      :destinationOptions="destinationOptions"
    />

    <!-- 列表示設定ダイアログ -->
    <el-dialog
      v-model="columnSelectVisible"
      title="列表示設定"
      width="600px"
      class="modern-dialog"
      :before-close="() => (columnSelectVisible = false)"
    >
      <div class="column-select-container">
        <div class="column-select-description">表示する列を選択してください</div>
        <div class="checkbox-grid">
          <el-checkbox v-model="columnVisible.shipping_no" class="modern-checkbox" size="large">
            出荷番号
          </el-checkbox>
          <el-checkbox v-model="columnVisible.shipping_date" class="modern-checkbox" size="large">
            出荷日
          </el-checkbox>
          <el-checkbox v-model="columnVisible.delivery_date" class="modern-checkbox" size="large">
            納入日
          </el-checkbox>
          <el-checkbox
            v-model="columnVisible.destination_name"
            class="modern-checkbox"
            size="large"
          >
            納入先
          </el-checkbox>
          <el-checkbox v-model="columnVisible.product_cd" class="modern-checkbox" size="large">
            製品CD
          </el-checkbox>
          <el-checkbox v-model="columnVisible.product_name" class="modern-checkbox" size="large">
            製品名
          </el-checkbox>
          <el-checkbox v-model="columnVisible.confirmed_boxes" class="modern-checkbox" size="large">
            箱数
          </el-checkbox>
          <el-checkbox v-model="columnVisible.confirmed_units" class="modern-checkbox" size="large">
            数量
          </el-checkbox>
          <el-checkbox v-model="columnVisible.box_type" class="modern-checkbox" size="large">
            箱タイプ
          </el-checkbox>
          <el-checkbox v-model="columnVisible.code" class="modern-checkbox" size="large">
            コード
          </el-checkbox>
          <el-checkbox v-model="columnVisible.status" class="modern-checkbox" size="large">
            状態
          </el-checkbox>
        </div>
        <div class="dialog-footer">
          <el-button @click="resetColumnVisibility" class="reset-button" size="default">
            <el-icon><Refresh /></el-icon>
            デフォルトに戻す
          </el-button>
          <el-button
            type="primary"
            @click="columnSelectVisible = false"
            class="confirm-button"
            size="default"
          >
            <el-icon><Check /></el-icon>
            確定
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import request from '@/utils/request'
import ShippingDetailDialog from './ShippingDetailDialog.vue'
import ShippingCreateDialog from './ShippingCreateDialog.vue'
import DestinationDragFilter from './components/DestinationDragFilter.vue'
import UnpickedOrdersDialog from './components/UnpickedOrdersDialog.vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import {
  Search,
  Refresh,
  Document,
  View,
  Check,
  Close,
  Van,
  Plus,
  Edit,
  Printer,
  Setting,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Download,
  Calendar,
  Location,
  Clock,
  Loading,
  SuccessFilled,
  WarningFilled,
  InfoFilled,
  Select,
  Grid,
  Collection,
  Warning,
} from '@element-plus/icons-vue'
import QRCode from 'qrcode'
import { exportPickingCSV } from '@/api/shipping/pickingExport'

// 定义接口
interface ShippingItem {
  id: number
  shipping_no: string
  shipping_date: string
  delivery_date: string | null
  destination_cd: string
  destination_name: string
  product_cd: string
  product_name: string
  product_alias: string | null
  box_type: string | null
  confirmed_boxes: number
  confirmed_units: number
  unit: string
  status: string
  remarks: string | null
  created_at: string
  updated_at: string
  [key: string]: any
}

interface FilterOptions {
  shipping_date: string
  delivery_date: string
  destination_cd: string
  product_cd: string
  product_name: string
  box_type: string
  status: string
  shipping_no: string
  end_date: string
}

// 状態
const today = new Date().toISOString().slice(0, 10)

const filters = ref<FilterOptions>({
  shipping_date: today,
  delivery_date: '',
  destination_cd: '',
  product_cd: '',
  product_name: '',
  box_type: '',
  status: '',
  shipping_no: '',
  end_date: today,
})

const dateRange = ref<[string, string]>([today, today])
const shippingList = ref<ShippingItem[]>([])
const detailVisible = ref(false)
const createDialogVisible = ref(false)
const unpickedDialogVisible = ref(false)
const selectedItem = ref<ShippingItem | null>(null)
const selectedRows = ref<ShippingItem[]>([])
const allSelectedIds = ref<Set<number>>(new Set()) // 跟踪所有选中项目的ID
const isSelectAllOperation = ref(false) // 标记是否正在进行全选操作
const loading = ref(false)
const actionLoading = ref(false)
const exportLoading = ref(false)
const pageLoading = ref(true)
const searchAnimating = ref(false)
const emptyText = computed(() => (loading.value ? '' : 'データがありません'))

// 表格更新键，用于强制重新渲染
const tableKey = ref(0)

// 納入先選択
const destinationDragDialogVisible = ref(false)
const destinationOptions = ref<{ value: string; label: string }[]>([])
const selectedDestinations = ref<string[]>([])
const destinationGroups = ref<any[]>([]) // 保存分组信息

// 单选納入先
const singleDestination = ref<string>('')

// 活跃的分组
const activeGroups = ref<any[]>([])

// 分组筛选选择
const selectedGroupFilter = ref<number | undefined>(undefined)

// 可用的分组（从localStorage加载）
const availableGroups = ref<any[]>([])

// 处理拖拽分组确认
const handleDestinationGroupsConfirm = (groups: any[], allSelected: string[]) => {
  destinationGroups.value = groups
  selectedDestinations.value = allSelected

  // 更新活跃分组（只显示有内容的分组）
  activeGroups.value = groups.filter((group) => group.destinations && group.destinations.length > 0)

  // 保存分组到localStorage并更新可用分组列表
  try {
    localStorage.setItem('destination_groups', JSON.stringify(groups))
    loadSavedGroups() // 重新加载可用分组
  } catch (error) {
    console.error('保存分组失败:', error)
  }

  // 更新筛选条件
  if (allSelected.length === 0) {
    filters.value.destination_cd = ''
  } else if (allSelected.length === 1) {
    filters.value.destination_cd = allSelected[0]
  } else {
    // 多选时，将所有选中的纳入先用逗号连接
    filters.value.destination_cd = allSelected.join(',')
  }

  // 自动执行搜索
  fetchData()

  ElMessage.success(
    `${activeGroups.value.length}個のグループから${allSelected.length}件の納入先を選択しました`,
  )
}

// 处理单选納入先变化
const handleSingleDestinationChange = (value: string) => {
  if (value) {
    // 单选納入先被选择
    selectedDestinations.value = [value]
    activeGroups.value = []
    destinationGroups.value = []
    selectedGroupFilter.value = undefined // 清除分组筛选下拉框的选择

    filters.value.destination_cd = value
    fetchData()
  } else {
    // 单选納入先被清除
    selectedDestinations.value = []
    filters.value.destination_cd = ''
    fetchData()
  }
}

// 清空所有分组
const clearAllGroups = () => {
  activeGroups.value = []
  selectedDestinations.value = []
  destinationGroups.value = []
  filters.value.destination_cd = ''

  ElMessage.success('全てのグループをクリアしました')
  fetchData()
}

// 移除单个分组
const removeGroup = (index: number) => {
  const removedGroup = activeGroups.value[index]
  activeGroups.value.splice(index, 1)

  // 重新计算选中的納入先
  const allSelected = activeGroups.value.reduce((acc: string[], group) => {
    return acc.concat(group.destinations.map((dest: any) => dest.value))
  }, [])

  selectedDestinations.value = allSelected

  // 更新筛选条件
  if (allSelected.length === 0) {
    filters.value.destination_cd = ''
  } else if (allSelected.length === 1) {
    filters.value.destination_cd = allSelected[0]
  } else {
    filters.value.destination_cd = allSelected.join(',')
  }

  ElMessage.success(`${removedGroup.name} を削除しました`)
  fetchData()
}

// 处理分组筛选变化
const handleGroupFilterChange = (groupIndex: number | undefined) => {
  if (groupIndex !== undefined && availableGroups.value[groupIndex]) {
    const selectedGroup = availableGroups.value[groupIndex]
    const groupDestinations = selectedGroup.destinations.map((dest: any) => dest.value)

    // 更新选择状态
    singleDestination.value = ''
    selectedDestinations.value = groupDestinations
    activeGroups.value = []

    // 更新筛选条件 - 让fetchData能够正确处理
    if (groupDestinations.length > 0) {
      filters.value.destination_cd = groupDestinations.join(',')
    } else {
      filters.value.destination_cd = ''
    }

    // 自动执行搜索
    fetchData()

    if (groupDestinations.length > 0) {
      ElMessage.success(
        `グループ「${selectedGroup.name}」で絞り込みました（${groupDestinations.length}件）`,
      )
    }
  } else {
    // 清除分组筛选
    selectedDestinations.value = []
    filters.value.destination_cd = ''
    fetchData()
  }
}

// 加载保存的分组
const loadSavedGroups = () => {
  try {
    const savedGroups = localStorage.getItem('destination_groups')
    if (savedGroups) {
      const groups = JSON.parse(savedGroups)
      // 只显示有内容的分组
      availableGroups.value = groups.filter(
        (group: any) => group.destinations && group.destinations.length > 0,
      )
    }
  } catch (error) {
    console.error('加载已保存分组失败:', error)
    availableGroups.value = []
  }
}

// 日期快捷操作相关

// 计算选中的出荷番号数量 - 基于所有选中的项目
const selectedShippingNos = computed(() => {
  const selectedItems = shippingList.value.filter((item) => allSelectedIds.value.has(item.id))
  const uniqueShippingNos = new Set(selectedItems.map((row) => row.shipping_no))
  return uniqueShippingNos.size
})

// 计算当前分页中已选中的项目
const currentPageSelectedRows = computed(() => {
  return displayedList.value.filter((item) => allSelectedIds.value.has(item.id))
})

// 计算总选中项目数量
const totalSelectedCount = computed(() => {
  return allSelectedIds.value.size
})

// 页面加载动画
const handlePageLoad = async () => {
  pageLoading.value = true
  await nextTick()
  setTimeout(() => {
    pageLoading.value = false
  }, 800)
}

// 詳細検索の表示状態
const showAdvancedFilters = ref(false)

// ページネーション
const currentPage = ref(1)
const pageSize = ref(20)
const displayedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return shippingList.value.slice(start, end)
})

// 箱タイプのリスト
const boxTypes = ref(['小箱', '大箱', 'TP箱', '特殊'])

// QRコードのキャッシュ
const qrCodeCache: Record<string, string> = {}

// QRコード生成関数
async function generateQRCodeAsync(text: string): Promise<string> {
  try {
    if (qrCodeCache[text]) {
      return qrCodeCache[text]
    }
    const dataUrl = await QRCode.toDataURL(text, {
      width: 100,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    qrCodeCache[text] = dataUrl
    return dataUrl
  } catch (err) {
    console.error('QRコード生成エラー:', err)
    return ''
  }
}

// 箱タイプのタグカラー
function getBoxTypeTagType(boxType: string): 'success' | 'warning' | 'info' | 'danger' | 'primary' {
  if (!boxType || boxType === '未設定') return 'info'
  switch (boxType) {
    case '小箱':
      return 'success'
    case '大箱':
      return 'warning'
    case 'TP箱':
      return 'info'
    case '特殊':
      return 'danger'
    default:
      return 'primary'
  }
}

// ステータス色
function statusColor(status: string): 'info' | 'success' | 'warning' | 'danger' | 'primary' {
  if (!status) return 'info'

  switch (status) {
    case '未発行':
      return 'info'
    case '発行済':
      return 'success'
    case '出荷済':
      return 'warning'
    case 'キャンセル':
      return 'danger'
    default:
      return 'info'
  }
}

// 行スタイル
function tableRowClassName({ row }: { row: ShippingItem }): string {
  if (row.status === 'キャンセル') {
    return 'canceled-row'
  }
  return ''
}

// 日付フォーマット
function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-')
  } catch (e) {
    return dateStr
  }
}

// 日付と曜日のフォーマット（印刷用）
function formatDateWithWeekday(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const weekdays = ['日', '月', '火', '水', '木', '金', '土']
    const formattedDate = date
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '-')
    const weekday = weekdays[date.getDay()]
    return `${formattedDate} (${weekday})`
  } catch (e) {
    return dateStr
  }
}

// 行クリック - 避免与选择冲突，只在非选择列区域触发
function handleRowClick(row: ShippingItem, column: any): void {
  // 如果点击的是选择列，不触发编辑
  if (column && column.type === 'selection') {
    return
  }
  editShipping(row)
}

// ページサイズ変更
function handleSizeChange(newSize: number): void {
  pageSize.value = newSize
  currentPage.value = 1
  // 分页大小变更后，同步当前分页的选择状态
  nextTick(() => {
    syncCurrentPageSelection()
  })
}

// 同步当前分页的选择状态
function syncCurrentPageSelection(): void {
  if (!tableRef.value) return

  displayedList.value.forEach((row) => {
    const isSelected = allSelectedIds.value.has(row.id)
    tableRef.value?.toggleRowSelection(row, isSelected)
  })
}

// ページ変更
function handleCurrentChange(newPage: number): void {
  currentPage.value = newPage
  // 分页切换后，同步当前分页的选择状态
  nextTick(() => {
    syncCurrentPageSelection()
  })
}

// 選択された行の処理 - 出荷番号でグループ化
function handleSelectionChange(rows: ShippingItem[]): void {
  selectedRows.value = rows

  // 只在不是全选操作时更新全局选中状态
  if (!isSelectAllOperation.value) {
    // 先移除当前分页中所有项目的选中状态
    displayedList.value.forEach((item) => {
      allSelectedIds.value.delete(item.id)
    })

    // 然后添加当前选中项目的ID
    rows.forEach((item) => {
      allSelectedIds.value.add(item.id)
    })
  }
}

// 表格引用
const tableRef = ref()

// 手动选择处理 - 支持按出荷番号分组选择
function handleSelectRow(selection: ShippingItem[], row: ShippingItem): void {
  const isSelected = selection.some((item) => item.id === row.id)

  // 获取所有相同出荷番号的行（包括不在当前分页的）
  const sameShippingNoRows = shippingList.value.filter(
    (item) => item.shipping_no === row.shipping_no,
  )

  // 获取当前分页中相同出荷番号的行
  const currentPageSameRows = displayedList.value.filter(
    (item) => item.shipping_no === row.shipping_no,
  )

  if (isSelected) {
    // 如果当前行被选中，则选中所有相同出荷番号的行（包括其他分页的）
    sameShippingNoRows.forEach((item) => {
      allSelectedIds.value.add(item.id)
    })

    // 同步当前分页的选择状态
    currentPageSameRows.forEach((item) => {
      if (!selection.some((selected) => selected.id === item.id)) {
        tableRef.value?.toggleRowSelection(item, true)
      }
    })

    // 如果同一出荷番号有多个产品，显示提示
    if (sameShippingNoRows.length > 1) {
      ElMessage({
        message: `出荷番号 ${row.shipping_no} の${sameShippingNoRows.length}件の製品を選択しました`,
        type: 'info',
        duration: 2000,
        showClose: true,
      })
    }
  } else {
    // 如果当前行被取消选中，则取消选中所有相同出荷番号的行（包括其他分页的）
    sameShippingNoRows.forEach((item) => {
      allSelectedIds.value.delete(item.id)
    })

    // 同步当前分页的选择状态
    currentPageSameRows.forEach((item) => {
      tableRef.value?.toggleRowSelection(item, false)
    })

    // 如果同一出荷番号有多个产品，显示提示
    if (sameShippingNoRows.length > 1) {
      ElMessage({
        message: `出荷番号 ${row.shipping_no} の${sameShippingNoRows.length}件の製品の選択を解除しました`,
        type: 'info',
        duration: 2000,
        showClose: true,
      })
    }
  }
}

// 全选处理 - 选择所有筛选结果
function handleSelectAll(selection: ShippingItem[]): void {
  isSelectAllOperation.value = true // 标记开始全选操作

  const isAllCurrentPageSelected = selection.length === displayedList.value.length

  if (isAllCurrentPageSelected) {
    // 当前分页全选时，选中所有筛选结果
    shippingList.value.forEach((item) => {
      allSelectedIds.value.add(item.id)
    })

    ElMessage({
      message: `全ての検索結果 ${shippingList.value.length}件を選択しました`,
      type: 'success',
      duration: 3000,
      showClose: true,
    })
  } else {
    // 取消全选时，清空所有选择
    allSelectedIds.value.clear()

    ElMessage({
      message: '全ての選択を解除しました',
      type: 'info',
      duration: 2000,
      showClose: true,
    })
  }

  // 重置标志
  nextTick(() => {
    isSelectAllOperation.value = false
  })
}

// 日付範囲の変更処理
function handleDateRangeChange(range: [string, string] | null): void {
  if (range && range.length === 2) {
    filters.value.shipping_date = range[0]
    // 明示的にend_dateを設定しない（fetchData内で処理するため）
  } else {
    filters.value.shipping_date = ''
  }
}

// フィルターリセット
function resetFilters(): void {
  dateRange.value = [today, today]
  filters.value = {
    shipping_date: today,
    delivery_date: '',
    destination_cd: '',
    product_cd: '',
    product_name: '',
    box_type: '',
    status: '',
    shipping_no: '',
    end_date: today,
  }
  selectedDestinations.value = []
  activeGroups.value = []
  destinationGroups.value = []
  singleDestination.value = ''
  selectedGroupFilter.value = undefined
  fetchData()
}

// データ取得
async function fetchData(): Promise<void> {
  loading.value = true
  searchAnimating.value = true

  try {
    // 添加搜索动画延迟
    await new Promise((resolve) => setTimeout(resolve, 300))

    // 构建查询参数，移除空值
    const queryParams = Object.entries(filters.value).reduce(
      (acc: Record<string, string>, [key, value]) => {
        if (value && value.toString().trim() !== '') {
          // 确保所有值都被转换为字符串
          acc[key] = value.toString()
        }
        return acc
      },
      {},
    )

    // 如果有日期范围，添加结束日期
    if (dateRange.value && dateRange.value.length === 2 && dateRange.value[1]) {
      queryParams.end_date = dateRange.value[1]
    }

    // shipping_itemsテーブルからデータを取得
    const res = await request.get('/api/shipping/items', { params: queryParams })

    // データの整形処理
    shippingList.value = Array.isArray(res)
      ? res.map((item: any) => {
          // 各フィールドの存在確認とデフォルト値設定
          return {
            ...item,
            // 基本字段确保存在
            id: item.id || 0,
            shipping_no: item.shipping_no || '',
            shipping_date: item.shipping_date || '',
            destination_cd: item.destination_cd || '',
            destination_name: item.destination_name || '',
            product_cd: item.product_cd || '',
            // 納入日がnullの場合は空文字列を設定
            delivery_date: item.delivery_date || '',
            // 箱タイプがnullの場合は「未設定」を設定
            box_type: item.box_type || '未設定',
            // 箱数がnullの場合は0を設定
            confirmed_boxes: Number(item.confirmed_boxes) || 0,
            // 数量确保是数字
            confirmed_units: Number(item.confirmed_units) || 0,
            // 状態が設定されていない場合は「未発行」を設定
            status: item.status || '未発行',
            // 製品名が設定されていない場合は製品CDを使用
            product_name: item.product_name || item.product_cd || '',
            // 単位が設定されていない場合は「本」を設定
            unit: item.unit || '本',
            // 備考がnullの場合は空文字列を設定
            remarks: item.remarks || '',
            // 时间戳字段
            created_at: item.created_at || '',
            updated_at: item.updated_at || '',
          }
        })
      : []

    // 初始ページに戻す
    currentPage.value = 1

    // 强制更新表格
    tableKey.value++

    // 清空选择状态（因为数据已更新）
    allSelectedIds.value.clear()
    selectedRows.value = []

    // 使用通知而不是消息，提供更好的视觉反馈
    if (shippingList.value.length === 0) {
      ElNotification({
        title: '検索結果',
        message: '検索条件に一致する出荷データはありません',
        type: 'info',
        duration: 3000,
        position: 'top-right',
      })
    } else {
      ElNotification({
        title: '検索完了',
        message: `${shippingList.value.length}件の出荷データを取得しました`,
        type: 'success',
        duration: 3000,
        position: 'top-right',
      })
    }
  } catch (error) {
    console.error('出荷データの取得に失敗しました:', error)
    ElNotification({
      title: 'エラー',
      message: '出荷データの取得に失敗しました',
      type: 'error',
      duration: 4000,
      position: 'top-right',
    })
    shippingList.value = []
  } finally {
    loading.value = false
    searchAnimating.value = false
  }
}

// 編集処理
function editShipping(row: ShippingItem): void {
  // 检查编辑权限
  if (row.status === 'キャンセル') {
    ElMessage.warning('キャンセル済みの出荷は編集できません')
    return
  }

  // 显示编辑前的确认信息
  ElMessageBox.confirm(
    `出荷番号 ${row.shipping_no} の編集を開始しますか？\n\n` +
      '編集可能な項目：\n' +
      '• 製品情報（名称、数量、箱数、箱タイプ、備考）\n' +
      '• 出荷番号（関連テーブルも同時更新）\n' +
      '• 納入先情報\n\n' +
      '注意：編集は関連するピッキング情報にも影響します。',
    '編集確認',
    {
      confirmButtonText: '編集開始',
      cancelButtonText: 'キャンセル',
      type: 'info',
      customClass: 'edit-confirm-dialog',
    },
  )
    .then(() => {
      selectedItem.value = { ...row } // 确保使用对象的副本
      detailVisible.value = true
    })
    .catch(() => {
      // 用户取消，不做任何操作
    })
}

// 発行処理
async function issue(row: ShippingItem): Promise<void> {
  try {
    actionLoading.value = true
    await ElMessageBox.confirm('この出荷を発行しますか？', '確認', {
      confirmButtonText: '発行',
      cancelButtonText: 'キャンセル',
      type: 'info',
    })

    try {
      // 出荷番号を発行
      await request.post(`/api/shipping/${row.shipping_no}/issue`)

      ElMessage.success('出荷番号を発行しました')
      await fetchData() // データを再取得
    } catch (apiError) {
      console.error('API呼び出しエラー:', apiError)
      ElMessage.error('発行処理に失敗しました')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('発行処理に失敗しました:', error)
      ElMessage.error('発行処理に失敗しました')
    }
  } finally {
    actionLoading.value = false
  }
}

// 单个出荷データを印刷 - 同一出荷番号の全ての製品を印刷
async function printShipping(row: ShippingItem): Promise<void> {
  actionLoading.value = true
  try {
    // 同じ出荷番号の全ての製品を取得
    const sameShippingNoItems = shippingList.value.filter(
      (item) => item.shipping_no === row.shipping_no,
    )

    // 事前にQRコードを生成
    await prepareQRCodes(sameShippingNoItems)

    // 印刷用のHTMLを生成
    const printContent = generatePrintHTML(sameShippingNoItems)

    // 印刷用のiframeを作成
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'absolute'
    printFrame.style.top = '-1000px'
    printFrame.style.left = '-1000px'
    document.body.appendChild(printFrame)

    // iframe内にHTMLを書き込み
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
      frameDoc.write(printContent)
      frameDoc.close()

      // 印刷処理
      setTimeout(() => {
        printFrame.contentWindow?.print()
        // 印刷ダイアログが閉じられた後にiframeを削除
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 500)
    }

    // 印刷記録をデータベースに保存し、状態を更新
    try {
      await request.post('/api/shipping/print-record', {
        shipping_numbers: [row.shipping_no],
      })

      ElMessage.success(
        `出荷番号: ${row.shipping_no} (${sameShippingNoItems.length}件の製品) を印刷し、記録を保存しました`,
      )

      // データを再取得して最新状態を反映
      await fetchData()
    } catch (recordError) {
      console.error('印刷記録の保存に失敗しました:', recordError)
      ElMessage.warning(
        `印刷は完了しましたが、記録の保存に失敗しました: ${(recordError as any)?.message || '不明なエラー'}`,
      )
    }
  } catch (error) {
    console.error('印刷処理に失敗しました:', error)
    ElMessage.error('印刷処理に失敗しました')
  } finally {
    actionLoading.value = false
  }
}

// キャンセル処理
async function cancel(row: ShippingItem): Promise<void> {
  try {
    actionLoading.value = true
    await ElMessageBox.confirm(
      'この出荷をキャンセルしますか？\n注意：関連する注文データの出荷番号も削除されます。',
      '確認',
      {
        confirmButtonText: 'キャンセル',
        cancelButtonText: '戻る',
        type: 'warning',
      },
    )

    try {
      // 出荷データをキャンセル - この操作で内部的にorder_dailyテーブルの出荷番号もクリアされます
      await request.post(`/api/shipping/${row.shipping_no}/cancel`)

      // 成功メッセージを表示して、データを再取得
      ElMessage.success('キャンセル処理が完了しました')
      await fetchData()
    } catch (apiError) {
      console.error('API呼び出しエラー:', apiError)
      ElMessage.error('キャンセル処理に失敗しました')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('キャンセル処理に失敗しました:', error)
      ElMessage.error('キャンセル処理に失敗しました')
    }
  } finally {
    actionLoading.value = false
  }
}

// 出荷単作成ダイアログを開く
function openCreateDialog(): void {
  createDialogVisible.value = true
}

// 未ピッキング検出ダイアログを開く
function openUnpickedDialog(): void {
  unpickedDialogVisible.value = true
}

// 出荷単作成完了処理
function handleShippingCreated(): void {
  ElNotification({
    title: '作成完了',
    message: '出荷単を作成しました',
    type: 'success',
    duration: 3000,
    position: 'top-right',
  })
  fetchData()
}

// 選択された出荷データを印刷 - 出荷番号でグループ化
async function printSelected(): Promise<void> {
  if (allSelectedIds.value.size === 0) {
    ElMessage.warning('印刷する出荷データを選択してください')
    return
  }

  actionLoading.value = true
  try {
    // 获取所有选中的项目
    const selectedItems = shippingList.value.filter((item) => allSelectedIds.value.has(item.id))

    // 選択された行から出荷番号を取得
    const selectedShippingNumbers = new Set(selectedItems.map((row) => row.shipping_no))

    // 各出荷番号の全ての製品を取得
    const allItemsToPrint: ShippingItem[] = []
    selectedShippingNumbers.forEach((shippingNo) => {
      const itemsForShipping = shippingList.value.filter((item) => item.shipping_no === shippingNo)
      allItemsToPrint.push(...itemsForShipping)
    })

    // 事前にQRコードを生成
    await prepareQRCodes(allItemsToPrint)

    // 印刷用のHTMLを生成
    const printContent = generatePrintHTML(allItemsToPrint)

    // 印刷用のiframeを作成
    const printFrame = document.createElement('iframe')
    printFrame.style.position = 'absolute'
    printFrame.style.top = '-1000px'
    printFrame.style.left = '-1000px'
    document.body.appendChild(printFrame)

    // iframe内にHTMLを書き込み
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow?.document
    if (frameDoc) {
      frameDoc.open()
      frameDoc.write(printContent)
      frameDoc.close()

      // 印刷処理
      setTimeout(() => {
        printFrame.contentWindow?.print()
        // 印刷ダイアログが閉じられた後にiframeを削除
        setTimeout(() => {
          document.body.removeChild(printFrame)
        }, 1000)
      }, 500)
    }

    // 印刷記録をデータベースに保存し、状態を更新
    try {
      await request.post('/api/shipping/print-record', {
        shipping_numbers: Array.from(selectedShippingNumbers),
      })

      ElMessage.success(
        `${selectedShippingNumbers.size}件の出荷番号 (計${allItemsToPrint.length}製品) を印刷し、記録を保存しました`,
      )

      // データを再取得して最新状態を反映
      await fetchData()
    } catch (recordError) {
      console.error('印刷記録の保存に失敗しました:', recordError)
      ElMessage.warning(
        `印刷は完了しましたが、記録の保存に失敗しました: ${(recordError as any)?.message || '不明なエラー'}`,
      )
    }
  } catch (error) {
    console.error('印刷処理に失敗しました:', error)
    ElMessage.error('印刷処理に失敗しました')
  } finally {
    actionLoading.value = false
  }
}

// 同步的にQRコードを生成する関数
function generateQRCode(text: string): string {
  try {
    // キャッシュにあれば、それを使用
    if (qrCodeCache[text]) {
      return qrCodeCache[text].split(',')[1] // Base64部分のみ取得
    }
    // なければ空の画像を返す（非同期処理の結果を待てないため）
    return ''
  } catch (err) {
    console.error('QRコード生成エラー:', err)
    return ''
  }
}

// 印刷前にすべてのQRコードを事前生成
async function prepareQRCodes(items: ShippingItem[]): Promise<void> {
  const qrTexts: string[] = []

  // 必要なQRコードのテキストを収集
  items.forEach((item) => {
    const qrText = `${item.shipping_no}_${item.product_cd}`
    if (!qrCodeCache[qrText]) {
      qrTexts.push(qrText)
    }
  })

  // 並列で生成
  await Promise.all(
    qrTexts.map(async (text) => {
      qrCodeCache[text] = await generateQRCodeAsync(text)
    }),
  )
}

// 印刷用HTMLの生成
function generatePrintHTML(items: ShippingItem[]): string {
  const title = '出荷リスト'
  const date = new Date().toLocaleDateString('ja-JP')

  // 同じ出荷番号ごとにグループ化
  const groupedByShippingNo: Record<string, ShippingItem[]> = {}

  items.forEach((item) => {
    if (!groupedByShippingNo[item.shipping_no]) {
      groupedByShippingNo[item.shipping_no] = []
    }
    groupedByShippingNo[item.shipping_no].push(item)
  })

  // 出荷番号ごとに1ページずつ印刷するための設定

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <meta charset="utf-8">
      <style>
        @page {
          size: A4;
          margin: 10mm;
          margin-top: 2cm;
        }
        body {
          font-family: '游ゴシック','Arial', 'Hiragino Sans', 'Meiryo', sans-serif;
          margin: 0;
          padding: 0;
          background-color: white;
          color: black;
        }
        .page {
          page-break-after: always;
          page-break-inside: avoid;
          padding: 20px;
          position: relative;
          min-height: 257mm; /* A4サイズから余白を引いた高さ */
          display: flex;
          flex-direction: column;
          margin-top: 0;
          box-sizing: border-box;
        }
        .page:first-child {
          margin-top: 0;
        }

        /* 上部スタイル */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 15px;
          border-bottom: 1px solid #000;
          margin-bottom: 20px;
        }
        .shipping-no-left {
          font-size: 13px;
          font-weight: normal;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
        }

        .shipping-date-right {
          font-size: 33px;
          font-weight: bold;
          text-align: right;
          line-height: 1.2;
        }

        /* 中部スタイル */
        .page-content {
          flex: 1;
        }
        .section {
        text-align: right;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: bold;
          text-align: left;
          margin-top: 5px;
          margin-bottom: 10px;
          padding: 5px;
          background-color: #f2f2f2;
          border-left: 5px solid #333;
        }
        .destination-section {
          margin-bottom: 20px;
        }
        .destination-name {
          font-size: 50px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 5px;
        }
        .destination-code {
          font-size: 14px;
        }
        .company-section {
          margin-bottom: 20px;
        }
        .company-name {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 5px;
        }
        .company-address, .company-tel {
          font-size: 14px;
          margin-bottom: 3px;
        }
        .delivery-section {
          margin-bottom: 1px;
        }
        .delivery-date {
          font-size: 16px;
          font-weight: bold;
        }
        .products-title {
          margin-top: 25px;
          margin-bottom: 10px;
        }

        /* テーブルスタイル */
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 5px 0 5px 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px;
          text-align: left;
          font-size: 14px;
          font-weight: bold;

        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
          td{
          font-size: 30px;
          }
        .text-right {
          text-align: center;
        }
        .text-center {
          text-align: center;
        }

        /* 合計セクション */
        .totals-section {
          display: table;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        .totals-row {
          display: table-row;
        }
        .total-cell {
          display: table-cell;
          border: 1px solid #000;
          padding: 2px;
          text-align: center;
          font-size: 30px;
          font-weight: bold;

          vertical-align: middle;
        }
        .total-cell.product-name {
          text-align: right;
          font-size: 30px;
          font-weight: bold;

          font-weight: bold;
        }
        .total-cell.code {
          font-size: 16px;
        }

        /* 下部スタイル */
        .page-footer {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #000;
          padding-top: 10px;
          margin-top: 20px;
          font-size: 12px;
        }
        .shipping-no-suffix {
          font-weight: bold;
          font-size: 16px;
        }

        /* QRコード */
        .qrcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .qrcode-text {
          font-size: 10px;
          margin-top: 5px;
          word-break: break-all;
        }
        .status-cell {
          width: 80px;
        }
        .status-tag {
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: bold;
          display: inline-block;
        }
        .status-issued {
          background-color: #67c23a;
          color: white;
        }
        .status-not-issued {
          background-color: #909399;
          color: white;
        }
        @media print {
          body {
            padding: 0;
            margin: 0;
          }
          .no-print {
            display: none;
          }
          .page {
            page-break-after: always;
            page-break-before: auto;
            page-break-inside: avoid;
            margin-top: 0 !important;
            padding-top: 20px !important;
          }
          .page:first-child {
            page-break-before: avoid;
          }
        }
      </style>
    </head>
    <body>
  `

  // 出荷番号ごとにページを作成
  Object.entries(groupedByShippingNo).forEach(([shippingNo, groupItems]) => {
    // 各グループの最初のアイテムから情報を取得
    const firstItem = groupItems[0]

    // 合計箱数と本数を計算
    let totalBoxes = 0
    let totalUnits = 0
    groupItems.forEach((item) => {
      totalBoxes += item.confirmed_boxes || 0
      totalUnits += item.confirmed_units
    })

    // 現在の日時を取得
    const now = new Date()
    const currentDateTime =
      now.toLocaleDateString('ja-JP') +
      ' ' +
      now.getHours().toString().padStart(2, '0') +
      ':' +
      now.getMinutes().toString().padStart(2, '0')

    // 出荷番号の後ろ3桁
    const shippingNoLast3 = shippingNo.slice(-2)

    // 状態の判定（発行履歴があれば「発行済」）
    const status = firstItem.status || '未発行'

    html += `
      <div class="page">
        <!-- 上部 -->
        <div class="page-header">
          <div class="shipping-no-left">
            <div>管理番号: ${shippingNo}</div>
          </div>
          <div class="shipping-date-right">出荷日: ${formatDateWithWeekday(firstItem.shipping_date)}</div>
        </div>

        <!-- 中部 -->
        <div class="page-content">
          <!-- 第1層: 納入先 -->
          <div class="section destination-section">
            <div class="section-title">納入先</div>
            <div class="destination-name">${firstItem.destination_name} 御中</div>

          </div>

          <!-- 第2層: 会社情報 -->
          <div class="section company-section">
            <div class="company-name">日鉄物産荒井オートモーティブ(株)</div>
            <div class="company-address">〒496-0902 愛知県愛西市須依町2189</div>
            <div class="company-tel">TEL: 0567-28-4171 FAX: 0567-28-2281</div>
          </div>

          <!-- 第3層: 納入日 -->
          <div class="section delivery-section">
            <div class="shipping-date-right">納入日: ${formatDateWithWeekday(firstItem.delivery_date)}</div>
          </div>

          <!-- 第4層: 出荷構成品タイトル -->
          <div class="section-title products-title">出荷構成品</div>

          <!-- 第5層: 製品リスト -->
          <table>
            <thead>
              <tr>
              <th>製品名</th>
              <th class="text-right">箱数</th>
              <th class="text-right">数量</th>
              <th>コード</th>
              </tr>
            </thead>
            <tbody>
    `

    // 同じ出荷番号の製品を表示
    groupItems.forEach((item) => {
      html += `
        <tr>

          <td>${item.product_name}</td>
          <td class="text-right">${(item.confirmed_boxes || 0).toLocaleString()}</td>
          <td class="text-right">${item.confirmed_units.toLocaleString()}</td>

          <td class="text-center">
            <div class="qrcode-container">
              <img src="data:image/png;base64,${generateQRCode(`${shippingNo}_${item.product_cd}`)}" alt="QRコード" width="40" height="40" />

            </div>
          </td>

        </tr>
      `
    })

    html += `
          </tbody>
        </table>
        </div>

        <!-- 第6層: 合計 -->
        <div class="totals-section">
          <div class="totals-row">
            <div class="total-cell product-name">合計:</div>
            <div class="total-cell">${totalBoxes.toLocaleString()}箱</div>
            <div class="total-cell">${totalUnits.toLocaleString()}本</div>
            <div class="total-cell code">確認</div>
          </div>
        </div>

        <!-- 下部 -->
        <div class="page-footer">
          <div class="print-datetime">発行日時: ${currentDateTime}</div>
          <div class="shipping-no-suffix">パレット番号${shippingNoLast3}</div>
        </div>
      </div>
    `
  })

  html += `
      <div class="no-print">
        <button onclick="window.print()">印刷</button>
        <button onclick="window.close()">閉じる</button>
      </div>
    </body>
    </html>
  `

  return html
}

// 初期データ取得
onMounted(async () => {
  await handlePageLoad()
  await fetchDestinations()
  loadSavedGroups() // 加载保存的分组
  await fetchData()
})

// 納入先データ取得
async function fetchDestinations(): Promise<void> {
  try {
    const response = await request.get('/api/master/options/destination-options')

    // 处理两种可能的响应格式
    let dataArray: any[] = []

    if (Array.isArray(response)) {
      // 直接返回数组的情况
      dataArray = response
    } else if (response && response.success === true && Array.isArray(response.data)) {
      // 返回对象包含data字段的情况
      dataArray = response.data
    } else if (response && Array.isArray(response.data)) {
      // 返回对象包含data字段但没有success字段的情况
      dataArray = response.data
    } else {
      console.error('納入先データ格式不正确:', response)
      ElMessage.error('納入先データの取得に失敗しました')
      return
    }

    destinationOptions.value = dataArray.map((item: any) => ({
      value: item.cd,
      label: `${item.cd} - ${item.name}`,
    }))
  } catch (error) {
    console.error('获取納入先失败:', error)
    ElMessage.error('納入先データの取得に失敗しました')
  }
}

// 列表示設定
const columnSelectVisible = ref(false)
const columnVisible = ref(loadColumnVisibility())

// 列表示設定の読み込み
function loadColumnVisibility(): Record<string, boolean> {
  try {
    const savedSettings = localStorage.getItem('shippingListColumnSettings')
    if (savedSettings) {
      return JSON.parse(savedSettings)
    }
  } catch (error) {
    // 設定読み込み失敗時はデフォルト設定を使用
  }

  // デフォルト設定
  return {
    shipping_no: true,
    shipping_date: true,
    delivery_date: true,
    destination_name: true,
    product_cd: true,
    product_name: true,
    confirmed_boxes: true,
    confirmed_units: true,
    box_type: true,
    code: true,
    status: true,
  }
}

// 列表示設定の保存
function saveColumnVisibility(): void {
  try {
    localStorage.setItem('shippingListColumnSettings', JSON.stringify(columnVisible.value))
  } catch (error) {
    // 設定保存失敗時は無視
  }
}

// 列表示設定をデフォルトに戻す
function resetColumnVisibility(): void {
  columnVisible.value = {
    shipping_no: true,
    shipping_date: true,
    delivery_date: true,
    destination_name: true,
    product_cd: true,
    product_name: true,
    confirmed_boxes: true,
    confirmed_units: true,
    box_type: true,
    code: true,
    status: true,
  }
  saveColumnVisibility()
}

// 列表示設定が変更されたら保存
watch(
  columnVisible,
  () => {
    saveColumnVisibility()
  },
  { deep: true },
)

// 监听分页数据变化，同步选择状态
watch(
  displayedList,
  () => {
    nextTick(() => {
      syncCurrentPageSelection()
    })
  },
  { flush: 'post' },
)

// 詳細検索の表示切り替え
function toggleAdvancedFilters(): void {
  showAdvancedFilters.value = !showAdvancedFilters.value
}

// 日期快捷操作函数
function adjustDate(days: number): void {
  const currentStart = dateRange.value[0] ? new Date(dateRange.value[0]) : new Date()
  const currentEnd = dateRange.value[1] ? new Date(dateRange.value[1]) : new Date()

  currentStart.setDate(currentStart.getDate() + days)
  currentEnd.setDate(currentEnd.getDate() + days)

  dateRange.value = [
    currentStart.toISOString().split('T')[0],
    currentEnd.toISOString().split('T')[0],
  ]

  handleDateRangeChange(dateRange.value)
}

function setToday(): void {
  dateRange.value = [today, today]
  handleDateRangeChange(dateRange.value)
}

// 納入先選択関連函数
function getDestinationLabel(code: string): string {
  const dest = destinationOptions.value.find((d) => d.value === code)
  return dest ? `${dest.value} - ${dest.label}` : code
}

// ピッキングCSV导出功能
async function exportPickingCSVData(): Promise<void> {
  try {
    exportLoading.value = true

    await ElMessageBox.confirm(
      'ピッキングデータを、CSVファイルとして、フォルダに保存します。\n実行しますか?',
      '確認',
      {
        confirmButtonText: '実行',
        cancelButtonText: 'キャンセル',
        type: 'info',
      },
    )

    const response = await exportPickingCSV()

    // 拦截器已经处理了错误情况，能到这里说明API调用成功
    // response就是后端返回的data部分
    const { copiedCount, totalDataCount, fileName } = response

    ElMessage.success({
      message: `エクスポート完了！\n新規データ: ${copiedCount}件\n総データ数: ${totalDataCount}件\nファイル名: ${fileName}`,
      duration: 5000,
      showClose: true,
    })
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('ピッキングCSV导出エラー:', error)
      ElMessage.error(
        'エクスポート処理中にエラーが発生しました: ' + (error.message || '不明なエラー'),
      )
    }
  } finally {
    exportLoading.value = false
  }
}
</script>

<style scoped>
.shipping-list-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f0f4ff 0%, #e1ecff 50%, #d4e6ff 100%);
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.shipping-list-container::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 20% 30%, rgba(52, 152, 219, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(46, 204, 113, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 50% 20%, rgba(155, 89, 182, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
  animation: shippingBackgroundShift 25s ease-in-out infinite;
}

@keyframes shippingBackgroundShift {
  0%,
  100% {
    opacity: 0.8;
    transform: scale(1) rotate(0deg);
  }

  25% {
    opacity: 1;
    transform: scale(1.05) rotate(90deg);
  }

  50% {
    opacity: 0.9;
    transform: scale(0.95) rotate(180deg);
  }

  75% {
    opacity: 1;
    transform: scale(1.02) rotate(270deg);
  }
}

.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3a8a 50%, #1e40af 100%);
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.3);
  color: white;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(-30px);
  animation: slideInFromTop 0.8s ease-out 0.2s forwards;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.page-header.page-loaded {
  opacity: 1;
  transform: translateY(0);
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 1;
}

.title-section {
  flex: 1;
}

.title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  margin-bottom: 8px;
  font-size: 24px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 50%;
  font-size: 20px;
  backdrop-filter: blur(10px);
}

.title-text {
  font-weight: 700;
  letter-spacing: 1px;
}

.title-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  animation: shippingPulse 2.5s infinite;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

@keyframes shippingPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  50% {
    transform: scale(1.08);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.6);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }
}

.badge-text {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
  font-weight: 400;
}

.header-decoration {
  display: flex;
  gap: 8px;
}

.decoration-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: bounce 2s infinite;
}

.circle-1 {
  background: rgba(255, 255, 255, 0.6);
  animation-delay: 0s;
}

.circle-2 {
  background: rgba(255, 255, 255, 0.4);
  animation-delay: 0.2s;
}

.circle-3 {
  background: rgba(255, 255, 255, 0.2);
  animation-delay: 0.4s;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-10px);
  }

  60% {
    transform: translateY(-5px);
  }
}

.modern-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(37, 99, 235, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(30, 58, 138, 0.12);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(30px);
  animation: slideInFromBottom 0.8s ease-out forwards;
}

.filter-card {
  margin-bottom: 20px;
  animation-delay: 0.4s;
}

.table-card {
  animation-delay: 0.6s;
}

.modern-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(30, 58, 138, 0.2);
  border-color: rgba(37, 99, 235, 0.2);
}

@keyframes slideInFromBottom {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-card {
  margin-bottom: 24px;
}

.filter-card-expanded {
  transform: scale(1.01);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.filter-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.filter-icon {
  font-size: 20px;
  color: #3498db;
}

.toggle-button {
  color: #3498db;
  font-weight: 500;
  transition: all 0.3s ease;
}

.toggle-button:hover {
  color: #2980b9;
  transform: scale(1.05);
}

.toggle-icon {
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.filter-row {
  margin-bottom: 0;
  width: 100%;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  height: 100%;
  gap: 12px;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  padding: 8px 0;
  margin: 0;
}

.advanced-filters {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed rgba(52, 152, 219, 0.3);
  animation: slideDown 0.4s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
    max-height: 0;
  }

  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 200px;
  }
}

.advanced-divider {
  margin: 16px 0;
}

.divider-text {
  color: #3498db;
  font-weight: 600;
  font-size: 14px;
}

.modern-form-item {
  margin-bottom: 16px;
}

.modern-form-item :deep(.el-form-item__label) {
  color: #2c3e50;
  font-weight: 600;
  font-size: 14px;
}

.modern-input,
.modern-select,
.modern-date-picker {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modern-input:hover,
.modern-select:hover,
.modern-date-picker:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.search-button {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.search-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.5);
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
}

.search-button.searching {
  animation: searchPulse 1.5s infinite;
  position: relative;
}

.search-button.searching::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3498db, #2980b9, #3498db);
  border-radius: 10px;
  z-index: -1;
  animation: searchGlow 2s linear infinite;
}

@keyframes searchPulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }
}

@keyframes searchGlow {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

.reset-button {
  background: linear-gradient(135deg, #6b7280, #4b5563);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(107, 114, 128, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.reset-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(107, 114, 128, 0.5);
  background: linear-gradient(135deg, #4b5563, #374151);
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(52, 152, 219, 0.1);
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
  color: #2c3e50;
  font-size: 16px;
}

.table-icon {
  font-size: 20px;
  color: #3498db;
  background: rgba(52, 152, 219, 0.1);
  padding: 6px;
  border-radius: 6px;
}

.count-badge {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-width: 60px;
  justify-content: center;
}

.count-icon {
  font-size: 10px;
  opacity: 0.8;
}

@keyframes countUpdate {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
    background: linear-gradient(135deg, #27ae60, #2ecc71);
  }

  100% {
    transform: scale(1);
  }
}

.count-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.count-badge:hover::before {
  left: 100%;
}

.count-badge.animate-count {
  animation: countUpdate 0.8s ease-out;
}

.selected-badge {
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-width: 80px;
  justify-content: center;
  animation: selectedPulse 2s infinite;
}

.selected-badge::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s;
}

.selected-badge:hover::before {
  left: 100%;
}

.selected-icon {
  font-size: 10px;
  opacity: 0.8;
}

@keyframes selectedPulse {
  0% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  }

  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 16px rgba(243, 156, 18, 0.5);
  }

  100% {
    transform: scale(1);
    box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
  }
}

.header-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-button {
  border-radius: 6px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.action-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.action-button:hover::before {
  left: 100%;
}

.create-button {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.create-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
}

.print-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  position: relative;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.print-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
}

.button-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  border-radius: 50%;
  min-width: 24px;
  height: 24px;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  animation: shippingPulse 2s infinite;
  border: 2px solid white;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  padding: 0 4px;
  z-index: 10;
}

.setting-button {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border: none;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.setting-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.5);
}

.export-button {
  background: linear-gradient(135deg, #06b6d4, #0891b2);
  border: none;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.export-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.5);
}

.unpicked-button {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.unpicked-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.5);
}

.table-wrapper {
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.modern-table {
  background: white;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid rgba(52, 152, 219, 0.1);
}

.pagination-info {
  color: #7f8c8d;
  font-weight: 500;
}

.info-text {
  background: rgba(52, 152, 219, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}

.modern-pagination {
  display: flex;
  justify-content: flex-end;
}

/* 表格单元格样式 */
.shipping-no-cell {
  display: flex;
  align-items: center;
  padding: 4px 0;
}

.date-cell {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  padding: 2px 0;
}

.date-icon {
  color: #3498db;
  font-size: 12px;
}

.destination-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 2px 0;
}

.location-icon {
  color: #e74c3c;
  font-size: 12px;
}

.product-name-cell {
  font-weight: 500;
  color: #2c3e50;
  font-size: 13px;
  line-height: 1.3;
  padding: 2px 0;
}

.number-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 2px 0;
}

.number-value {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.2;
}

.number-unit {
  font-size: 10px;
  color: #7f8c8d;
  margin-top: -2px;
}

.code-tag {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 6px !important;
  height: auto !important;
  line-height: 1.2 !important;
}

.status-tag {
  display: flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  font-size: 11px;
  padding: 3px 8px !important;
  height: auto !important;
  line-height: 1.2 !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.status-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.5s;
}

.status-tag:hover::before {
  left: 100%;
}

.status-tag:hover {
  transform: scale(1.05);
}

.status-icon {
  font-size: 10px;
  animation: statusPulse 2s infinite;
}

@keyframes statusPulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  align-items: center;
  padding: 4px 2px;
}

.table-action-button {
  border-radius: 4px;
  font-size: 11px;
  padding: 4px 8px !important;
  height: 28px !important;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 50px;
}

.table-action-button.icon-only {
  width: 28px !important;
  height: 28px !important;
  min-width: 28px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.table-action-button.icon-only:hover {
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Element Plus 深度样式覆盖 */
:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
  --el-table-border-color: rgba(52, 152, 219, 0.1);
  --el-table-header-bg-color: linear-gradient(135deg, #f8f9fa, #e9ecef);
  --el-table-row-hover-bg-color: rgba(52, 152, 219, 0.05);
  --el-table-header-text-color: #2c3e50;
  font-size: 13px;
}

:deep(.el-table .cell) {
  padding: 6px 8px;
  line-height: 1.3;
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  font-weight: 600;
}

:deep(.el-table__header th) {
  border-bottom: 2px solid rgba(52, 152, 219, 0.2);
  color: #2c3e50;
  font-size: 12px;
  padding: 8px 0;
  height: 40px;
}

:deep(.el-table__header .cell) {
  padding: 0 8px;
  font-weight: 600;
  white-space: nowrap;
}

:deep(.el-table__body) {
  font-size: 13px;
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
  height: 45px;
}

:deep(.el-table__row td) {
  padding: 4px 0;
  border-bottom: 1px solid rgba(52, 152, 219, 0.08);
}

:deep(.el-table__row:hover) {
  background: rgba(52, 152, 219, 0.05);
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

:deep(.el-table__fixed-right) {
  height: auto !important;
}

:deep(.el-table--border .el-table__cell) {
  border-right: 1px solid rgba(52, 152, 219, 0.08);
}

:deep(.el-table__empty-block) {
  min-height: 200px;
}

:deep(.el-table__empty-text) {
  color: #909399;
  font-size: 14px;
}

/* 工具提示美化 */
:deep(.el-tooltip__popper) {
  background: linear-gradient(135deg, #2c3e50, #34495e);
  border: none;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

:deep(.el-tooltip__popper .el-tooltip__arrow) {
  border-top-color: #2c3e50;
}

/* 通知样式美化 */
:deep(.el-notification) {
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-notification.el-notification--success) {
  background: linear-gradient(135deg, rgba(39, 174, 96, 0.95), rgba(46, 204, 113, 0.95));
  color: white;
}

:deep(.el-notification.el-notification--info) {
  background: linear-gradient(135deg, rgba(52, 152, 219, 0.95), rgba(41, 128, 185, 0.95));
  color: white;
}

:deep(.el-notification.el-notification--error) {
  background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95));
  color: white;
}

:deep(.el-table__header) {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  font-weight: 600;
}

:deep(.el-table__header th) {
  border-bottom: 2px solid rgba(52, 152, 219, 0.2);
  color: #2c3e50;
  font-size: 14px;
}

:deep(.el-table__row) {
  cursor: pointer;
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
}

:deep(.el-table__row:hover) {
  background: rgba(52, 152, 219, 0.05);
  transform: scale(1.001);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.canceled-row) {
  background: linear-gradient(135deg, #fef0f0, #fde2e2);
  color: #f56c6c;
  text-decoration: line-through;
  opacity: 0.7;
}

:deep(.el-tag) {
  font-weight: 600;
  border-radius: 4px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 11px;
  padding: 2px 6px;
  height: auto;
  line-height: 1.3;
}

:deep(.el-tag--small) {
  font-size: 10px;
  padding: 1px 4px;
  height: auto;
}

:deep(.el-tag--info) {
  background-color: #909399;
  color: white;
}

:deep(.el-tag--primary) {
  background-color: #3498db;
  color: white;
}

:deep(.el-tag--success) {
  background-color: #27ae60;
  color: white;
}

:deep(.el-tag--warning) {
  background-color: #f39c12;
  color: white;
}

:deep(.el-tag--danger) {
  background-color: #e74c3c;
  color: white;
}

:deep(.el-pagination) {
  font-weight: 500;
}

:deep(.el-pagination .el-pager li) {
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.3s ease;
}

:deep(.el-pagination .el-pager li:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

:deep(.el-pagination .btn-prev),
:deep(.el-pagination .btn-next) {
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.el-pagination .btn-prev:hover),
:deep(.el-pagination .btn-next:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);
}

/* 自定义加载动画 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

:deep(.el-loading-spinner) {
  font-size: 28px;
}

:deep(.el-loading-spinner .circular) {
  width: 50px;
  height: 50px;
  animation: loading-rotate 2s linear infinite;
}

:deep(.el-loading-spinner .path) {
  stroke: #3498db;
  stroke-width: 3;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: loading-dash 1.5s ease-in-out infinite;
}

@keyframes loading-rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #2980b9, #21618c);
}

:deep(.el-table .cell) {
  padding-left: 12px;
  padding-right: 12px;
}

:deep(.el-table__fixed-right) {
  height: auto !important;
}

/* 对话框样式 */
.modern-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.modern-dialog :deep(.el-dialog) {
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
}

.modern-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 20px 24px;
  margin: 0;
}

.modern-dialog :deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.modern-dialog :deep(.el-dialog__headerbtn) {
  top: 20px;
  right: 20px;
}

.modern-dialog :deep(.el-dialog__close) {
  color: white;
  font-size: 18px;
}

.modern-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

/* 列表示设定对話框樣式 */
.column-select-container {
  padding: 16px;
}

.column-select-description {
  margin-bottom: 20px;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.modern-checkbox {
  margin: 0;
  padding: 12px 16px;
  border-radius: 8px;
  border: 2px solid rgba(52, 152, 219, 0.1);
  transition: all 0.3s ease;
  background: white;
  cursor: pointer;
}

.modern-checkbox:hover {
  background: rgba(52, 152, 219, 0.05);
  border-color: rgba(52, 152, 219, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.2);
}

.modern-checkbox :deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #3498db;
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(52, 152, 219, 0.1);
}

.reset-button {
  background: linear-gradient(135deg, #909399, #7d7d7d);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(144, 147, 153, 0.3);
}

.reset-button:hover {
  background: linear-gradient(135deg, #7d7d7d, #6a6a6a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(144, 147, 153, 0.4);
}

.confirm-button {
  background: linear-gradient(135deg, #409eff, #337ecc);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.confirm-button:hover {
  background: linear-gradient(135deg, #337ecc, #2d6db3);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.4);
}

/* 紧凑筛选行样式 */
.compact-filter-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  padding: 12px 0;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  margin: 0;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap;
  margin: 0;
  min-width: fit-content;
}

.date-group {
  flex: 0 0 auto;
}

.destination-group {
  flex: 0 0 auto;
}

.status-group {
  flex: 0 0 auto;
}

.actions-group {
  flex: 0 0 auto;
  margin-left: auto;
}

/* 日期范围容器样式 */
.date-range-container {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.date-quick-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.date-btn {
  font-size: 11px;
  padding: 4px 6px;
  border-radius: 4px;
  transition: all 0.3s ease;
  border: 1px solid #dcdfe6;
  background: white;
  color: #606266;
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-btn:hover {
  background: #f0f9ff;
  border-color: #3498db;
  color: #3498db;
  transform: translateY(-1px);
}

.today-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-color: #3498db;
  font-weight: 600;
}

.today-btn:hover {
  background: linear-gradient(135deg, #2980b9, #21618c);
  border-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

/* 紧凑按钮样式 */
.compact-btn {
  font-size: 12px;
  padding: 6px 12px;
  height: 28px;
  line-height: 1;
}

/* 納入先控制区域样式 */
.destination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.destination-dropdown {
  flex-shrink: 0;
}

.destination-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dest-code {
  font-weight: 600;
  color: #2c3e50;
  font-size: 12px;
}

.dest-name {
  font-size: 11px;
  color: #7f8c8d;
  margin-left: 8px;
  flex: 1;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-filter-dropdown {
  flex-shrink: 0;
}

.group-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.group-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 12px;
}

.group-count {
  font-size: 10px;
  color: #7f8c8d;
  margin-left: 8px;
}

.group-manage-button {
  display: flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  transition: all 0.3s ease;
  font-size: 11px;
  font-weight: 500;
  height: 28px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.group-manage-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8, #6a4c93);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.group-manage-button:disabled {
  background: #c0c4cc;
  color: #a8abb2;
  cursor: not-allowed;
  box-shadow: none;
}

/* 活跃分组显示区域 */
.active-groups-display {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8f9ff, #f0f4ff);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  animation: slideInDown 0.4s ease-out;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.groups-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #2c3e50;
}

.clear-groups-btn {
  font-size: 11px;
  color: #e74c3c;
  transition: all 0.3s ease;
}

.clear-groups-btn:hover {
  color: #c0392b;
  transform: scale(1.05);
}

.groups-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.group-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.group-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.group-tag:hover::before {
  left: 100%;
}

.group-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.group-name {
  font-weight: 600;
}

.group-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
}

.remove-group-btn {
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  padding: 0 !important;
  background: rgba(231, 76, 60, 0.8) !important;
  border: none !important;
  border-radius: 50% !important;
  color: white !important;
  font-size: 10px !important;
  transition: all 0.3s ease;
}

.remove-group-btn:hover {
  background: rgba(192, 57, 43, 0.9) !important;
  transform: scale(1.1);
}

/* 納入先拖拽分组选择相关样式已移至DestinationDragFilter组件 */

/* 响应式设计 */
@media (max-width: 1200px) {
  .shipping-list-container {
    padding: 16px;
  }

  .page-header {
    padding: 24px;
  }

  .title {
    font-size: 24px;
  }

  .header-buttons {
    flex-wrap: wrap;
    gap: 8px;
  }

  .action-button {
    font-size: 12px;
    padding: 8px 12px;
  }
}

@media (max-width: 992px) {
  .shipping-list-container {
    padding: 12px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  }

  .page-header {
    padding: 20px;
    margin-bottom: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .title {
    font-size: 22px;
    justify-content: center;
  }

  .filter-bar {
    gap: 12px;
    padding: 12px 0;
  }

  .header-buttons {
    flex-direction: column;
    width: 100%;
    gap: 8px;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
}

@media (max-width: 768px) {
  .shipping-list-container {
    padding: 8px;
  }

  .page-header {
    padding: 16px;
    border-radius: 12px;
  }

  .title {
    font-size: 20px;
    gap: 12px;
  }

  .title-icon {
    padding: 8px;
    font-size: 20px;
  }

  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filter-row {
    margin-bottom: 16px;
  }

  .el-form-item {
    margin-bottom: 16px;
    width: 100%;
  }

  :deep(.el-form-item__content) {
    width: 100%;
  }

  :deep(.el-date-editor),
  :deep(.el-input),
  :deep(.el-select) {
    width: 100% !important;
  }

  .filter-actions {
    justify-content: center;
    margin-top: 16px;
    flex-direction: column;
    gap: 12px;
  }

  .search-button,
  .reset-button {
    width: 100%;
    padding: 12px;
  }

  .table-wrapper {
    border-radius: 8px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .table-action-button {
    width: 100%;
    justify-content: center;
  }

  .checkbox-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
  }

  .reset-button,
  .confirm-button {
    width: 100%;
    padding: 12px;
  }

  /* 移动端紧凑筛选行样式 */
  .compact-filter-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 16px;
  }

  .filter-group {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }

  .actions-group {
    margin-left: 0;
    flex-direction: row;
    justify-content: center;
    gap: 8px;
  }

  /* 移动端日期快捷按钮样式 */
  .date-range-container {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .date-quick-buttons {
    justify-content: center;
  }

  .date-btn {
    flex: 1;
    min-width: 60px;
    height: 32px;
  }

  /* 移动端納入先控制区域样式 */
  .destination-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .destination-dropdown {
    width: 100% !important;
  }

  .group-filter-dropdown {
    width: 100% !important;
  }

  .group-manage-button {
    width: 100% !important;
    justify-content: center;
    height: 32px;
  }

  /* 移动端活跃分组显示 */
  .active-groups-display {
    margin-top: 8px;
    padding: 8px 12px;
  }

  .groups-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .groups-title {
    justify-content: center;
  }

  .clear-groups-btn {
    align-self: center;
  }

  .group-tag {
    padding: 8px 12px;
    font-size: 11px;
  }

  .group-count {
    font-size: 9px;
  }

  .remove-group-btn {
    width: 24px !important;
    height: 24px !important;
    min-width: 24px !important;
  }
}

@media (max-width: 480px) {
  .shipping-list-container {
    padding: 6px;
    min-height: auto;
  }

  .page-header {
    padding: 12px;
    margin-bottom: 12px;
  }

  .title {
    font-size: 18px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .subtitle {
    font-size: 14px;
  }

  .modern-card {
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .filter-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .table-header {
    padding: 12px 0;
  }

  .table-title {
    font-size: 16px;
  }

  .header-buttons {
    gap: 6px;
  }

  .action-button {
    font-size: 11px;
    padding: 6px 10px;
  }

  .pagination-container {
    padding: 12px 0;
  }

  :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
  }

  :deep(.el-table .cell) {
    padding: 8px 6px;
    font-size: 12px;
  }

  :deep(.el-table__header th) {
    font-size: 12px;
  }

  /* 超小屏幕的紧凑筛选行样式 */
  .compact-filter-row {
    gap: 8px;
    padding: 12px;
  }

  .filter-label {
    font-size: 12px;
  }

  .date-btn {
    min-width: 50px;
    height: 28px;
    padding: 2px 4px;
  }

  .compact-btn {
    font-size: 11px;
    padding: 4px 8px;
    height: 28px;
  }

  .destination-select-button {
    height: 28px;
    font-size: 11px;
  }
}

/* 编辑确认对话框样式 */
:deep(.edit-confirm-dialog) {
  .el-message-box__content {
    text-align: left;
    white-space: pre-line;
  }

  .el-message-box__message {
    margin: 0;
    line-height: 1.6;
  }
}
</style>
