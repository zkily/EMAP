<template>
  <div class="finance-cost">
    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="精算番号">
          <el-input
            v-model="searchForm.settlementNo"
            placeholder="精算番号を入力"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="仕入先">
          <el-select
            v-model="searchForm.supplierCd"
            placeholder="仕入先を選択"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.supplier_cd"
              :label="supplier.supplier_name"
              :value="supplier.supplier_cd"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="精算期間">
          <el-date-picker
            v-model="searchForm.settlementPeriod"
            type="monthrange"
            range-separator="～"
            start-placeholder="開始月"
            end-placeholder="終了月"
            format="yyyy-MM"
            value-format="yyyy-MM"
          />
        </el-form-item>
        <el-form-item label="精算状態">
          <el-select
            v-model="searchForm.status"
            placeholder="状態を選択"
            clearable
            style="width: 150px"
          >
            <el-option label="未精算" value="pending" />
            <el-option label="精算中" value="processing" />
            <el-option label="承認待ち" value="approval" />
            <el-option label="承認済" value="approved" />
            <el-option label="却下" value="rejected" />
            <el-option label="支払済" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchSettlements">
            <i class="el-icon-search"></i> 検索
          </el-button>
          <el-button @click="resetSearch"> <i class="el-icon-refresh"></i> リセット </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card pending">
            <div class="stat-icon">
              <i class="el-icon-time"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.pendingCount }}</div>
              <div class="stat-label">未精算件数</div>
              <div class="stat-amount">¥{{ formatNumber(overview.pendingAmount) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card processing">
            <div class="stat-icon">
              <i class="el-icon-loading"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.processingCount }}</div>
              <div class="stat-label">精算中件数</div>
              <div class="stat-amount">¥{{ formatNumber(overview.processingAmount) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card approved">
            <div class="stat-icon">
              <i class="el-icon-check"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.approvedCount }}</div>
              <div class="stat-label">承認済件数</div>
              <div class="stat-amount">¥{{ formatNumber(overview.approvedAmount) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card total">
            <div class="stat-icon">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.totalCount }}</div>
              <div class="stat-label">総件数</div>
              <div class="stat-amount">¥{{ formatNumber(overview.totalAmount) }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <el-button type="primary" @click="showSettlementForm = true">
        <i class="el-icon-plus"></i> 新規精算
      </el-button>
      <el-button type="success" :disabled="selectedSettlements.length === 0" @click="batchApprove">
        <i class="el-icon-check"></i> 一括承認
      </el-button>
      <el-button type="warning" :disabled="selectedSettlements.length === 0" @click="batchReject">
        <i class="el-icon-close"></i> 一括却下
      </el-button>
      <el-button @click="exportData"> <i class="el-icon-download"></i> エクスポート </el-button>
      <el-button @click="generateReport"> <i class="el-icon-document"></i> レポート生成 </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="settlements"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="settlement_no" label="精算番号" width="150" />
        <el-table-column prop="supplier_name" label="仕入先" width="200" />
        <el-table-column prop="settlement_period" label="精算期間" width="120" />
        <el-table-column prop="order_count" label="注文件数" width="100" align="right" />
        <el-table-column prop="subtotal_amount" label="小計金額" width="120" align="right">
          <template slot-scope="scope"> ¥{{ formatNumber(scope.row.subtotal_amount) }} </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税額" width="100" align="right">
          <template slot-scope="scope"> ¥{{ formatNumber(scope.row.tax_amount) }} </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="総額" width="120" align="right">
          <template slot-scope="scope"> ¥{{ formatNumber(scope.row.total_amount) }} </template>
        </el-table-column>
        <el-table-column prop="status" label="状態" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_date" label="作成日" width="120" />
        <el-table-column prop="approved_date" label="承認日" width="120" />
        <el-table-column prop="payment_date" label="支払予定日" width="120" />
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="link" size="small" @click="viewDetail(scope.row)"> 詳細 </el-button>
            <el-button
              v-if="scope.row.status === 'pending'"
              type="link"
              size="small"
              @click="editSettlement(scope.row)"
            >
              編集
            </el-button>
            <el-button
              v-if="scope.row.status === 'processing'"
              type="link"
              size="small"
              @click="approveSettlement(scope.row)"
            >
              承認
            </el-button>
            <el-button type="link" size="small" @click="printSettlement(scope.row)">
              印刷
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </div>

    <!-- 精算表单对话框 -->
    <el-dialog
      title="精算作成"
      :visible.sync="showSettlementForm"
      width="900px"
      :close-on-click-modal="false"
    >
      <SettlementForm
        v-if="showSettlementForm"
        :settlement-id="selectedSettlementId"
        @success="handleSettlementSuccess"
        @cancel="showSettlementForm = false"
      />
    </el-dialog>

    <!-- 精算详情对话框 -->
    <el-dialog
      title="精算詳細"
      :visible.sync="showSettlementDetail"
      width="1200px"
      :close-on-click-modal="false"
    >
      <SettlementDetail
        v-if="showSettlementDetail"
        :settlement-id="selectedSettlementId"
        @close="showSettlementDetail = false"
        @edit="editFromDetail"
      />
    </el-dialog>

    <!-- 批量处理对话框 -->
    <el-dialog
      title="一括処理"
      :visible.sync="showBatchProcess"
      width="600px"
      :close-on-click-modal="false"
    >
      <BatchProcessForm
        v-if="showBatchProcess"
        :settlement-ids="selectedSettlementIds"
        :action-type="batchActionType"
        @success="handleBatchProcessSuccess"
        @cancel="showBatchProcess = false"
      />
    </el-dialog>

    <!-- 成本分析对话框 -->
    <el-dialog
      title="コスト分析レポート"
      :visible.sync="showCostAnalysis"
      width="1000px"
      :close-on-click-modal="false"
    >
      <CostAnalysisReport v-if="showCostAnalysis" @close="showCostAnalysis = false" />
    </el-dialog>
  </div>
</template>

<script>
import SettlementForm from './SettlementForm.vue'
import SettlementDetail from './SettlementDetail.vue'
import BatchProcessForm from './BatchProcessForm.vue'
import CostAnalysisReport from './CostAnalysisReport.vue'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'FinanceCost',
  components: {
    SettlementForm,
    SettlementDetail,
    BatchProcessForm,
    CostAnalysisReport,
  },
  data() {
    return {
      loading: false,
      searchForm: {
        settlementNo: '',
        supplierCd: '',
        settlementPeriod: [],
        status: '',
      },
      settlements: [],
      suppliers: [],
      selectedSettlements: [],
      selectedSettlementIds: [],
      selectedSettlementId: null,
      batchActionType: '',
      overview: {
        pendingCount: 0,
        pendingAmount: 0,
        processingCount: 0,
        processingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
        totalCount: 0,
        totalAmount: 0,
      },
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0,
      },
      showSettlementForm: false,
      showSettlementDetail: false,
      showBatchProcess: false,
      showCostAnalysis: false,
    }
  },
  mounted() {
    this.loadSuppliers()
    this.loadOverview()
    this.loadSettlements()
  },
  methods: {
    async loadSuppliers() {
      try {
        const response = await outsourcingApi.getSuppliers()
        if (response.success) {
          this.suppliers = response.data
        }
      } catch (error) {
        console.error('仕入先データ読み込みエラー:', error)
      }
    },

    async loadOverview() {
      try {
        const response = await outsourcingApi.getSettlementOverview()
        if (response.success) {
          this.overview = response.data
        }
      } catch (error) {
        console.error('概要データ読み込みエラー:', error)
      }
    },

    async loadSettlements() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.currentPage,
          pageSize: this.pagination.pageSize,
        }

        if (this.searchForm.settlementPeriod && this.searchForm.settlementPeriod.length === 2) {
          params.startPeriod = this.searchForm.settlementPeriod[0]
          params.endPeriod = this.searchForm.settlementPeriod[1]
        }

        const response = await outsourcingApi.getSettlements(params)
        if (response.success) {
          this.settlements = response.data.list
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('精算データ読み込みエラー:', error)
        this.$message.error('精算データの読み込みに失敗しました')
      } finally {
        this.loading = false
      }
    },

    searchSettlements() {
      this.pagination.currentPage = 1
      this.loadSettlements()
    },

    resetSearch() {
      this.searchForm = {
        settlementNo: '',
        supplierCd: '',
        settlementPeriod: [],
        status: '',
      }
      this.searchSettlements()
    },

    handleSelectionChange(selection) {
      this.selectedSettlements = selection
      this.selectedSettlementIds = selection.map((item) => item.id)
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadSettlements()
    },

    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadSettlements()
    },

    viewDetail(row) {
      this.selectedSettlementId = row.id
      this.showSettlementDetail = true
    },

    editSettlement(row) {
      this.selectedSettlementId = row.id
      this.showSettlementForm = true
    },

    editFromDetail(settlementId) {
      this.showSettlementDetail = false
      this.selectedSettlementId = settlementId
      this.showSettlementForm = true
    },

    async approveSettlement(row) {
      try {
        await this.$confirm('この精算を承認しますか？', '確認', {
          confirmButtonText: '承認',
          cancelButtonText: 'キャンセル',
          type: 'warning',
        })

        const response = await outsourcingApi.approveSettlement(row.id)
        if (response.success) {
          this.$message.success('精算を承認しました')
          this.loadSettlements()
          this.loadOverview()
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('承認エラー:', error)
          this.$message.error('承認に失敗しました')
        }
      }
    },

    batchApprove() {
      if (this.selectedSettlementIds.length === 0) {
        this.$message.warning('承認対象を選択してください')
        return
      }
      this.batchActionType = 'approve'
      this.showBatchProcess = true
    },

    batchReject() {
      if (this.selectedSettlementIds.length === 0) {
        this.$message.warning('却下対象を選択してください')
        return
      }
      this.batchActionType = 'reject'
      this.showBatchProcess = true
    },

    async printSettlement(row) {
      try {
        const response = await outsourcingApi.printSettlement(row.id)
        if (response.success) {
          window.open(response.data.printUrl, '_blank')
        }
      } catch (error) {
        console.error('印刷エラー:', error)
        this.$message.error('印刷に失敗しました')
      }
    },

    async exportData() {
      try {
        const params = {
          ...this.searchForm,
        }

        if (this.searchForm.settlementPeriod && this.searchForm.settlementPeriod.length === 2) {
          params.startPeriod = this.searchForm.settlementPeriod[0]
          params.endPeriod = this.searchForm.settlementPeriod[1]
        }

        const response = await outsourcingApi.exportSettlements(params)
        if (response.success) {
          const link = document.createElement('a')
          link.href = response.data.downloadUrl
          link.download = response.data.filename
          link.click()
        }
      } catch (error) {
        console.error('エクスポートエラー:', error)
        this.$message.error('エクスポートに失敗しました')
      }
    },

    generateReport() {
      this.showCostAnalysis = true
    },

    handleSettlementSuccess() {
      this.showSettlementForm = false
      this.selectedSettlementId = null
      this.loadSettlements()
      this.loadOverview()
      this.$message.success('精算を保存しました')
    },

    handleBatchProcessSuccess() {
      this.showBatchProcess = false
      this.loadSettlements()
      this.loadOverview()
      this.$message.success('一括処理を完了しました')
    },

    getStatusType(status) {
      const typeMap = {
        pending: 'info',
        processing: 'warning',
        approval: 'primary',
        approved: 'success',
        rejected: 'danger',
        paid: 'success',
      }
      return typeMap[status] || 'info'
    },

    getStatusText(status) {
      const textMap = {
        pending: '未精算',
        processing: '精算中',
        approval: '承認待ち',
        approved: '承認済',
        rejected: '却下',
        paid: '支払済',
      }
      return textMap[status] || '未設定'
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    refresh() {
      this.loadOverview()
      this.loadSettlements()
    },
  },
}
</script>

<style scoped>
.finance-cost {
  padding: 20px;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-section {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-card.pending .stat-icon {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-card.processing .stat-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-card.approved .stat-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #909399, #b3b6bb);
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
  color: #909399;
  margin-bottom: 8px;
}

.stat-amount {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.action-section {
  margin-bottom: 20px;
}

.table-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.pagination-section {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.el-table {
  border-radius: 0;
}

.el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

.el-table td {
  padding: 12px 0;
}

.el-button + .el-button {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .search-section .el-form {
    display: block;
  }

  .search-section .el-form-item {
    display: block;
    margin-bottom: 15px;
  }

  .action-section {
    text-align: center;
  }

  .action-section .el-button {
    margin-bottom: 10px;
  }

  .overview-section .el-col {
    margin-bottom: 15px;
  }
}
</style>
