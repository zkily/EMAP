<template>
  <div class="performance-record-form">
    <el-form
      ref="recordForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
    >
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="12">
          <el-form-item label="期間" prop="period">
            <el-date-picker
              v-model="formData.period"
              type="month"
              placeholder="期間を選択"
              format="yyyy年MM月"
              value-format="yyyy-MM"
              style="width: 100%"
              :disabled="mode === 'view'"
            ></el-date-picker>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="記録タイプ" prop="record_type">
            <el-select
              v-model="formData.record_type"
              placeholder="記録タイプを選択"
              style="width: 100%"
              :disabled="mode === 'view'"
            >
              <el-option label="自動計算" value="auto"></el-option>
              <el-option label="手動入力" value="manual"></el-option>
              <el-option label="調整記録" value="adjustment"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <!-- 订单相关数据 -->
        <el-col :span="12">
          <el-form-item label="総注文数" prop="total_orders">
            <el-input-number
              v-model="formData.total_orders"
              :min="0"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="定時納品数" prop="on_time_orders">
            <el-input-number
              v-model="formData.on_time_orders"
              :min="0"
              :max="formData.total_orders"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <!-- 质量相关数据 -->
        <el-col :span="12">
          <el-form-item label="総数量" prop="total_quantity">
            <el-input-number
              v-model="formData.total_quantity"
              :min="0"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="不良数" prop="defect_quantity">
            <el-input-number
              v-model="formData.defect_quantity"
              :min="0"
              :max="formData.total_quantity"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <!-- 交付相关数据 -->
        <el-col :span="12">
          <el-form-item label="計画数量" prop="planned_quantity">
            <el-input-number
              v-model="formData.planned_quantity"
              :min="0"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="実際納品数" prop="actual_delivery">
            <el-input-number
              v-model="formData.actual_delivery"
              :min="0"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            ></el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <!-- 成本相关数据 -->
        <el-col :span="12">
          <el-form-item label="計画コスト" prop="planned_cost">
            <el-input-number
              v-model="formData.planned_cost"
              :min="0"
              :precision="2"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            >
              <template slot="append">円</template>
            </el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="実際コスト" prop="actual_cost">
            <el-input-number
              v-model="formData.actual_cost"
              :min="0"
              :precision="2"
              style="width: 100%"
              :disabled="mode === 'view'"
              @change="calculateMetrics"
            >
              <template slot="append">円</template>
            </el-input-number>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 计算结果显示 -->
      <el-divider content-position="left">計算結果</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="OTD率">
            <el-input
              :value="calculatedMetrics.otd_rate + '%'"
              readonly
              :class="getPerformanceClass('otd', calculatedMetrics.otd_rate)"
            ></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="6">
          <el-form-item label="品質PPM">
            <el-input
              :value="calculatedMetrics.quality_ppm"
              readonly
              :class="getPerformanceClass('quality', calculatedMetrics.quality_ppm)"
            ></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="6">
          <el-form-item label="納品精度">
            <el-input
              :value="calculatedMetrics.delivery_accuracy + '%'"
              readonly
              :class="getPerformanceClass('delivery', calculatedMetrics.delivery_accuracy)"
            ></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="6">
          <el-form-item label="コスト差異">
            <el-input
              :value="(calculatedMetrics.cost_variance > 0 ? '+' : '') + calculatedMetrics.cost_variance + '%'"
              readonly
              :class="calculatedMetrics.cost_variance >= 0 ? 'cost-over' : 'cost-under'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="総合評価" prop="overall_score">
            <el-input-number
              v-model="formData.overall_score"
              :min="0"
              :max="100"
              style="width: 100%"
              :disabled="mode === 'view'"
            >
              <template slot="append">点</template>
            </el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="評価グレード">
            <el-input
              :value="getScoreGrade(formData.overall_score || 0)"
              readonly
              :class="'grade-' + getScoreGrade(formData.overall_score || 0).toLowerCase()"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 问题和改善 -->
      <el-divider content-position="left">問題と改善</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="主要問題" prop="main_issues">
            <el-input
              v-model="formData.main_issues"
              type="textarea"
              :rows="3"
              placeholder="主要な問題点を記入"
              :disabled="mode === 'view'"
            ></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="改善提案" prop="improvement_suggestions">
            <el-input
              v-model="formData.improvement_suggestions"
              type="textarea"
              :rows="3"
              placeholder="改善提案を記入"
              :disabled="mode === 'view'"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="備考" prop="remarks">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="2"
          placeholder="その他の備考"
          :disabled="mode === 'view'"
        ></el-input>
      </el-form-item>
    </el-form>
    
    <!-- 操作按钮 -->
    <div class="form-actions" v-if="mode !== 'view'">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        {{ mode === 'create' ? '追加' : '更新' }}
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PerformanceRecordForm',
  props: {
    recordData: {
      type: Object,
      default: null
    },
    supplierData: {
      type: Object,
      required: true
    },
    mode: {
      type: String,
      default: 'create', // create, edit, view
      validator: value => ['create', 'edit', 'view'].includes(value)
    }
  },
  data() {
    return {
      saving: false,
      formData: {
        period: '',
        record_type: 'manual',
        total_orders: 0,
        on_time_orders: 0,
        total_quantity: 0,
        defect_quantity: 0,
        planned_quantity: 0,
        actual_delivery: 0,
        planned_cost: 0,
        actual_cost: 0,
        overall_score: 0,
        main_issues: '',
        improvement_suggestions: '',
        remarks: ''
      },
      formRules: {
        period: [
          { required: true, message: '期間を選択してください', trigger: 'change' }
        ],
        record_type: [
          { required: true, message: '記録タイプを選択してください', trigger: 'change' }
        ],
        total_orders: [
          { required: true, message: '総注文数を入力してください', trigger: 'blur' },
          { type: 'number', min: 0, message: '0以上の数値を入力してください', trigger: 'blur' }
        ],
        on_time_orders: [
          { required: true, message: '定時納品数を入力してください', trigger: 'blur' },
          { type: 'number', min: 0, message: '0以上の数値を入力してください', trigger: 'blur' }
        ],
        total_quantity: [
          { required: true, message: '総数量を入力してください', trigger: 'blur' },
          { type: 'number', min: 0, message: '0以上の数値を入力してください', trigger: 'blur' }
        ],
        defect_quantity: [
          { required: true, message: '不良数を入力してください', trigger: 'blur' },
          { type: 'number', min: 0, message: '0以上の数値を入力してください', trigger: 'blur' }
        ],
        overall_score: [
          { required: true, message: '総合評価を入力してください', trigger: 'blur' },
          { type: 'number', min: 0, max: 100, message: '0-100の数値を入力してください', trigger: 'blur' }
        ]
      },
      calculatedMetrics: {
        otd_rate: 0,
        quality_ppm: 0,
        delivery_accuracy: 0,
        cost_variance: 0
      }
    }
  },
  watch: {
    recordData: {
      handler(newData) {
        if (newData) {
          this.formData = { ...newData }
        } else {
          this.resetForm()
        }
        this.calculateMetrics()
      },
      immediate: true
    }
  },
  methods: {
    resetForm() {
      this.formData = {
        period: '',
        record_type: 'manual',
        total_orders: 0,
        on_time_orders: 0,
        total_quantity: 0,
        defect_quantity: 0,
        planned_quantity: 0,
        actual_delivery: 0,
        planned_cost: 0,
        actual_cost: 0,
        overall_score: 0,
        main_issues: '',
        improvement_suggestions: '',
        remarks: ''
      }
      this.calculatedMetrics = {
        otd_rate: 0,
        quality_ppm: 0,
        delivery_accuracy: 0,
        cost_variance: 0
      }
    },
    
    calculateMetrics() {
      // OTD率计算
      if (this.formData.total_orders > 0) {
        this.calculatedMetrics.otd_rate = Math.round(
          (this.formData.on_time_orders / this.formData.total_orders) * 100
        )
      } else {
        this.calculatedMetrics.otd_rate = 0
      }
      
      // 品质PPM计算
      if (this.formData.total_quantity > 0) {
        this.calculatedMetrics.quality_ppm = Math.round(
          (this.formData.defect_quantity / this.formData.total_quantity) * 1000000
        )
      } else {
        this.calculatedMetrics.quality_ppm = 0
      }
      
      // 交付精度计算
      if (this.formData.planned_quantity > 0) {
        const accuracy = Math.min(
          (this.formData.actual_delivery / this.formData.planned_quantity) * 100,
          100
        )
        this.calculatedMetrics.delivery_accuracy = Math.round(accuracy)
      } else {
        this.calculatedMetrics.delivery_accuracy = 0
      }
      
      // 成本差异计算
      if (this.formData.planned_cost > 0) {
        this.calculatedMetrics.cost_variance = Math.round(
          ((this.formData.actual_cost - this.formData.planned_cost) / this.formData.planned_cost) * 100
        )
      } else {
        this.calculatedMetrics.cost_variance = 0
      }
      
      // 自动计算总合评价（如果未手动设置）
      if (this.formData.overall_score === 0) {
        this.autoCalculateOverallScore()
      }
    },
    
    autoCalculateOverallScore() {
      const otdWeight = 0.3
      const qualityWeight = 0.3
      const deliveryWeight = 0.2
      const costWeight = 0.2
      
      // OTD评分
      let otdScore = 0
      if (this.calculatedMetrics.otd_rate >= 95) otdScore = 100
      else if (this.calculatedMetrics.otd_rate >= 90) otdScore = 80
      else if (this.calculatedMetrics.otd_rate >= 80) otdScore = 60
      else otdScore = 40
      
      // 质量评分
      let qualityScore = 0
      if (this.calculatedMetrics.quality_ppm <= 100) qualityScore = 100
      else if (this.calculatedMetrics.quality_ppm <= 500) qualityScore = 80
      else if (this.calculatedMetrics.quality_ppm <= 1000) qualityScore = 60
      else qualityScore = 40
      
      // 交付评分
      let deliveryScore = 0
      if (this.calculatedMetrics.delivery_accuracy >= 98) deliveryScore = 100
      else if (this.calculatedMetrics.delivery_accuracy >= 95) deliveryScore = 80
      else if (this.calculatedMetrics.delivery_accuracy >= 90) deliveryScore = 60
      else deliveryScore = 40
      
      // 成本评分
      let costScore = 0
      if (this.calculatedMetrics.cost_variance <= -5) costScore = 100
      else if (this.calculatedMetrics.cost_variance <= 0) costScore = 80
      else if (this.calculatedMetrics.cost_variance <= 5) costScore = 60
      else costScore = 40
      
      this.formData.overall_score = Math.round(
        otdScore * otdWeight +
        qualityScore * qualityWeight +
        deliveryScore * deliveryWeight +
        costScore * costWeight
      )
    },
    
    handleSave() {
      this.$refs.recordForm.validate((valid) => {
        if (valid) {
          this.saving = true
          
          // 添加计算结果到表单数据
          const saveData = {
            ...this.formData,
            otd_rate: this.calculatedMetrics.otd_rate,
            quality_ppm: this.calculatedMetrics.quality_ppm,
            delivery_accuracy: this.calculatedMetrics.delivery_accuracy,
            cost_variance: this.calculatedMetrics.cost_variance
          }
          
          this.$emit('save', saveData)
          this.saving = false
        } else {
          this.$message.error('入力内容を確認してください')
        }
      })
    },
    
    handleCancel() {
      this.$emit('cancel')
    },
    
    getPerformanceClass(type, value) {
      switch (type) {
        case 'otd':
          if (value >= 95) return 'performance-excellent'
          if (value >= 90) return 'performance-good'
          if (value >= 80) return 'performance-fair'
          return 'performance-poor'
        case 'quality':
          if (value <= 100) return 'performance-excellent'
          if (value <= 500) return 'performance-good'
          if (value <= 1000) return 'performance-fair'
          return 'performance-poor'
        case 'delivery':
          if (value >= 98) return 'performance-excellent'
          if (value >= 95) return 'performance-good'
          if (value >= 90) return 'performance-fair'
          return 'performance-poor'
        default:
          return ''
      }
    },
    
    getScoreGrade(score) {
      if (score >= 90) return 'S'
      if (score >= 80) return 'A'
      if (score >= 70) return 'B'
      if (score >= 60) return 'C'
      return 'D'
    }
  }
}
</script>

<style scoped>
.performance-record-form {
  padding: 0;
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

/* 性能指标颜色 */
.performance-excellent {
  background-color: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

.performance-good {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
}

.performance-fair {
  background-color: #fdf6ec;
  border-color: #e6a23c;
  color: #e6a23c;
}

.performance-poor {
  background-color: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}

.cost-over {
  background-color: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}

.cost-under {
  background-color: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

/* 评级颜色 */
.grade-s {
  background-color: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
  font-weight: bold;
}

.grade-a {
  background-color: #f0f9ff;
  border-color: #409eff;
  color: #409eff;
  font-weight: bold;
}

.grade-b {
  background-color: #fdf6ec;
  border-color: #e6a23c;
  color: #e6a23c;
  font-weight: bold;
}

.grade-c {
  background-color: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
  font-weight: bold;
}

.grade-d {
  background-color: #f5f5f5;
  border-color: #909399;
  color: #909399;
  font-weight: bold;
}

.el-divider {
  margin: 30px 0 20px 0;
}

.el-form-item {
  margin-bottom: 18px;
}

.el-input-number {
  width: 100%;
}

.el-textarea {
  width: 100%;
}
</style>