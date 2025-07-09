<template>
  <div class="batch-process-form">
    <el-form
      ref="form"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small">

      <!-- 选中项目概览 -->
      <div class="selected-overview">
        <h4>選択項目概要</h4>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-label">選択件数</div>
              <div class="overview-value">{{ selectedRows.length }}件</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-label">総精算額</div>
              <div class="overview-value amount">¥{{ formatNumber(totalAmount) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-label">仕入先数</div>
              <div class="overview-value">{{ uniqueSuppliers.length }}社</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-card">
              <div class="overview-label">期間範囲</div>
              <div class="overview-value period">{{ periodRange }}</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 处理选项 -->
      <div class="process-options">
        <h4>処理オプション</h4>
        <el-form-item label="処理タイプ" prop="process_type">
          <el-radio-group v-model="formData.process_type" @change="handleProcessTypeChange">
            <el-radio label="approve">一括承認</el-radio>
            <el-radio label="reject">一括却下</el-radio>
            <el-radio label="hold">一括保留</el-radio>
            <el-radio label="payment_schedule">支払予定設定</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 支付计划设置 -->
        <div v-if="formData.process_type === 'payment_schedule'" class="payment-schedule-section">
          <el-form-item label="支払方法" prop="payment_method">
            <el-select v-model="formData.payment_method" placeholder="支払方法を選択">
              <el-option label="銀行振込" value="bank_transfer"></el-option>
              <el-option label="現金" value="cash"></el-option>
              <el-option label="小切手" value="check"></el-option>
              <el-option label="電子決済" value="electronic"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="支払予定日" prop="payment_date">
            <el-date-picker
              v-model="formData.payment_date"
              type="date"
              placeholder="支払予定日を選択"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd">
            </el-date-picker>
          </el-form-item>

          <el-form-item label="支払条件" prop="payment_terms">
            <el-select v-model="formData.payment_terms" placeholder="支払条件を選択">
              <el-option label="即時払い" value="immediate"></el-option>
              <el-option label="月末締翌月末払い" value="monthly_end"></el-option>
              <el-option label="20日締翌月10日払い" value="20th_10th"></el-option>
              <el-option label="その他" value="other"></el-option>
            </el-select>
          </el-form-item>
        </div>

        <!-- 处理原因 -->
        <el-form-item label="処理理由" prop="process_reason">
          <el-input
            v-model="formData.process_reason"
            type="textarea"
            :rows="3"
            placeholder="処理理由を入力してください">
          </el-input>
        </el-form-item>

        <!-- 处理者信息 -->
        <el-form-item label="処理者" prop="processed_by">
          <el-input v-model="formData.processed_by" placeholder="処理者名を入力"></el-input>
        </el-form-item>

        <el-form-item label="処理日時" prop="process_date">
          <el-date-picker
            v-model="formData.process_date"
            type="datetime"
            placeholder="処理日時を選択"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss">
          </el-date-picker>
        </el-form-item>
      </div>

      <!-- 选中项目列表 -->
      <div class="selected-items">
        <h4>選択項目一覧</h4>
        <el-table
          :data="selectedRows"
          border
          size="small"
          max-height="300">
          <el-table-column prop="settlement_no" label="精算番号" width="120"></el-table-column>
          <el-table-column prop="supplier_name" label="仕入先" width="150"></el-table-column>
          <el-table-column prop="settlement_period" label="精算期間" width="100">
            <template slot-scope="scope">
              {{ formatPeriod(scope.row.settlement_period) }}
            </template>
          </el-table-column>
          <el-table-column prop="final_amount" label="精算額" width="120" align="right">
            <template slot-scope="scope">
              ¥{{ formatNumber(scope.row.final_amount) }}
            </template>
          </el-table-column>
          <el-table-column prop="settlement_status" label="現在状態" width="100">
            <template slot-scope="scope">
              <el-tag :type="getSettlementStatusType(scope.row.settlement_status)" size="small">
                {{ getSettlementStatusText(scope.row.settlement_status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="payment_date" label="支払予定日" width="100">
            <template slot-scope="scope">
              {{ formatDate(scope.row.payment_date) }}
            </template>
          </el-table-column>
          <el-table-column label="処理後状態" width="100">
            <template slot-scope="scope">
              <el-tag :type="getNewStatusType()" size="small">
                {{ getNewStatusText() }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 处理确认 -->
      <div class="process-confirmation">
        <h4>処理確認</h4>
        <el-alert
          :title="getConfirmationMessage()"
          :type="getConfirmationType()"
          show-icon
          :closable="false">
        </el-alert>

        <div class="confirmation-details">
          <p><strong>処理対象:</strong> {{ selectedRows.length }}件の精算</p>
          <p><strong>総金額:</strong> ¥{{ formatNumber(totalAmount) }}</p>
          <p><strong>処理タイプ:</strong> {{ getProcessTypeText(formData.process_type) }}</p>
          <p v-if="formData.process_type === 'payment_schedule'">
            <strong>支払予定日:</strong> {{ formatDate(formData.payment_date) }}
          </p>
        </div>

        <el-checkbox v-model="formData.confirmed" class="confirmation-checkbox">
          上記内容を確認し、処理を実行することに同意します
        </el-checkbox>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button
        type="primary"
        @click="handleSave"
        :loading="saving"
        :disabled="!formData.confirmed">
        {{ getProcessButtonText() }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BatchProcessForm',
  props: {
    selectedRows: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      saving: false,
      formData: {
        process_type: 'approve',
        payment_method: 'bank_transfer',
        payment_date: '',
        payment_terms: 'monthly_end',
        process_reason: '',
        processed_by: '',
        process_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
        confirmed: false
      },
      formRules: {
        process_type: [
          { required: true, message: '処理タイプを選択してください', trigger: 'change' }
        ],
        process_reason: [
          { required: true, message: '処理理由を入力してください', trigger: 'blur' }
        ],
        processed_by: [
          { required: true, message: '処理者を入力してください', trigger: 'blur' }
        ],
        process_date: [
          { required: true, message: '処理日時を選択してください', trigger: 'change' }
        ],
        payment_method: [
          { required: true, message: '支払方法を選択してください', trigger: 'change' }
        ],
        payment_date: [
          { required: true, message: '支払予定日を選択してください', trigger: 'change' }
        ],
        payment_terms: [
          { required: true, message: '支払条件を選択してください', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    totalAmount() {
      return this.selectedRows.reduce((sum, row) => sum + (row.final_amount || 0), 0)
    },

    uniqueSuppliers() {
      const suppliers = new Set(this.selectedRows.map(row => row.supplier_name))
      return Array.from(suppliers)
    },

    periodRange() {
      const periods = this.selectedRows.map(row => row.settlement_period).sort()
      if (periods.length === 0) return '-'
      if (periods.length === 1) return this.formatPeriod(periods[0])
      return `${this.formatPeriod(periods[0])} ～ ${this.formatPeriod(periods[periods.length - 1])}`
    }
  },
  methods: {
    handleProcessTypeChange() {
      // 重置相关字段
      if (this.formData.process_type !== 'payment_schedule') {
        this.formData.payment_method = 'bank_transfer'
        this.formData.payment_date = ''
        this.formData.payment_terms = 'monthly_end'
      }

      // 更新验证规则
      this.updateValidationRules()
    },

    updateValidationRules() {
      if (this.formData.process_type === 'payment_schedule') {
        this.formRules.payment_method[0].required = true
        this.formRules.payment_date[0].required = true
        this.formRules.payment_terms[0].required = true
      } else {
        this.formRules.payment_method[0].required = false
        this.formRules.payment_date[0].required = false
        this.formRules.payment_terms[0].required = false
      }
    },

    async handleSave() {
      try {
        await this.$refs.form.validate()

        if (!this.formData.confirmed) {
          this.$message.warning('処理内容を確認してください')
          return
        }

        this.saving = true

        const processData = {
          ...this.formData,
          settlement_ids: this.selectedRows.map(row => row.id)
        }

        this.$emit('save', processData)
      } catch (error) {
        console.error('バリデーションエラー:', error)
      } finally {
        this.saving = false
      }
    },

    handleCancel() {
      this.$emit('cancel')
    },

    getConfirmationMessage() {
      const typeMap = {
        approve: `${this.selectedRows.length}件の精算を一括承認します`,
        reject: `${this.selectedRows.length}件の精算を一括却下します`,
        hold: `${this.selectedRows.length}件の精算を一括保留します`,
        payment_schedule: `${this.selectedRows.length}件の精算に支払予定を設定します`
      }
      return typeMap[this.formData.process_type] || '処理を実行します'
    },

    getConfirmationType() {
      const typeMap = {
        approve: 'success',
        reject: 'error',
        hold: 'warning',
        payment_schedule: 'info'
      }
      return typeMap[this.formData.process_type] || 'info'
    },

    getProcessTypeText(type) {
      const typeMap = {
        approve: '一括承認',
        reject: '一括却下',
        hold: '一括保留',
        payment_schedule: '支払予定設定'
      }
      return typeMap[type] || type
    },

    getProcessButtonText() {
      const buttonMap = {
        approve: '一括承認実行',
        reject: '一括却下実行',
        hold: '一括保留実行',
        payment_schedule: '支払予定設定実行'
      }
      return buttonMap[this.formData.process_type] || '実行'
    },

    getNewStatusType() {
      const typeMap = {
        approve: 'success',
        reject: 'danger',
        hold: 'warning',
        payment_schedule: 'primary'
      }
      return typeMap[this.formData.process_type] || 'info'
    },

    getNewStatusText() {
      const statusMap = {
        approve: '精算完了',
        reject: '却下',
        hold: '保留',
        payment_schedule: '支払予定'
      }
      return statusMap[this.formData.process_type] || '処理済み'
    },

    getSettlementStatusType(status) {
      const statusMap = {
        pending: 'warning',
        processing: 'primary',
        completed: 'success',
        hold: 'info'
      }
      return statusMap[status] || 'info'
    },

    getSettlementStatusText(status) {
      const statusMap = {
        pending: '未精算',
        processing: '精算中',
        completed: '精算完了',
        hold: '保留'
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
    }
  }
}
</script>

<style scoped>
.batch-process-form {
  padding: 0;
}

.selected-overview,
.process-options,
.selected-items,
.process-confirmation {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.selected-overview h4,
.process-options h4,
.selected-items h4,
.process-confirmation h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.overview-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overview-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
}

.overview-value.amount {
  color: #67c23a;
}

.overview-value.period {
  font-size: 14px;
  color: #409eff;
}

.payment-schedule-section {
  margin-top: 20px;
  padding: 15px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.confirmation-details {
  margin: 15px 0;
  padding: 15px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.confirmation-details p {
  margin: 8px 0;
  color: #606266;
}

.confirmation-checkbox {
  margin-top: 15px;
  font-weight: 600;
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

.el-form-item {
  margin-bottom: 18px;
}

.el-select {
  width: 100%;
}

.el-date-editor {
  width: 100%;
}

.el-table {
  margin-top: 10px;
}

.el-radio-group {
  display: flex;
  flex-wrap: wrap;
}

.el-radio {
  margin-right: 20px;
  margin-bottom: 10px;
}

.el-alert {
  margin-bottom: 15px;
}
</style>
