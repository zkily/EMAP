<template>
  <div class="schedule-report-form">
    <el-form :model="form" :rules="rules" ref="form" label-width="120px">
      <el-form-item label="レポート名" prop="reportName">
        <el-input v-model="form.reportName" placeholder="レポート名を入力してください" />
      </el-form-item>
      
      <el-form-item label="実行頻度" prop="frequency">
        <el-select v-model="form.frequency" placeholder="実行頻度を選択" style="width: 100%">
          <el-option label="毎日" value="daily" />
          <el-option label="毎週" value="weekly" />
          <el-option label="毎月" value="monthly" />
          <el-option label="四半期" value="quarterly" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="実行時間" prop="executeTime">
        <el-time-picker
          v-model="form.executeTime"
          placeholder="実行時間を選択"
          format="HH:mm"
          value-format="HH:mm"
          style="width: 100%" />
      </el-form-item>
      
      <el-form-item label="実行日" prop="executeDay" v-if="form.frequency === 'weekly'">
        <el-select v-model="form.executeDay" placeholder="実行日を選択" style="width: 100%">
          <el-option label="月曜日" value="1" />
          <el-option label="火曜日" value="2" />
          <el-option label="水曜日" value="3" />
          <el-option label="木曜日" value="4" />
          <el-option label="金曜日" value="5" />
          <el-option label="土曜日" value="6" />
          <el-option label="日曜日" value="0" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="実行日" prop="executeDate" v-if="form.frequency === 'monthly'">
        <el-input-number
          v-model="form.executeDate"
          :min="1"
          :max="31"
          placeholder="実行日"
          style="width: 100%" />
      </el-form-item>
      
      <el-form-item label="送信先" prop="recipients">
        <el-select
          v-model="form.recipients"
          multiple
          filterable
          allow-create
          placeholder="送信先メールアドレスを入力"
          style="width: 100%">
          <el-option
            v-for="email in predefinedEmails"
            :key="email"
            :label="email"
            :value="email" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="フォーマット" prop="format">
        <el-checkbox-group v-model="form.format">
          <el-checkbox label="pdf">PDF</el-checkbox>
          <el-checkbox label="excel">Excel</el-checkbox>
          <el-checkbox label="email">メール本文</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="有効期間">
        <el-date-picker
          v-model="form.validPeriod"
          type="daterange"
          range-separator="～"
          start-placeholder="開始日"
          end-placeholder="終了日"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          style="width: 100%" />
      </el-form-item>
      
      <el-form-item label="説明">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="レポートの説明を入力してください" />
      </el-form-item>
      
      <el-form-item label="有効">
        <el-switch v-model="form.enabled" />
      </el-form-item>
    </el-form>
    
    <div class="form-actions">
      <el-button @click="$emit('cancel')">キャンセル</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        保存
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'ScheduleReportForm',
  props: {
    filterForm: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      loading: false,
      form: {
        reportName: '',
        frequency: 'monthly',
        executeTime: '09:00',
        executeDay: '1',
        executeDate: 1,
        recipients: [],
        format: ['pdf'],
        validPeriod: [],
        description: '',
        enabled: true
      },
      predefinedEmails: [
        'manager@company.com',
        'finance@company.com',
        'procurement@company.com'
      ],
      rules: {
        reportName: [
          { required: true, message: 'レポート名を入力してください', trigger: 'blur' }
        ],
        frequency: [
          { required: true, message: '実行頻度を選択してください', trigger: 'change' }
        ],
        executeTime: [
          { required: true, message: '実行時間を選択してください', trigger: 'change' }
        ],
        recipients: [
          { required: true, message: '送信先を入力してください', trigger: 'change' }
        ],
        format: [
          { required: true, message: 'フォーマットを選択してください', trigger: 'change' }
        ]
      }
    }
  },
  mounted() {
    this.initForm()
  },
  methods: {
    initForm() {
      // 设置默认有效期间为未来一年
      const startDate = new Date()
      const endDate = new Date()
      endDate.setFullYear(endDate.getFullYear() + 1)
      
      this.form.validPeriod = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ]
      
      // 根据筛选条件生成默认报告名
      if (this.filterForm.reportType) {
        const typeMap = {
          comprehensive: '総合分析',
          cost: 'コスト分析',
          quality: '品質分析',
          delivery: '納期分析',
          supplier_comparison: '仕入先比較'
        }
        this.form.reportName = `${typeMap[this.filterForm.reportType] || '分析'}レポート`
      }
    },
    
    async handleSubmit() {
      try {
        await this.$refs.form.validate()
        
        this.loading = true
        
        const params = {
          ...this.form,
          filterConfig: this.filterForm,
          startDate: this.form.validPeriod[0],
          endDate: this.form.validPeriod[1]
        }
        
        const response = await outsourcingApi.createScheduledReport(params)
        
        if (response.success) {
          this.$message.success('定期レポートを設定しました')
          this.$emit('success')
        } else {
          this.$message.error(response.message || '設定に失敗しました')
        }
      } catch (error) {
        if (error !== false) { // 验证失败时不显示错误
          console.error('定期レポート設定エラー:', error)
          this.$message.error('設定に失敗しました')
        }
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.schedule-report-form {
  padding: 20px 0;
}

.form-actions {
  text-align: right;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.form-actions .el-button + .el-button {
  margin-left: 10px;
}
</style>