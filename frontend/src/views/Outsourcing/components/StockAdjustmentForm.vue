<template>
  <div class="stock-adjustment-form">
    <el-form
      ref="adjustmentForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
    >
      <!-- 基本信息 -->
      <el-row :gutter="20" v-if="!inventoryData">
        <el-col :span="12">
          <el-form-item label="仕入先" prop="supplier_id">
            <el-select
              v-model="formData.supplier_id"
              placeholder="仕入先を選択"
              filterable
              style="width: 100%"
              @change="onSupplierChange"
            >
              <el-option
                v-for="supplier in supplierList"
                :key="supplier.id"
                :label="supplier.supplier_name"
                :value="supplier.id"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="材料" prop="material_cd">
            <el-select
              v-model="formData.material_cd"
              placeholder="材料を選択"
              filterable
              style="width: 100%"
              @change="onMaterialChange"
            >
              <el-option
                v-for="material in materialList"
                :key="material.material_cd"
                :label="material.material_name"
                :value="material.material_cd"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 现有库存信息 -->
      <div class="current-stock-info" v-if="currentStockInfo">
        <h4>現在の在庫情報</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>仕入先:</label>
              <span>{{ currentStockInfo.supplier_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>材料:</label>
              <span>{{ currentStockInfo.material_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>現在庫:</label>
              <span class="stock-value">{{ formatNumber(currentStockInfo.current_stock) }} {{ currentStockInfo.unit }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>単価:</label>
              <span>¥{{ formatNumber(currentStockInfo.unit_cost) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>在庫価値:</label>
              <span>¥{{ formatNumber(currentStockInfo.total_value) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>最終更新:</label>
              <span>{{ formatDateTime(currentStockInfo.last_updated) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 调整信息 -->
      <el-divider content-position="left">調整情報</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="調整タイプ" prop="adjustment_type">
            <el-select
              v-model="formData.adjustment_type"
              placeholder="調整タイプを選択"
              style="width: 100%"
              @change="onAdjustmentTypeChange"
            >
              <el-option label="数量調整" value="quantity"></el-option>
              <el-option label="価格調整" value="price"></el-option>
              <el-option label="棚卸調整" value="inventory"></el-option>
              <el-option label="損失調整" value="loss"></el-option>
              <el-option label="その他" value="other"></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="調整方法" prop="adjustment_method">
            <el-radio-group v-model="formData.adjustment_method">
              <el-radio label="absolute">絶対値設定</el-radio>
              <el-radio label="relative">相対値調整</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" v-if="formData.adjustment_type === 'quantity' || formData.adjustment_type === 'inventory'">
        <el-col :span="12">
          <el-form-item 
            :label="formData.adjustment_method === 'absolute' ? '調整後数量' : '調整数量'"
            prop="adjustment_quantity"
          >
            <el-input-number
              v-model="formData.adjustment_quantity"
              style="width: 100%"
              :precision="2"
              @change="calculateAdjustment"
            >
              <template slot="append">{{ currentStockInfo?.unit || '' }}</template>
            </el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="実際調整量">
            <el-input
              :value="calculatedAdjustment.quantity_diff + ' ' + (currentStockInfo?.unit || '')"
              readonly
              :class="getAdjustmentClass(calculatedAdjustment.quantity_diff)"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-row :gutter="20" v-if="formData.adjustment_type === 'price'">
        <el-col :span="12">
          <el-form-item 
            :label="formData.adjustment_method === 'absolute' ? '調整後単価' : '調整単価'"
            prop="adjustment_price"
          >
            <el-input-number
              v-model="formData.adjustment_price"
              style="width: 100%"
              :precision="2"
              @change="calculateAdjustment"
            >
              <template slot="append">円</template>
            </el-input-number>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="実際調整額">
            <el-input
              :value="'¥' + formatNumber(calculatedAdjustment.price_diff)"
              readonly
              :class="getAdjustmentClass(calculatedAdjustment.price_diff)"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
      
      <!-- 调整后预览 -->
      <div class="adjustment-preview" v-if="calculatedAdjustment.new_total_value !== null">
        <h4>調整後予想</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="preview-item">
              <label>調整後数量:</label>
              <span class="preview-value">{{ formatNumber(calculatedAdjustment.new_quantity) }} {{ currentStockInfo?.unit || '' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="preview-item">
              <label>調整後単価:</label>
              <span class="preview-value">¥{{ formatNumber(calculatedAdjustment.new_price) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="preview-item">
              <label>調整後価値:</label>
              <span class="preview-value">¥{{ formatNumber(calculatedAdjustment.new_total_value) }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="preview-item">
              <label>価値変動:</label>
              <span :class="getAdjustmentClass(calculatedAdjustment.value_diff)">
                {{ calculatedAdjustment.value_diff > 0 ? '+' : '' }}¥{{ formatNumber(calculatedAdjustment.value_diff) }}
              </span>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 调整原因 -->
      <el-divider content-position="left">調整理由</el-divider>
      
      <el-form-item label="調整理由" prop="adjustment_reason">
        <el-select
          v-model="formData.adjustment_reason"
          placeholder="調整理由を選択"
          style="width: 100%"
          allow-create
          filterable
        >
          <el-option label="棚卸差異" value="inventory_difference"></el-option>
          <el-option label="品質不良" value="quality_issue"></el-option>
          <el-option label="紛失・盗難" value="loss_theft"></el-option>
          <el-option label="システムエラー" value="system_error"></el-option>
          <el-option label="価格変更" value="price_change"></el-option>
          <el-option label="仕入先変更" value="supplier_change"></el-option>
          <el-option label="その他" value="other"></el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="詳細説明" prop="adjustment_notes">
        <el-input
          v-model="formData.adjustment_notes"
          type="textarea"
          :rows="3"
          placeholder="調整の詳細な理由や背景を記入してください"
        ></el-input>
      </el-form-item>
      
      <!-- 承认信息 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="承認者" prop="approved_by">
            <el-input
              v-model="formData.approved_by"
              placeholder="承認者名を入力"
            ></el-input>
          </el-form-item>
        </el-col>
        
        <el-col :span="12">
          <el-form-item label="調整日時" prop="adjustment_date">
            <el-date-picker
              v-model="formData.adjustment_date"
              type="datetime"
              placeholder="調整日時を選択"
              format="yyyy-MM-dd HH:mm"
              value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%"
            ></el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        調整実行
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'StockAdjustmentForm',
  props: {
    inventoryData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      saving: false,
      supplierList: [],
      materialList: [],
      currentStockInfo: null,
      formData: {
        supplier_id: '',
        material_cd: '',
        adjustment_type: 'quantity',
        adjustment_method: 'absolute',
        adjustment_quantity: 0,
        adjustment_price: 0,
        adjustment_reason: '',
        adjustment_notes: '',
        approved_by: '',
        adjustment_date: new Date().toISOString().slice(0, 19)
      },
      formRules: {
        supplier_id: [
          { required: true, message: '仕入先を選択してください', trigger: 'change' }
        ],
        material_cd: [
          { required: true, message: '材料を選択してください', trigger: 'change' }
        ],
        adjustment_type: [
          { required: true, message: '調整タイプを選択してください', trigger: 'change' }
        ],
        adjustment_quantity: [
          { required: true, message: '調整数量を入力してください', trigger: 'blur' }
        ],
        adjustment_price: [
          { required: true, message: '調整単価を入力してください', trigger: 'blur' }
        ],
        adjustment_reason: [
          { required: true, message: '調整理由を選択してください', trigger: 'change' }
        ],
        approved_by: [
          { required: true, message: '承認者を入力してください', trigger: 'blur' }
        ],
        adjustment_date: [
          { required: true, message: '調整日時を選択してください', trigger: 'change' }
        ]
      },
      calculatedAdjustment: {
        quantity_diff: 0,
        price_diff: 0,
        new_quantity: 0,
        new_price: 0,
        new_total_value: null,
        value_diff: 0
      }
    }
  },
  watch: {
    inventoryData: {
      handler(newData) {
        if (newData) {
          this.currentStockInfo = { ...newData }
          this.formData.supplier_id = newData.supplier_id
          this.formData.material_cd = newData.material_cd
          this.calculateAdjustment()
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadSupplierList()
    this.loadMaterialList()
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
    
    async loadMaterialList() {
      try {
        const response = await outsourcingApi.getMaterialList()
        if (response.success) {
          this.materialList = response.data
        }
      } catch (error) {
        console.error('材料リスト取得エラー:', error)
      }
    },
    
    async onSupplierChange() {
      if (this.formData.supplier_id && this.formData.material_cd) {
        await this.loadCurrentStock()
      }
    },
    
    async onMaterialChange() {
      if (this.formData.supplier_id && this.formData.material_cd) {
        await this.loadCurrentStock()
      }
    },
    
    async loadCurrentStock() {
      try {
        const response = await outsourcingApi.getVirtualInventoryItem({
          supplier_id: this.formData.supplier_id,
          material_cd: this.formData.material_cd
        })
        if (response.success) {
          this.currentStockInfo = response.data
          this.calculateAdjustment()
        }
      } catch (error) {
        console.error('現在庫情報取得エラー:', error)
        this.$message.error('現在庫情報の取得に失敗しました')
      }
    },
    
    onAdjustmentTypeChange() {
      this.formData.adjustment_quantity = 0
      this.formData.adjustment_price = 0
      this.calculateAdjustment()
    },
    
    calculateAdjustment() {
      if (!this.currentStockInfo) {
        this.calculatedAdjustment = {
          quantity_diff: 0,
          price_diff: 0,
          new_quantity: 0,
          new_price: 0,
          new_total_value: null,
          value_diff: 0
        }
        return
      }
      
      const currentQuantity = this.currentStockInfo.current_stock || 0
      const currentPrice = this.currentStockInfo.unit_cost || 0
      
      let newQuantity = currentQuantity
      let newPrice = currentPrice
      
      // 数量调整计算
      if (this.formData.adjustment_type === 'quantity' || this.formData.adjustment_type === 'inventory') {
        if (this.formData.adjustment_method === 'absolute') {
          newQuantity = this.formData.adjustment_quantity || 0
        } else {
          newQuantity = currentQuantity + (this.formData.adjustment_quantity || 0)
        }
      }
      
      // 价格调整计算
      if (this.formData.adjustment_type === 'price') {
        if (this.formData.adjustment_method === 'absolute') {
          newPrice = this.formData.adjustment_price || 0
        } else {
          newPrice = currentPrice + (this.formData.adjustment_price || 0)
        }
      }
      
      const quantityDiff = newQuantity - currentQuantity
      const priceDiff = newPrice - currentPrice
      const newTotalValue = newQuantity * newPrice
      const currentTotalValue = currentQuantity * currentPrice
      const valueDiff = newTotalValue - currentTotalValue
      
      this.calculatedAdjustment = {
        quantity_diff: quantityDiff,
        price_diff: priceDiff,
        new_quantity: newQuantity,
        new_price: newPrice,
        new_total_value: newTotalValue,
        value_diff: valueDiff
      }
    },
    
    handleSave() {
      this.$refs.adjustmentForm.validate((valid) => {
        if (valid) {
          this.saving = true
          
          const saveData = {
            ...this.formData,
            current_stock: this.currentStockInfo?.current_stock || 0,
            current_price: this.currentStockInfo?.unit_cost || 0,
            ...this.calculatedAdjustment
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
    
    getAdjustmentClass(value) {
      if (value > 0) return 'adjustment-increase'
      if (value < 0) return 'adjustment-decrease'
      return 'adjustment-neutral'
    },
    
    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },
    
    formatDateTime(date) {
      if (!date) return ''
      return new Date(date).toLocaleString('ja-JP')
    }
  }
}
</script>

<style scoped>
.stock-adjustment-form {
  padding: 0;
}

.current-stock-info {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

.current-stock-info h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-item label {
  font-weight: 600;
  color: #5a6c7d;
  margin-right: 8px;
  min-width: 80px;
}

.info-item span {
  color: #2c3e50;
}

.stock-value {
  font-weight: 600;
  color: #409eff;
}

.adjustment-preview {
  background-color: #e8f4fd;
  border: 1px solid #b3d8ff;
  border-radius: 6px;
  padding: 20px;
  margin: 20px 0;
}

.adjustment-preview h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
}

.preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.preview-item label {
  font-weight: 600;
  color: #5a6c7d;
  margin-right: 8px;
  min-width: 100px;
}

.preview-value {
  font-weight: 600;
  color: #409eff;
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

/* 调整值颜色 */
.adjustment-increase {
  background-color: #f0f9ff;
  border-color: #67c23a;
  color: #67c23a;
}

.adjustment-decrease {
  background-color: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}

.adjustment-neutral {
  background-color: #f5f5f5;
  border-color: #909399;
  color: #909399;
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