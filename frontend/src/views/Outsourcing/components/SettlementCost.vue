<template>
  <div class="settlement-cost">
    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="searchForm.supplier_id" placeholder="仕入先選択" clearable>
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id"
            >
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="searchForm.settlement_status" placeholder="精算状態" clearable>
            <el-option label="未精算" value="pending"></el-option>
            <el-option label="精算中" value="processing"></el-option>
            <el-option label="精算完了" value="completed"></el-option>
            <el-option label="保留" value="hold"></el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="searchForm.date_range"
            type="monthrange"
            placeholder="精算期間"
            format="yyyy-MM"
            value-format="yyyy-MM"
            range-separator="～"
          >
          </el-date-picker>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">
            <i class="el-icon-search"></i> 検索
          </el-button>
          <el-button @click="handleReset"> <i class="el-icon-refresh"></i> リセット </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon pending">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pending_count }}</div>
              <div class="stat-label">未精算件数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon processing">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.processing_count }}</div>
              <div class="stat-label">精算中件数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon completed">
              <i class="el-icon-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(stats.completed_amount) }}</div>
              <div class="stat-label">今月精算額</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon total">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(stats.total_amount) }}</div>
              <div class="stat-label">累計精算額</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮 -->
    <div class="action-section">
      <el-button type="primary" @click="handleCreate">
        <i class="el-icon-plus"></i> 新規精算
      </el-button>
      <el-button type="success" @click="handleBatchProcess" :disabled="selectedRows.length === 0">
        <i class="el-icon-check"></i> 一括処理
      </el-button>
      <el-button @click="handleExport"> <i class="el-icon-download"></i> エクスポート </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column
          prop="settlement_no"
          label="精算番号"
          width="120"
          fixed="left"
        ></el-table-column>
        <el-table-column prop="supplier_name" label="仕入先" width="150"></el-table-column>
        <el-table-column prop="settlement_period" label="精算期間" width="120">
          <template slot-scope="scope">
            {{ formatPeriod(scope.row.settlement_period) }}
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="注文件数" width="100" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.order_count) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="総額" width="120" align="right">
          <template slot-scope="scope">
            <span class="amount">¥{{ formatNumber(scope.row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="消費税" width="100" align="right">
          <template slot-scope="scope">
            <span class="tax">¥{{ formatNumber(scope.row.tax_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="final_amount" label="精算額" width="120" align="right">
          <template slot-scope="scope">
            <span class="final-amount">¥{{ formatNumber(scope.row.final_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="settlement_status" label="精算状態" width="100">
          <template slot-scope="scope">
            <el-tag :type="getSettlementStatusType(scope.row.settlement_status)" size="small">
              {{ getSettlementStatusText(scope.row.settlement_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="支払状態" width="100">
          <template slot-scope="scope">
            <el-tag :type="getPaymentStatusType(scope.row.payment_status)" size="small">
              {{ getPaymentStatusText(scope.row.payment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="settlement_date" label="精算日" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.settlement_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="payment_date" label="支払予定日" width="120">
          <template slot-scope="scope">
            {{ formatDate(scope.row.payment_date) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="link" size="small" @click="handleView(scope.row)"> 詳細 </el-button>
            <el-button
              type="link"
              size="small"
              @click="handleEdit(scope.row)"
              v-if="canEdit(scope.row)"
            >
              編集
            </el-button>
            <el-button
              type="link"
              size="small"
              @click="handleProcess(scope.row)"
              v-if="canProcess(scope.row)"
            >
              処理
            </el-button>
            <el-button type="link" size="small" @click="handlePrint(scope.row)"> 印刷 </el-button>
          </template>
        </el-table-column>
      </el-table>

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
    </div>

    <!-- 精算表单对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="80%"
      :close-on-click-modal="false"
    >
      <settlement-form
        v-if="dialogVisible"
        :form-data="currentRow"
        :mode="dialogMode"
        @save="handleSave"
        @cancel="handleCancel"
      >
      </settlement-form>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      title="精算詳細"
      :visible.sync="detailVisible"
      width="90%"
      :close-on-click-modal="false"
    >
      <settlement-detail
        v-if="detailVisible"
        :settlement-data="currentRow"
        @close="detailVisible = false"
        @edit="handleEditFromDetail"
      >
      </settlement-detail>
    </el-dialog>

    <!-- 批量处理对话框 -->
    <el-dialog
      title="一括処理"
      :visible.sync="batchVisible"
      width="60%"
      :close-on-click-modal="false"
    >
      <batch-process-form
        v-if="batchVisible"
        :selected-rows="selectedRows"
        @save="handleBatchSave"
        @cancel="batchVisible = false"
      >
      </batch-process-form>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'
import SettlementForm from './SettlementForm.vue'
import SettlementDetail from './SettlementDetail.vue'
import BatchProcessForm from './BatchProcessForm.vue'

export default {
  name: 'SettlementCost',
  components: {
    SettlementForm,
    SettlementDetail,
    BatchProcessForm,
  },
  data() {
    return {
      loading: false,
      searchForm: {
        supplier_id: '',
        settlement_status: '',
        date_range: [],
      },
      stats: {
        pending_count: 0,
        processing_count: 0,
        completed_amount: 0,
        total_amount: 0,
      },
      tableData: [],
      selectedRows: [],
      supplierList: [],
      pagination: {
        current: 1,
        size: 20,
        total: 0,
      },
      dialogVisible: false,
      detailVisible: false,
      batchVisible: false,
      dialogMode: 'create',
      currentRow: null,
    }
  },
  computed: {
    dialogTitle() {
      const titleMap = {
        create: '新規精算作成',
        edit: '精算編集',
        view: '精算詳細',
      }
      return titleMap[this.dialogMode] || '精算'
    },
  },
  mounted() {
    this.loadSupplierList()
    this.loadStats()
    this.loadTableData()
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

    async loadStats() {
      try {
        const response = await outsourcingApi.getSettlementStats()
        if (response.success) {
          this.stats = response.data
        }
      } catch (error) {
        console.error('統計データ取得エラー:', error)
      }
    },

    async loadTableData() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.current,
          size: this.pagination.size,
        }
        const response = await outsourcingApi.getSettlementList(params)
        if (response.success) {
          this.tableData = response.data.list
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('精算データ取得エラー:', error)
        this.$message.error('データの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.pagination.current = 1
      this.loadTableData()
    },

    handleReset() {
      this.searchForm = {
        supplier_id: '',
        settlement_status: '',
        date_range: [],
      }
      this.handleSearch()
    },

    handleCreate() {
      this.dialogMode = 'create'
      this.currentRow = null
      this.dialogVisible = true
    },

    handleView(row) {
      this.currentRow = row
      this.detailVisible = true
    },

    handleEdit(row) {
      this.dialogMode = 'edit'
      this.currentRow = { ...row }
      this.dialogVisible = true
    },

    handleEditFromDetail(row) {
      this.detailVisible = false
      this.handleEdit(row)
    },

    handleProcess(row) {
      this.$confirm('この精算を処理しますか？', '確認', {
        confirmButtonText: '処理',
        cancelButtonText: 'キャンセル',
        type: 'warning',
      }).then(async () => {
        try {
          const response = await outsourcingApi.processSettlement(row.id)
          if (response.success) {
            this.$message.success('精算処理が完了しました')
            this.loadTableData()
            this.loadStats()
          }
        } catch (error) {
          console.error('精算処理エラー:', error)
          this.$message.error('精算処理に失敗しました')
        }
      })
    },

    handlePrint(row) {
      this.$message.info('印刷機能は開発中です')
    },

    handleBatchProcess() {
      this.batchVisible = true
    },

    handleExport() {
      this.$message.info('エクスポート機能は開発中です')
    },

    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    async handleSave(formData) {
      try {
        let response
        if (this.dialogMode === 'create') {
          response = await outsourcingApi.createSettlement(formData)
        } else {
          response = await outsourcingApi.updateSettlement(this.currentRow.id, formData)
        }

        if (response.success) {
          this.$message.success(
            this.dialogMode === 'create' ? '精算を作成しました' : '精算を更新しました',
          )
          this.dialogVisible = false
          this.loadTableData()
          this.loadStats()
        }
      } catch (error) {
        console.error('精算保存エラー:', error)
        this.$message.error('保存に失敗しました')
      }
    },

    async handleBatchSave(processData) {
      try {
        const response = await outsourcingApi.batchProcessSettlement(processData)
        if (response.success) {
          this.$message.success('一括処理が完了しました')
          this.batchVisible = false
          this.selectedRows = []
          this.loadTableData()
          this.loadStats()
        }
      } catch (error) {
        console.error('一括処理エラー:', error)
        this.$message.error('一括処理に失敗しました')
      }
    },

    handleCancel() {
      this.dialogVisible = false
    },

    handleSizeChange(size) {
      this.pagination.size = size
      this.loadTableData()
    },

    handleCurrentChange(current) {
      this.pagination.current = current
      this.loadTableData()
    },

    canEdit(row) {
      return row.settlement_status === 'pending' || row.settlement_status === 'processing'
    },

    canProcess(row) {
      return row.settlement_status === 'pending'
    },

    getSettlementStatusType(status) {
      const statusMap = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        hold: 'info',
      }
      return statusMap[status] || 'info'
    },

    getSettlementStatusText(status) {
      const statusMap = {
        pending: '未精算',
        processing: '精算中',
        completed: '精算完了',
        hold: '保留',
      }
      return statusMap[status] || status
    },

    getPaymentStatusType(status) {
      const statusMap = {
        pending: 'warning',
        scheduled: 'primary',
        paid: 'success',
        overdue: 'danger',
      }
      return statusMap[status] || 'info'
    },

    getPaymentStatusText(status) {
      const statusMap = {
        pending: '未払い',
        scheduled: '支払予定',
        paid: '支払済み',
        overdue: '支払遅延',
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

    formatPeriod(period) {
      if (!period) return '-'
      return period.replace('-', '年') + '月'
    },
  },
}
</script>

<style scoped>
.settlement-cost {
  padding: 20px;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.stat-icon.pending {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-icon.processing {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.completed {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.total {
  background: linear-gradient(135deg, #909399, #b1b3b8);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.action-section {
  background: white;
  padding: 15px 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-section {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #e4e7ed;
}

.amount {
  color: #409eff;
  font-weight: 600;
}

.tax {
  color: #e6a23c;
  font-weight: 500;
}

.final-amount {
  color: #67c23a;
  font-weight: bold;
}

.el-table {
  font-size: 14px;
}

.el-table th {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
}

.el-button--text {
  padding: 0;
  margin-right: 10px;
}

.el-button--text:last-child {
  margin-right: 0;
}
</style>
