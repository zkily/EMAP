<template>
  <div class="receiving-inspection">
    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" size="small">
        <el-form-item label="外注注文番号">
          <el-input
            v-model="searchForm.order_no"
            placeholder="注文番号を入力"
            clearable
            style="width: 200px"
          ></el-input>
        </el-form-item>

        <el-form-item label="仕入先">
          <el-select
            v-model="searchForm.supplier_id"
            placeholder="仕入先を選択"
            clearable
            filterable
            style="width: 200px"
          >
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="supplier.supplier_name"
              :value="supplier.id"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="受入状態">
          <el-select
            v-model="searchForm.receiving_status"
            placeholder="受入状態を選択"
            clearable
            style="width: 150px"
          >
            <el-option label="未受入" value="pending"></el-option>
            <el-option label="一部受入" value="partial"></el-option>
            <el-option label="受入完了" value="completed"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="検査状態">
          <el-select
            v-model="searchForm.inspection_status"
            placeholder="検査状態を選択"
            clearable
            style="width: 150px"
          >
            <el-option label="未検査" value="pending"></el-option>
            <el-option label="検査中" value="in_progress"></el-option>
            <el-option label="合格" value="passed"></el-option>
            <el-option label="不合格" value="failed"></el-option>
            <el-option label="条件付合格" value="conditional"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="受入日">
          <el-date-picker
            v-model="searchForm.receiving_date_range"
            type="daterange"
            range-separator="～"
            start-placeholder="開始日"
            end-placeholder="終了日"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            style="width: 240px"
          ></el-date-picker>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch" icon="el-icon-search"> 検索 </el-button>
          <el-button @click="handleReset" icon="el-icon-refresh"> リセット </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon receiving">
              <i class="el-icon-box"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.total_receiving }}</div>
              <div class="stat-label">総受入件数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pending_inspection }}</div>
              <div class="stat-label">検査待ち</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon passed">
              <i class="el-icon-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.passed_inspection }}</div>
              <div class="stat-label">検査合格</div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon failed">
              <i class="el-icon-close"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.failed_inspection }}</div>
              <div class="stat-label">検査不合格</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button type="primary" @click="handleNewReceiving" icon="el-icon-plus">
        新規受入
      </el-button>
      <el-button @click="handleBatchInspection" icon="el-icon-s-check"> 一括検査 </el-button>
      <el-button @click="handleExport" icon="el-icon-download"> エクスポート </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55"></el-table-column>

        <el-table-column prop="receiving_no" label="受入番号" width="140" fixed="left">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleViewReceiving(scope.row)">
              {{ scope.row.receiving_no }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="order_no" label="外注注文番号" width="140">
          <template slot-scope="scope">
            <el-link type="primary" @click="handleViewOrder(scope.row)">
              {{ scope.row.order_no }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column prop="supplier_name" label="仕入先" width="150"></el-table-column>

        <el-table-column
          prop="product_name"
          label="製品名"
          width="200"
          show-overflow-tooltip
        ></el-table-column>

        <el-table-column label="数量情報" width="180">
          <template slot-scope="scope">
            <div class="quantity-info">
              <div>注文: {{ formatNumber(scope.row.order_quantity) }} {{ scope.row.unit }}</div>
              <div>受入: {{ formatNumber(scope.row.received_quantity) }} {{ scope.row.unit }}</div>
              <div v-if="scope.row.remaining_quantity > 0" class="remaining">
                残り: {{ formatNumber(scope.row.remaining_quantity) }} {{ scope.row.unit }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="receiving_date" label="受入日" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.receiving_date) }}
          </template>
        </el-table-column>

        <el-table-column label="受入状態" width="100">
          <template slot-scope="scope">
            <el-tag :type="getReceivingStatusType(scope.row.receiving_status)" size="small">
              {{ getReceivingStatusText(scope.row.receiving_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="検査状態" width="120">
          <template slot-scope="scope">
            <el-tag :type="getInspectionStatusType(scope.row.inspection_status)" size="small">
              {{ getInspectionStatusText(scope.row.inspection_status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="品質結果" width="150">
          <template slot-scope="scope">
            <div v-if="scope.row.inspection_status !== 'pending'" class="quality-result">
              <div>合格: {{ formatNumber(scope.row.passed_quantity) }} {{ scope.row.unit }}</div>
              <div v-if="scope.row.failed_quantity > 0" class="failed">
                不合格: {{ formatNumber(scope.row.failed_quantity) }} {{ scope.row.unit }}
              </div>
              <div v-if="scope.row.defect_rate > 0" class="defect-rate">
                不良率: {{ (scope.row.defect_rate * 100).toFixed(2) }}%
              </div>
            </div>
            <span v-else class="not-inspected">未検査</span>
          </template>
        </el-table-column>

        <el-table-column prop="inspector" label="検査者" width="100"></el-table-column>

        <el-table-column prop="inspection_date" label="検査日" width="120">
          <template slot-scope="scope">
            {{ scope.row.inspection_date ? formatDate(scope.row.inspection_date) : '-' }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button-group>
              <el-button size="small" @click="handleViewReceiving(scope.row)" icon="el-icon-view">
                詳細
              </el-button>

              <el-button
                v-if="scope.row.inspection_status === 'pending'"
                size="small"
                type="primary"
                @click="handleInspection(scope.row)"
                icon="el-icon-s-check"
              >
                検査
              </el-button>

              <el-button
                v-if="scope.row.inspection_status === 'failed'"
                size="small"
                type="warning"
                @click="handleReturn(scope.row)"
                icon="el-icon-back"
              >
                返品
              </el-button>

              <el-dropdown
                trigger="click"
                @command="(command) => handleMoreAction(command, scope.row)"
              >
                <el-button size="small" icon="el-icon-more"></el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="edit">編集</el-dropdown-item>
                  <el-dropdown-item command="print">印刷</el-dropdown-item>
                  <el-dropdown-item command="history">履歴</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>削除</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.current"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      >
      </el-pagination>
    </div>

    <!-- 受入表单对话框 -->
    <el-dialog
      :title="receivingFormTitle"
      :visible.sync="receivingFormVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <receiving-form
        v-if="receivingFormVisible"
        :receiving-data="currentReceiving"
        :mode="receivingFormMode"
        @save="handleReceivingSave"
        @cancel="handleReceivingCancel"
      ></receiving-form>
    </el-dialog>

    <!-- 检查表单对话框 -->
    <el-dialog
      title="品質検査"
      :visible.sync="inspectionFormVisible"
      width="70%"
      :close-on-click-modal="false"
    >
      <inspection-form
        v-if="inspectionFormVisible"
        :receiving-data="currentReceiving"
        @save="handleInspectionSave"
        @cancel="handleInspectionCancel"
      ></inspection-form>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="受入詳細"
      :visible.sync="detailVisible"
      width="90%"
      :close-on-click-modal="false"
    >
      <receiving-detail
        v-if="detailVisible"
        :receiving-data="currentReceiving"
        @close="detailVisible = false"
      ></receiving-detail>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import ReceivingForm from './ReceivingForm.vue'
import InspectionForm from './InspectionForm.vue'
import ReceivingDetail from './ReceivingDetail.vue'

export default {
  name: 'ReceivingInspection',
  components: {
    ReceivingForm,
    InspectionForm,
    ReceivingDetail,
  },
  data() {
    return {
      loading: false,
      tableData: [],
      supplierList: [],
      selectedRows: [],
      searchForm: {
        order_no: '',
        supplier_id: '',
        receiving_status: '',
        inspection_status: '',
        receiving_date_range: [],
      },
      pagination: {
        current: 1,
        size: 20,
        total: 0,
      },
      stats: {
        total_receiving: 0,
        pending_inspection: 0,
        passed_inspection: 0,
        failed_inspection: 0,
      },
      receivingFormVisible: false,
      receivingFormMode: 'create',
      receivingFormTitle: '',
      inspectionFormVisible: false,
      detailVisible: false,
      currentReceiving: null,
    }
  },
  mounted() {
    this.loadSupplierList()
    this.loadData()
    this.loadStats()
  },
  methods: {
    async loadSupplierList() {
      try {
        const response = await outsourcingApi.getSupplierList()
        if (response.success) {
          this.supplierList = response.data
        }
      } catch (error) {
        console.error('仕入先リスト取得エラー:', error)
      }
    },

    async loadData() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.current,
          size: this.pagination.size,
        }

        if (
          this.searchForm.receiving_date_range &&
          this.searchForm.receiving_date_range.length === 2
        ) {
          params.receiving_date_start = this.searchForm.receiving_date_range[0]
          params.receiving_date_end = this.searchForm.receiving_date_range[1]
        }

        const response = await outsourcingApi.getReceivingList(params)
        if (response.success) {
          this.tableData = response.data.list
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('受入データ取得エラー:', error)
        this.$message.error('受入データの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    async loadStats() {
      try {
        const response = await outsourcingApi.getReceivingStats()
        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('統計データ取得エラー:', error)
      }
    },

    handleSearch() {
      this.pagination.current = 1
      this.loadData()
    },

    handleReset() {
      this.searchForm = {
        order_no: '',
        supplier_id: '',
        receiving_status: '',
        inspection_status: '',
        receiving_date_range: [],
      }
      this.handleSearch()
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.loadData()
    },

    handleCurrentChange(current) {
      this.pagination.current = current
      this.loadData()
    },

    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    handleNewReceiving() {
      this.currentReceiving = null
      this.receivingFormMode = 'create'
      this.receivingFormTitle = '新規受入登録'
      this.receivingFormVisible = true
    },

    handleViewReceiving(row) {
      this.currentReceiving = { ...row }
      this.detailVisible = true
    },

    handleViewOrder(row) {
      // 跳转到订单详情
      this.$emit('view-order', row.order_id)
    },

    handleInspection(row) {
      this.currentReceiving = { ...row }
      this.inspectionFormVisible = true
    },

    handleReturn(row) {
      this.$confirm('この受入品を返品しますか？', '確認', {
        confirmButtonText: '返品',
        cancelButtonText: 'キャンセル',
        type: 'warning',
      }).then(async () => {
        try {
          const response = await outsourcingApi.returnReceiving(row.id)
          if (response.success) {
            this.$message.success('返品処理が完了しました')
            this.loadData()
            this.loadStats()
          }
        } catch (error) {
          console.error('返品処理エラー:', error)
          this.$message.error('返品処理に失敗しました')
        }
      })
    },

    handleMoreAction(command, row) {
      switch (command) {
        case 'edit':
          this.currentReceiving = { ...row }
          this.receivingFormMode = 'edit'
          this.receivingFormTitle = '受入編集'
          this.receivingFormVisible = true
          break
        case 'print':
          this.handlePrint(row)
          break
        case 'history':
          this.handleViewHistory(row)
          break
        case 'delete':
          this.handleDelete(row)
          break
      }
    },

    handlePrint(row) {
      // 打印功能
      this.$message.info('印刷機能は開発中です')
    },

    handleViewHistory(row) {
      // 查看历史
      this.$message.info('履歴表示機能は開発中です')
    },

    handleDelete(row) {
      this.$confirm('この受入記録を削除しますか？', '確認', {
        confirmButtonText: '削除',
        cancelButtonText: 'キャンセル',
        type: 'warning',
      }).then(async () => {
        try {
          const response = await outsourcingApi.deleteReceiving(row.id)
          if (response.success) {
            this.$message.success('削除が完了しました')
            this.loadData()
            this.loadStats()
          }
        } catch (error) {
          console.error('削除エラー:', error)
          this.$message.error('削除に失敗しました')
        }
      })
    },

    handleBatchInspection() {
      if (this.selectedRows.length === 0) {
        this.$message.warning('検査する受入を選択してください')
        return
      }

      const pendingRows = this.selectedRows.filter((row) => row.inspection_status === 'pending')
      if (pendingRows.length === 0) {
        this.$message.warning('検査待ちの受入がありません')
        return
      }

      this.$message.info('一括検査機能は開発中です')
    },

    handleExport() {
      this.$message.info('エクスポート機能は開発中です')
    },

    handleReceivingSave(data) {
      this.receivingFormVisible = false
      this.loadData()
      this.loadStats()
      this.$message.success('受入情報を保存しました')
    },

    handleReceivingCancel() {
      this.receivingFormVisible = false
    },

    handleInspectionSave(data) {
      this.inspectionFormVisible = false
      this.loadData()
      this.loadStats()
      this.$message.success('検査結果を保存しました')
    },

    handleInspectionCancel() {
      this.inspectionFormVisible = false
    },

    getReceivingStatusType(status) {
      const statusMap = {
        pending: 'warning',
        partial: 'primary',
        completed: 'success',
      }
      return statusMap[status] || 'info'
    },

    getReceivingStatusText(status) {
      const statusMap = {
        pending: '未受入',
        partial: '一部受入',
        completed: '受入完了',
      }
      return statusMap[status] || status
    },

    getInspectionStatusType(status) {
      const statusMap = {
        pending: 'warning',
        in_progress: 'primary',
        passed: 'success',
        failed: 'danger',
        conditional: 'warning',
      }
      return statusMap[status] || 'info'
    },

    getInspectionStatusText(status) {
      const statusMap = {
        pending: '未検査',
        in_progress: '検査中',
        passed: '合格',
        failed: '不合格',
        conditional: '条件付合格',
      }
      return statusMap[status] || status
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ja-JP')
    },
  },
}
</script>

<style scoped>
.receiving-inspection {
  padding: 20px;
}

.search-section {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.stats-overview {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stat-icon.receiving {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.passed {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.failed {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.action-buttons {
  margin-bottom: 20px;
  text-align: right;
}

.action-buttons .el-button {
  margin-left: 10px;
}

.table-section {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.quantity-info {
  font-size: 12px;
  line-height: 1.4;
}

.quantity-info .remaining {
  color: #e6a23c;
  font-weight: 600;
}

.quality-result {
  font-size: 12px;
  line-height: 1.4;
}

.quality-result .failed {
  color: #f56c6c;
  font-weight: 600;
}

.quality-result .defect-rate {
  color: #e6a23c;
  font-weight: 600;
}

.not-inspected {
  color: #909399;
  font-style: italic;
}

.pagination-section {
  margin-top: 20px;
  text-align: right;
}

.el-button-group .el-button {
  margin: 0;
}

.el-table .cell {
  padding: 8px;
}

.el-link {
  font-weight: 600;
}
</style>
