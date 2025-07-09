<template>
  <div class="settlement-form">
    <el-form ref="form" :model="formData" :rules="formRules" label-width="120px" size="small">
      <!-- 基本信息 -->
      <div class="form-section">
        <h4>基本情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="精算番号" prop="settlement_no">
              <el-input
                v-model="formData.settlement_no"
                :disabled="mode !== 'create'"
                placeholder="自動生成"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仕入先" prop="supplier_id">
              <el-select
                v-model="formData.supplier_id"
                placeholder="仕入先を選択"
                @change="handleSupplierChange"
                :disabled="mode === 'view'"
              >
                <el-option
                  v-for="supplier in supplierList"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="精算期間" prop="settlement_period">
              <el-date-picker
                v-model="formData.settlement_period"
                type="month"
                placeholder="精算期間を選択"
                format="yyyy年MM月"
                value-format="yyyy-MM"
                @change="handlePeriodChange"
                :disabled="mode === 'view'"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="精算状態" prop="settlement_status">
              <el-select v-model="formData.settlement_status" :disabled="mode === 'view'">
                <el-option label="未精算" value="pending"></el-option>
                <el-option label="精算中" value="processing"></el-option>
                <el-option label="精算完了" value="completed"></el-option>
                <el-option label="保留" value="hold"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 注文明细 -->
      <div class="form-section">
        <h4>
          注文明細
          <el-button
            type="link"
            @click="loadOrders"
            :loading="loadingOrders"
            v-if="mode !== 'view'"
          >
            <i class="el-icon-refresh"></i> 注文読込
          </el-button>
        </h4>

        <el-table
          :data="orderList"
          v-loading="loadingOrders"
          @selection-change="handleOrderSelection"
          border
          size="small"
          max-height="300"
        >
          <el-table-column type="selection" width="55" v-if="mode !== 'view'"></el-table-column>
          <el-table-column prop="order_no" label="注文番号" width="120"></el-table-column>
          <el-table-column prop="product_name" label="製品名" width="150"></el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" align="right">
            <template slot-scope="scope">
              {{ formatNumber(scope.row.quantity) }}
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
          <el-table-column prop="status" label="状態" width="80">
            <template slot-scope="scope">
              <el-tag :type="getOrderStatusType(scope.row.status)" size="small">
                {{ getOrderStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 金额计算 -->
      <div class="form-section">
        <h4>金額計算</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="小計" prop="subtotal">
              <el-input v-model="formData.subtotal" :disabled="true">
                <template slot="prepend">¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消費税率" prop="tax_rate">
              <el-input
                v-model="formData.tax_rate"
                :disabled="mode === 'view'"
                @input="calculateAmounts"
              >
                <template slot="append">%</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消費税額" prop="tax_amount">
              <el-input v-model="formData.tax_amount" :disabled="true">
                <template slot="prepend">¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="調整額" prop="adjustment_amount">
              <el-input
                v-model="formData.adjustment_amount"
                :disabled="mode === 'view'"
                @input="calculateAmounts"
              >
                <template slot="prepend">¥</template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item
              label="調整理由"
              prop="adjustment_reason"
              v-if="formData.adjustment_amount && formData.adjustment_amount != 0"
            >
              <el-input
                v-model="formData.adjustment_reason"
                :disabled="mode === 'view'"
                placeholder="調整理由を入力"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="精算額" prop="final_amount">
              <el-input v-model="formData.final_amount" :disabled="true" class="final-amount">
                <template slot="prepend">¥</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 支付信息 -->
      <div class="form-section">
        <h4>支払情報</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="支払方法" prop="payment_method">
              <el-select v-model="formData.payment_method" :disabled="mode === 'view'">
                <el-option label="銀行振込" value="bank_transfer"></el-option>
                <el-option label="現金" value="cash"></el-option>
                <el-option label="小切手" value="check"></el-option>
                <el-option label="電子決済" value="electronic"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="支払条件" prop="payment_terms">
              <el-select v-model="formData.payment_terms" :disabled="mode === 'view'">
                <el-option label="即時払い" value="immediate"></el-option>
                <el-option label="月末締翌月末払い" value="monthly_end"></el-option>
                <el-option label="20日締翌月10日払い" value="20th_10th"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="支払予定日" prop="payment_date">
              <el-date-picker
                v-model="formData.payment_date"
                type="date"
                placeholder="支払予定日"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :disabled="mode === 'view'"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item
              label="振込先銀行"
              prop="bank_name"
              v-if="formData.payment_method === 'bank_transfer'"
            >
              <el-input
                v-model="formData.bank_name"
                :disabled="mode === 'view'"
                placeholder="銀行名を入力"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="口座番号"
              prop="account_number"
              v-if="formData.payment_method === 'bank_transfer'"
            >
              <el-input
                v-model="formData.account_number"
                :disabled="mode === 'view'"
                placeholder="口座番号を入力"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 备注信息 -->
      <div class="form-section">
        <h4>備考情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="精算担当者" prop="settlement_by">
              <el-input
                v-model="formData.settlement_by"
                :disabled="mode === 'view'"
                placeholder="担当者名を入力"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="精算日" prop="settlement_date">
              <el-date-picker
                v-model="formData.settlement_date"
                type="date"
                placeholder="精算日"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :disabled="mode === 'view'"
              >
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="備考" prop="notes">
          <el-input
            v-model="formData.notes"
            type="textarea"
            :rows="3"
            :disabled="mode === 'view'"
            placeholder="備考を入力"
          >
          </el-input>
        </el-form-item>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions" v-if="mode !== 'view'">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        {{ mode === 'create' ? '作成' : '更新' }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'SettlementForm',
  props: {
    formData: {
      type: Object,
      default: () => ({}),
    },
    mode: {
      type: String,
      default: 'create', // create, edit, view
    },
  },
  data() {
    return {
      saving: false,
      loadingOrders: false,
      supplierList: [],
      orderList: [],
      selectedOrders: [],
      formRules: {
        supplier_id: [{ required: true, message: '仕入先を選択してください', trigger: 'change' }],
        settlement_period: [
          { required: true, message: '精算期間を選択してください', trigger: 'change' },
        ],
        settlement_status: [
          { required: true, message: '精算状態を選択してください', trigger: 'change' },
        ],
        tax_rate: [{ required: true, message: '消費税率を入力してください', trigger: 'blur' }],
        payment_method: [
          { required: true, message: '支払方法を選択してください', trigger: 'change' },
        ],
        payment_terms: [
          { required: true, message: '支払条件を選択してください', trigger: 'change' },
        ],
      },
    }
  },
  watch: {
    formData: {
      handler(newVal) {
        if (newVal && Object.keys(newVal).length > 0) {
          this.initializeForm()
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.loadSupplierList()
    this.initializeForm()
  },
  methods: {
    initializeForm() {
      if (this.mode === 'create') {
        this.$set(this.formData, 'settlement_no', '')
        this.$set(this.formData, 'supplier_id', '')
        this.$set(this.formData, 'settlement_period', '')
        this.$set(this.formData, 'settlement_status', 'pending')
        this.$set(this.formData, 'tax_rate', 10)
        this.$set(this.formData, 'adjustment_amount', 0)
        this.$set(this.formData, 'payment_method', 'bank_transfer')
        this.$set(this.formData, 'payment_terms', 'monthly_end')
        this.$set(this.formData, 'settlement_by', '')
        this.$set(this.formData, 'notes', '')
      }

      // 确保所有必要字段都存在
      const defaultValues = {
        subtotal: 0,
        tax_amount: 0,
        final_amount: 0,
        order_count: 0,
      }

      Object.keys(defaultValues).forEach((key) => {
        if (this.formData[key] === undefined) {
          this.$set(this.formData, key, defaultValues[key])
        }
      })
    },

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

    async loadOrders() {
      if (!this.formData.supplier_id || !this.formData.settlement_period) {
        this.$message.warning('仕入先と精算期間を選択してください')
        return
      }

      this.loadingOrders = true
      try {
        const params = {
          supplier_id: this.formData.supplier_id,
          period: this.formData.settlement_period,
          status: 'completed', // 完了した注文のみ
        }
        const response = await outsourcingApi.getOrdersForSettlement(params)
        if (response.success) {
          this.orderList = response.data
        }
      } catch (error) {
        console.error('注文データ取得エラー:', error)
        this.$message.error('注文データの取得に失敗しました')
      } finally {
        this.loadingOrders = false
      }
    },

    handleSupplierChange() {
      this.orderList = []
      this.selectedOrders = []
      this.calculateAmounts()
    },

    handlePeriodChange() {
      this.orderList = []
      this.selectedOrders = []
      this.calculateAmounts()
    },

    handleOrderSelection(selection) {
      this.selectedOrders = selection
      this.calculateAmounts()
    },

    calculateAmounts() {
      // 计算小计
      const subtotal = this.selectedOrders.reduce((sum, order) => {
        return sum + (order.total_amount || 0)
      }, 0)

      this.$set(this.formData, 'subtotal', subtotal)
      this.$set(this.formData, 'order_count', this.selectedOrders.length)

      // 计算消费税
      const taxRate = parseFloat(this.formData.tax_rate) || 0
      const taxAmount = Math.round((subtotal * taxRate) / 100)
      this.$set(this.formData, 'tax_amount', taxAmount)

      // 计算最终金额
      const adjustmentAmount = parseFloat(this.formData.adjustment_amount) || 0
      const finalAmount = subtotal + taxAmount + adjustmentAmount
      this.$set(this.formData, 'final_amount', finalAmount)
    },

    async handleSave() {
      try {
        await this.$refs.form.validate()

        if (this.selectedOrders.length === 0 && this.mode === 'create') {
          this.$message.warning('注文を選択してください')
          return
        }

        this.saving = true

        const submitData = {
          ...this.formData,
          order_ids: this.selectedOrders.map((order) => order.id),
        }

        this.$emit('save', submitData)
      } catch (error) {
        console.error('バリデーションエラー:', error)
      } finally {
        this.saving = false
      }
    },

    handleCancel() {
      this.$emit('cancel')
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
.settlement-form {
  padding: 0;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.form-section h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.final-amount .el-input__inner {
  font-weight: bold;
  color: #67c23a;
  font-size: 16px;
}

.form-actions {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.form-actions .el-button {
  margin-left: 10px;
}

.el-table {
  margin-top: 10px;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-input-group__prepend,
.el-input-group__append {
  background-color: #f5f7fa;
  color: #909399;
  border-color: #dcdfe6;
}

.el-select {
  width: 100%;
}

.el-date-editor {
  width: 100%;
}
</style>
