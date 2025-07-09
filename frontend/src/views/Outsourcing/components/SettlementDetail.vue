<template>
  <div class="settlement-detail">
    <!-- 基本信息 -->
    <div class="detail-section">
      <h4>基本情報</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>精算番号:</label>
            <span class="value">{{ settlementData.settlement_no }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>仕入先:</label>
            <span class="value">{{ settlementData.supplier_name }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>精算期間:</label>
            <span class="value">{{ formatPeriod(settlementData.settlement_period) }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>精算状態:</label>
            <el-tag :type="getSettlementStatusType(settlementData.settlement_status)">
              {{ getSettlementStatusText(settlementData.settlement_status) }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>支払状態:</label>
            <el-tag :type="getPaymentStatusType(settlementData.payment_status)">
              {{ getPaymentStatusText(settlementData.payment_status) }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>精算日:</label>
            <span class="value">{{ formatDate(settlementData.settlement_date) }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 金额概览 -->
    <div class="detail-section">
      <h4>金額概要</h4>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="amount-card">
            <div class="amount-label">小計</div>
            <div class="amount-value subtotal">¥{{ formatNumber(settlementData.subtotal) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="amount-card">
            <div class="amount-label">消費税 ({{ settlementData.tax_rate }}%)</div>
            <div class="amount-value tax">¥{{ formatNumber(settlementData.tax_amount) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="amount-card">
            <div class="amount-label">調整額</div>
            <div
              class="amount-value adjustment"
              :class="{ negative: settlementData.adjustment_amount < 0 }"
            >
              ¥{{ formatNumber(settlementData.adjustment_amount) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="amount-card final">
            <div class="amount-label">精算額</div>
            <div class="amount-value final-amount">
              ¥{{ formatNumber(settlementData.final_amount) }}
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="info-item" v-if="settlementData.adjustment_reason">
        <label>調整理由:</label>
        <span class="value">{{ settlementData.adjustment_reason }}</span>
      </div>
    </div>

    <!-- 注文明细 -->
    <div class="detail-section">
      <h4>注文明細 ({{ orderList.length }}件)</h4>
      <el-table :data="orderList" v-loading="loadingOrders" border size="small" max-height="400">
        <el-table-column
          prop="order_no"
          label="注文番号"
          width="120"
          fixed="left"
        ></el-table-column>
        <el-table-column prop="product_name" label="製品名" width="200"></el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.quantity) }} {{ scope.row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="unit_price" label="単価" width="100" align="right">
          <template slot-scope="scope"> ¥{{ formatNumber(scope.row.unit_price) }} </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金額" width="120" align="right">
          <template slot-scope="scope"> ¥{{ formatNumber(scope.row.total_amount) }} </template>
        </el-table-column>
        <el-table-column prop="order_date" label="注文日" width="100">
          <template slot-scope="scope">
            {{ formatDate(scope.row.order_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="納期" width="100">
          <template slot-scope="scope">
            {{ formatDate(scope.row.delivery_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="completed_date" label="完了日" width="100">
          <template slot-scope="scope">
            {{ formatDate(scope.row.completed_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状態" width="80">
          <template slot-scope="scope">
            <el-tag :type="getOrderStatusType(scope.row.status)" size="small">
              {{ getOrderStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button type="link" size="small" @click="viewOrder(scope.row)"> 詳細 </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 合计信息 -->
      <div class="order-summary">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="summary-item">
              <label>総注文件数:</label>
              <span class="value">{{ orderList.length }}件</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <label>総数量:</label>
              <span class="value">{{ formatNumber(totalQuantity) }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <label>平均単価:</label>
              <span class="value">¥{{ formatNumber(averageUnitPrice) }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="summary-item">
              <label>総金額:</label>
              <span class="value amount">¥{{ formatNumber(totalOrderAmount) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 支付信息 -->
    <div class="detail-section">
      <h4>支払情報</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>支払方法:</label>
            <span class="value">{{ getPaymentMethodText(settlementData.payment_method) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>支払条件:</label>
            <span class="value">{{ getPaymentTermsText(settlementData.payment_terms) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>支払予定日:</label>
            <span class="value">{{ formatDate(settlementData.payment_date) }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="settlementData.payment_method === 'bank_transfer'">
        <el-col :span="12">
          <div class="info-item">
            <label>振込先銀行:</label>
            <span class="value">{{ settlementData.bank_name || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>口座番号:</label>
            <span class="value">{{ settlementData.account_number || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <div class="info-item" v-if="settlementData.payment_notes">
        <label>支払備考:</label>
        <div class="notes-content">{{ settlementData.payment_notes }}</div>
      </div>
    </div>

    <!-- 处理历史 -->
    <div class="detail-section">
      <h4>処理履歴</h4>
      <el-timeline>
        <el-timeline-item
          v-for="(history, index) in processHistory"
          :key="index"
          :timestamp="formatDateTime(history.created_at)"
          :type="getHistoryType(history.action)"
        >
          <div class="history-content">
            <div class="history-action">{{ getHistoryActionText(history.action) }}</div>
            <div class="history-user">処理者: {{ history.user_name }}</div>
            <div class="history-notes" v-if="history.notes">{{ history.notes }}</div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </div>

    <!-- 备注信息 -->
    <div class="detail-section">
      <h4>備考情報</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>精算担当者:</label>
            <span class="value">{{ settlementData.settlement_by || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>作成日時:</label>
            <span class="value">{{ formatDateTime(settlementData.created_at) }}</span>
          </div>
        </el-col>
      </el-row>

      <div class="info-item" v-if="settlementData.notes">
        <label>備考:</label>
        <div class="notes-content">{{ settlementData.notes }}</div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="handleClose">閉じる</el-button>
      <el-button type="primary" @click="handleEdit" v-if="canEdit"> 編集 </el-button>
      <el-button type="success" @click="handleProcess" v-if="canProcess"> 処理 </el-button>
      <el-button @click="handlePrint"> 印刷 </el-button>
      <el-button @click="handleExport"> エクスポート </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'SettlementDetail',
  props: {
    settlementData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      loadingOrders: false,
      orderList: [],
      processHistory: [],
    }
  },
  computed: {
    canEdit() {
      return (
        this.settlementData.settlement_status === 'pending' ||
        this.settlementData.settlement_status === 'processing'
      )
    },

    canProcess() {
      return this.settlementData.settlement_status === 'pending'
    },

    totalQuantity() {
      return this.orderList.reduce((sum, order) => sum + (order.quantity || 0), 0)
    },

    totalOrderAmount() {
      return this.orderList.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    },

    averageUnitPrice() {
      if (this.orderList.length === 0) return 0
      const totalAmount = this.totalOrderAmount
      const totalQuantity = this.totalQuantity
      return totalQuantity > 0 ? totalAmount / totalQuantity : 0
    },
  },
  mounted() {
    this.loadOrderList()
    this.loadProcessHistory()
  },
  methods: {
    async loadOrderList() {
      this.loadingOrders = true
      try {
        const response = await outsourcingApi.getSettlementOrders(this.settlementData.id)
        if (response.success) {
          this.orderList = response.data
        }
      } catch (error) {
        console.error('注文データ取得エラー:', error)
      } finally {
        this.loadingOrders = false
      }
    },

    async loadProcessHistory() {
      try {
        const response = await outsourcingApi.getSettlementHistory(this.settlementData.id)
        if (response.success) {
          this.processHistory = response.data
        }
      } catch (error) {
        console.error('処理履歴取得エラー:', error)
      }
    },

    viewOrder(order) {
      this.$emit('view-order', order.id)
    },

    handleClose() {
      this.$emit('close')
    },

    handleEdit() {
      this.$emit('edit', this.settlementData)
    },

    handleProcess() {
      this.$confirm('この精算を処理しますか？', '確認', {
        confirmButtonText: '処理',
        cancelButtonText: 'キャンセル',
        type: 'warning',
      }).then(() => {
        this.$emit('process', this.settlementData)
      })
    },

    handlePrint() {
      this.$message.info('印刷機能は開発中です')
    },

    handleExport() {
      this.$message.info('エクスポート機能は開発中です')
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

    getOrderStatusType(status) {
      const statusMap = {
        pending: 'warning',
        in_progress: 'primary',
        completed: 'success',
        cancelled: 'danger',
      }
      return statusMap[status] || 'info'
    },

    getOrderStatusText(status) {
      const statusMap = {
        pending: '未着手',
        in_progress: '進行中',
        completed: '完了',
        cancelled: 'キャンセル',
      }
      return statusMap[status] || status
    },

    getPaymentMethodText(method) {
      const methodMap = {
        bank_transfer: '銀行振込',
        cash: '現金',
        check: '小切手',
        electronic: '電子決済',
      }
      return methodMap[method] || method
    },

    getPaymentTermsText(terms) {
      const termsMap = {
        immediate: '即時払い',
        monthly_end: '月末締翌月末払い',
        '20th_10th': '20日締翌月10日払い',
        other: 'その他',
      }
      return termsMap[terms] || terms
    },

    getHistoryType(action) {
      const typeMap = {
        created: 'primary',
        updated: 'warning',
        processed: 'success',
        cancelled: 'danger',
      }
      return typeMap[action] || 'info'
    },

    getHistoryActionText(action) {
      const actionMap = {
        created: '精算作成',
        updated: '精算更新',
        processed: '精算処理',
        cancelled: '精算キャンセル',
      }
      return actionMap[action] || action
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ja-JP')
    },

    formatDateTime(datetime) {
      if (!datetime) return '-'
      return new Date(datetime).toLocaleString('ja-JP')
    },

    formatPeriod(period) {
      if (!period) return '-'
      return period.replace('-', '年') + '月'
    },
  },
}
</script>

<style scoped>
.settlement-detail {
  padding: 0;
}

.detail-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.detail-section h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-item label {
  font-weight: 600;
  color: #5a6c7d;
  margin-right: 10px;
  min-width: 120px;
}

.info-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.amount-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.amount-card.final {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: white;
}

.amount-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.amount-card.final .amount-label {
  color: rgba(255, 255, 255, 0.8);
}

.amount-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.amount-value.subtotal {
  color: #409eff;
}

.amount-value.tax {
  color: #e6a23c;
}

.amount-value.adjustment {
  color: #67c23a;
}

.amount-value.adjustment.negative {
  color: #f56c6c;
}

.amount-value.final-amount {
  color: white;
  font-size: 20px;
}

.order-summary {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item label {
  font-weight: 600;
  color: #5a6c7d;
}

.summary-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.summary-item .value.amount {
  color: #67c23a;
  font-weight: bold;
}

.notes-content {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  margin-top: 5px;
  color: #606266;
  line-height: 1.5;
}

.history-content {
  padding: 10px 0;
}

.history-action {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.history-user {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.history-notes {
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 8px;
  border-radius: 4px;
}

.action-buttons {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.action-buttons .el-button {
  margin-left: 10px;
}

.el-tag {
  margin-left: 5px;
}

.el-table {
  margin-top: 10px;
}

.el-timeline {
  padding-left: 0;
}
</style>
