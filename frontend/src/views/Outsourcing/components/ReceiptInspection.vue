<template>
  <div class="receipt-inspection">
    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="受領番号">
          <el-input
            v-model="searchForm.receiptNo"
            placeholder="受領番号を入力"
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
        <el-form-item label="受領日">
          <el-date-picker
            v-model="searchForm.receiptDateRange"
            type="daterange"
            range-separator="～"
            start-placeholder="開始日"
            end-placeholder="終了日"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="検査状態">
          <el-select
            v-model="searchForm.inspectionStatus"
            placeholder="検査状態を選択"
            clearable
            style="width: 150px"
          >
            <el-option label="検査待ち" value="pending" />
            <el-option label="検査中" value="inspecting" />
            <el-option label="合格" value="passed" />
            <el-option label="不合格" value="failed" />
            <el-option label="条件付合格" value="conditional" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchReceipts">
            <i class="el-icon-search"></i> 検索
          </el-button>
          <el-button @click="resetSearch"> <i class="el-icon-refresh"></i> リセット </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <el-button type="primary" @click="showReceivingForm = true">
        <i class="el-icon-plus"></i> 新規受領
      </el-button>
      <el-button type="success" :disabled="selectedReceipts.length === 0" @click="batchInspection">
        <i class="el-icon-check"></i> 一括検査
      </el-button>
      <el-button @click="exportData"> <i class="el-icon-download"></i> エクスポート </el-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="receipts"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="receipt_no" label="受領番号" width="150" />
        <el-table-column prop="order_no" label="注文番号" width="150" />
        <el-table-column prop="supplier_name" label="仕入先" width="200" />
        <el-table-column prop="product_name" label="製品名" width="200" />
        <el-table-column prop="receipt_date" label="受領日" width="120" />
        <el-table-column prop="ordered_quantity" label="発注数量" width="100" align="right" />
        <el-table-column prop="received_quantity" label="受領数量" width="100" align="right" />
        <el-table-column prop="accepted_quantity" label="合格数量" width="100" align="right" />
        <el-table-column prop="rejected_quantity" label="不合格数量" width="100" align="right" />
        <el-table-column prop="receipt_status" label="受領状態" width="120">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.receipt_status)">
              {{ getStatusText(scope.row.receipt_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="inspection_status" label="検査状態" width="120">
          <template slot-scope="scope">
            <el-tag :type="getInspectionStatusType(scope.row.inspection_status)">
              {{ getInspectionStatusText(scope.row.inspection_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template slot-scope="scope">
            <el-button type="link" size="small" @click="viewDetail(scope.row)"> 詳細 </el-button>
            <el-button
              v-if="scope.row.receipt_status === '受領済' && !scope.row.inspection_id"
              type="link"
              size="small"
              @click="startInspection(scope.row)"
            >
              検査開始
            </el-button>
            <el-button
              v-if="scope.row.inspection_id"
              type="link"
              size="small"
              @click="viewInspection(scope.row)"
            >
              検査詳細
            </el-button>
            <el-button type="link" size="small" @click="printReceipt(scope.row)"> 印刷 </el-button>
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

    <!-- 收货表单对话框 -->
    <el-dialog
      title="新規受領"
      :visible.sync="showReceivingForm"
      width="800px"
      :close-on-click-modal="false"
    >
      <ReceivingForm
        v-if="showReceivingForm"
        @success="handleReceivingSuccess"
        @cancel="showReceivingForm = false"
      />
    </el-dialog>

    <!-- 收货详情对话框 -->
    <el-dialog
      title="受領詳細"
      :visible.sync="showReceivingDetail"
      width="1000px"
      :close-on-click-modal="false"
    >
      <ReceivingDetail
        v-if="showReceivingDetail"
        :receipt-id="selectedReceiptId"
        @close="showReceivingDetail = false"
      />
    </el-dialog>

    <!-- 检验表单对话框 -->
    <el-dialog
      title="品質検査"
      :visible.sync="showInspectionForm"
      width="900px"
      :close-on-click-modal="false"
    >
      <InspectionForm
        v-if="showInspectionForm"
        :receipt-id="selectedReceiptId"
        @success="handleInspectionSuccess"
        @cancel="showInspectionForm = false"
      />
    </el-dialog>

    <!-- 检验详情对话框 -->
    <el-dialog
      title="検査詳細"
      :visible.sync="showInspectionDetail"
      width="1000px"
      :close-on-click-modal="false"
    >
      <InspectionDetail
        v-if="showInspectionDetail"
        :inspection-id="selectedInspectionId"
        @close="showInspectionDetail = false"
      />
    </el-dialog>

    <!-- 批量检验对话框 -->
    <el-dialog
      title="一括検査"
      :visible.sync="showBatchInspection"
      width="800px"
      :close-on-click-modal="false"
    >
      <BatchInspectionForm
        v-if="showBatchInspection"
        :receipt-ids="selectedReceiptIds"
        @success="handleBatchInspectionSuccess"
        @cancel="showBatchInspection = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import ReceivingForm from './ReceivingForm.vue'
import ReceivingDetail from './ReceivingDetail.vue'
import InspectionForm from './InspectionForm.vue'
import InspectionDetail from './InspectionDetail.vue'
import BatchInspectionForm from './BatchInspectionForm.vue'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'ReceiptInspection',
  components: {
    ReceivingForm,
    ReceivingDetail,
    InspectionForm,
    InspectionDetail,
    BatchInspectionForm,
  },
  data() {
    return {
      loading: false,
      searchForm: {
        receiptNo: '',
        supplierCd: '',
        receiptDateRange: [],
        inspectionStatus: '',
      },
      receipts: [],
      suppliers: [],
      selectedReceipts: [],
      selectedReceiptIds: [],
      selectedReceiptId: null,
      selectedInspectionId: null,
      pagination: {
        currentPage: 1,
        pageSize: 20,
        total: 0,
      },
      showReceivingForm: false,
      showReceivingDetail: false,
      showInspectionForm: false,
      showInspectionDetail: false,
      showBatchInspection: false,
    }
  },
  mounted() {
    this.loadSuppliers()
    this.loadReceipts()
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

    async loadReceipts() {
      this.loading = true
      try {
        const params = {
          ...this.searchForm,
          page: this.pagination.currentPage,
          pageSize: this.pagination.pageSize,
        }

        if (this.searchForm.receiptDateRange && this.searchForm.receiptDateRange.length === 2) {
          params.startDate = this.searchForm.receiptDateRange[0]
          params.endDate = this.searchForm.receiptDateRange[1]
        }

        const response = await outsourcingApi.getReceipts(params)
        if (response.success) {
          this.receipts = response.data.list
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('受領データ読み込みエラー:', error)
        this.$message.error('受領データの読み込みに失敗しました')
      } finally {
        this.loading = false
      }
    },

    searchReceipts() {
      this.pagination.currentPage = 1
      this.loadReceipts()
    },

    resetSearch() {
      this.searchForm = {
        receiptNo: '',
        supplierCd: '',
        receiptDateRange: [],
        inspectionStatus: '',
      }
      this.searchReceipts()
    },

    handleSelectionChange(selection) {
      this.selectedReceipts = selection
      this.selectedReceiptIds = selection.map((item) => item.id)
    },

    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadReceipts()
    },

    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadReceipts()
    },

    viewDetail(row) {
      this.selectedReceiptId = row.id
      this.showReceivingDetail = true
    },

    startInspection(row) {
      this.selectedReceiptId = row.id
      this.showInspectionForm = true
    },

    viewInspection(row) {
      this.selectedInspectionId = row.inspection_id
      this.showInspectionDetail = true
    },

    batchInspection() {
      if (this.selectedReceiptIds.length === 0) {
        this.$message.warning('検査対象を選択してください')
        return
      }
      this.showBatchInspection = true
    },

    async printReceipt(row) {
      try {
        const response = await outsourcingApi.printReceipt(row.id)
        if (response.success) {
          // 打开打印预览或下载PDF
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

        if (this.searchForm.receiptDateRange && this.searchForm.receiptDateRange.length === 2) {
          params.startDate = this.searchForm.receiptDateRange[0]
          params.endDate = this.searchForm.receiptDateRange[1]
        }

        const response = await outsourcingApi.exportReceipts(params)
        if (response.success) {
          // 下载导出文件
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

    handleReceivingSuccess() {
      this.showReceivingForm = false
      this.loadReceipts()
      this.$message.success('受領を登録しました')
    },

    handleInspectionSuccess() {
      this.showInspectionForm = false
      this.loadReceipts()
      this.$message.success('検査を完了しました')
    },

    handleBatchInspectionSuccess() {
      this.showBatchInspection = false
      this.loadReceipts()
      this.$message.success('一括検査を完了しました')
    },

    getStatusType(status) {
      const typeMap = {
        受領済: 'info',
        検査待ち: 'warning',
        検査中: 'primary',
        合格: 'success',
        不合格: 'danger',
        部分合格: 'warning',
      }
      return typeMap[status] || 'info'
    },

    getStatusText(status) {
      return status || '未設定'
    },

    getInspectionStatusType(status) {
      const typeMap = {
        pending: 'warning',
        inspecting: 'primary',
        passed: 'success',
        failed: 'danger',
        conditional: 'warning',
      }
      return typeMap[status] || 'info'
    },

    getInspectionStatusText(status) {
      const textMap = {
        pending: '検査待ち',
        inspecting: '検査中',
        passed: '合格',
        failed: '不合格',
        conditional: '条件付合格',
      }
      return textMap[status] || '未検査'
    },

    refresh() {
      this.loadReceipts()
    },
  },
}
</script>

<style scoped>
.receipt-inspection {
  padding: 20px;
}

.search-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
}
</style>
