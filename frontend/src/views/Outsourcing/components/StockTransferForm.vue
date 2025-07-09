<template>
  <div class="stock-transfer-form">
    <el-form
      ref="transferForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
    >
      <!-- 转出信息 -->
      <div class="transfer-section">
        <h4>転出情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="転出仕入先" prop="from_supplier_id">
              <el-select
                v-model="formData.from_supplier_id"
                placeholder="転出仕入先を選択"
                filterable
                style="width: 100%"
                @change="onFromSupplierChange"
                :disabled="!!inventoryData"
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
                :disabled="!!inventoryData"
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
        
        <!-- 当前库存信息 -->
        <div class="current-stock-info" v-if="fromStockInfo">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>現在庫:</label>
                <span class="stock-value">{{ formatNumber(fromStockInfo.current_stock) }} {{ fromStockInfo.unit }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>単価:</label>
                <span>¥{{ formatNumber(fromStockInfo.unit_cost) }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>在庫価値:</label>
                <span>¥{{ formatNumber(fromStockInfo.total_value) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <!-- 转入信息 -->
      <div class="transfer-section">
        <h4>転入情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="転入仕入先" prop="to_supplier_id">
              <el-select
                v-model="formData.to_supplier_id"
                placeholder="転入仕入先を選択"
                filterable
                style="width: 100%"
                @change="onToSupplierChange"
              >
                <el-option
                  v-for="supplier in supplierList"
                  :key="supplier.id"
                  :label="supplier.supplier_name"
                  :value="supplier.id"
                  :disabled="supplier.id === formData.from_supplier_id"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="転入先在庫">
              <el-input
                :value="toStockInfo ? formatNumber(toStockInfo.current_stock) + ' ' + toStockInfo.unit : '新規作成'"
                readonly
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      
      <!-- 转移详情 -->
      <div class="transfer-section">
        <h4>転送詳細</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="転送数量" prop="transfer_quantity">
              <el-input-number
                v-model="formData.transfer_quantity"
                :min="0"
                :max="fromStockInfo?.current_stock || 0"
                :precision="2"
                style="width: 100%"
                @change="calculateTransfer"
              >
                <template slot="append">{{ fromStockInfo?.unit || '' }}</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="転送価値">
              <el-input
                :value="'¥' + formatNumber(calculatedTransfer.transfer_value)"
                readonly
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="転送タイプ" prop="transfer_type">
              <el-select
                v-model="formData.transfer_type"
                placeholder="転送タイプを選択"
                style="width: 100%"
              >
                <el-option label="通常転送" value="normal"></el-option>
                <el-option label="緊急転送" value="urgent"></el-option>
                <el-option label="品質問題転送" value="quality"></el-option>
                <el-option label="在庫調整転送" value="adjustment"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          
          <el-col :span="12">
            <el-form-item label="転送日時" prop="transfer_date">
              <el-date-picker
                v-model="formData.transfer_date"
                type="datetime"
                placeholder="転送日時を選択"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
      
      <!-- 价格调整 -->
      <div class="transfer-section">
        <h4>価格調整</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="価格調整">
              <el-checkbox v-model="formData.adjust_price" @change="onPriceAdjustChange">
                転入時に単価を調整する
              </el-checkbox>
            </el-form-item>
          </el-col>
          
          <el-col :span="12" v-if="formData.adjust_price">
            <el-form-item label="新単価" prop="new_unit_cost">
              <el-input-number
                v-model="formData.new_unit_cost"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateTransfer"
              >
                <template slot="append">円</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <div class="price-adjustment-info" v-if="formData.adjust_price">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>価格差異:</label>
                <span :class="getPriceDiffClass(calculatedTransfer.price_diff)">
                  {{ calculatedTransfer.price_diff > 0 ? '+' : '' }}¥{{ formatNumber(calculatedTransfer.price_diff) }}
                </span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>価値差異:</label>
                <span :class="getPriceDiffClass(calculatedTransfer.value_diff)">
                  {{ calculatedTransfer.value_diff > 0 ? '+' : '' }}¥{{ formatNumber(calculatedTransfer.value_diff) }}
                </span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>転入後価値:</label>
                <span class="transfer-value">¥{{ formatNumber(calculatedTransfer.new_transfer_value) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
      
      <!-- 转移预览 -->
      <div class="transfer-preview" v-if="calculatedTransfer.transfer_quantity > 0">
        <h4>転送後予想</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="preview-section">
              <h5>転出先 ({{ fromStockInfo?.supplier_name }})</h5>
              <div class="preview-item">
                <label>残り在庫:</label>
                <span class="preview-value">{{ formatNumber(calculatedTransfer.from_remaining) }} {{ fromStockInfo?.unit }}</span>
              </div>
              <div class="preview-item">
                <label>残り価値:</label>
                <span class="preview-value">¥{{ formatNumber(calculatedTransfer.from_remaining_value) }}</span>
              </div>
            </div>
          </el-col>
          
          <el-col :span="12">
            <div class="preview-section">
              <h5>転入先 ({{ getSupplierName(formData.to_supplier_id) }})</h5>
              <div class="preview-item">
                <label>転入後在庫:</label>
                <span class="preview-value">{{ formatNumber(calculatedTransfer.to_new_stock) }} {{ fromStockInfo?.unit }}</span>
              </div>
              <div class="preview-item">
                <label>転入後価値:</label>
                <span class="preview-value">¥{{ formatNumber(calculatedTransfer.to_new_value) }}</span>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 转移原因 -->
      <div class="transfer-section">
        <h4>転送理由</h4>
        <el-form-item label="転送理由" prop="transfer_reason">
          <el-select
            v-model="formData.transfer_reason"
            placeholder="転送理由を選択"
            style="width: 100%"
            allow-create
            filterable
          >
            <el-option label="生産計画変更" value="production_change"></el-option>
            <el-option label="在庫バランス調整" value="balance_adjustment"></el-option>
            <el-option label="品質問題" value="quality_issue"></el-option>
            <el-option label="緊急対応" value="emergency"></el-option>
            <el-option label="仕入先変更" value="supplier_change"></el-option>
            <el-option label="コスト最適化" value="cost_optimization"></el-option>
            <el-option label="その他" value="other"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="詳細説明" prop="transfer_notes">
          <el-input
            v-model="formData.transfer_notes"
            type="textarea"
            :rows="3"
            placeholder="転送の詳細な理由や背景を記入してください"
          ></el-input>
        </el-form-item>
      </div>
      
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
          <el-form-item label="参照番号">
            <el-input
              v-model="formData.reference_no"
              placeholder="参照番号（任意）"
            ></el-input>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    
    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        転送実行
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'StockTransferForm',
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
      fromStockInfo: null,
      toStockInfo: null,
      formData: {
        from_supplier_id: '',
        to_supplier_id: '',
        material_cd: '',
        transfer_quantity: 0,
        transfer_type: 'normal',
        transfer_date: new Date().toISOString().slice(0, 19),
        adjust_price: false,
        new_unit_cost: 0,
        transfer_reason: '',
        transfer_notes: '',
        approved_by: '',
        reference_no: ''
      },
      formRules: {
        from_supplier_id: [
          { required: true, message: '転出仕入先を選択してください', trigger: 'change' }
        ],
        to_supplier_id: [
          { required: true, message: '転入仕入先を選択してください', trigger: 'change' }
        ],
        material_cd: [
          { required: true, message: '材料を選択してください', trigger: 'change' }
        ],
        transfer_quantity: [
          { required: true, message: '転送数量を入力してください', trigger: 'blur' },
          { type: 'number', min: 0.01, message: '0より大きい数値を入力してください', trigger: 'blur' }
        ],
        transfer_type: [
          { required: true, message: '転送タイプを選択してください', trigger: 'change' }
        ],
        transfer_date: [
          { required: true, message: '転送日時を選択してください', trigger: 'change' }
        ],
        new_unit_cost: [
          { required: true, message: '新単価を入力してください', trigger: 'blur', validator: this.validateNewUnitCost }
        ],
        transfer_reason: [
          { required: true, message: '転送理由を選択してください', trigger: 'change' }
        ],
        approved_by: [
          { required: true, message: '承認者を入力してください', trigger: 'blur' }
        ]
      },
      calculatedTransfer: {
        transfer_quantity: 0,
        transfer_value: 0,
        price_diff: 0,
        value_diff: 0,
        new_transfer_value: 0,
        from_remaining: 0,
        from_remaining_value: 0,
        to_new_stock: 0,
        to_new_value: 0
      }
    }
  },
  watch: {
    inventoryData: {
      handler(newData) {
        if (newData) {
          this.fromStockInfo = { ...newData }
          this.formData.from_supplier_id = newData.supplier_id
          this.formData.material_cd = newData.material_cd
          this.formData.new_unit_cost = newData.unit_cost
          this.calculateTransfer()
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
    
    async onFromSupplierChange() {
      if (this.formData.from_supplier_id && this.formData.material_cd) {
        await this.loadFromStock()
      }
    },
    
    async onMaterialChange() {
      if (this.formData.from_supplier_id && this.formData.material_cd) {
        await this.loadFromStock()
      }
    },
    
    async onToSupplierChange() {
      if (this.formData.to_supplier_id && this.formData.material_cd) {
        await this.loadToStock()
      }
      this.calculateTransfer()
    },
    
    async loadFromStock() {
      try {
        const response = await outsourcingApi.getVirtualInventoryItem({
          supplier_id: this.formData.from_supplier_id,
          material_cd: this.formData.material_cd
        })
        if (response.success) {
          this.fromStockInfo = response.data
          this.formData.new_unit_cost = response.data.unit_cost
          this.calculateTransfer()
        }
      } catch (error) {
        console.error('転出先在庫情報取得エラー:', error)
        this.$message.error('転出先在庫情報の取得に失敗しました')
      }
    },
    
    async loadToStock() {
      try {
        const response = await outsourcingApi.getVirtualInventoryItem({
          supplier_id: this.formData.to_supplier_id,
          material_cd: this.formData.material_cd
        })
        if (response.success) {
          this.toStockInfo = response.data
        } else {
          this.toStockInfo = null // 新规创建
        }
      } catch (error) {
        this.toStockInfo = null // 新规创建
      }
    },
    
    onPriceAdjustChange() {
      if (!this.formData.adjust_price) {
        this.formData.new_unit_cost = this.fromStockInfo?.unit_cost || 0
      }
      this.calculateTransfer()
    },
    
    calculateTransfer() {
      if (!this.fromStockInfo || !this.formData.transfer_quantity) {
        this.calculatedTransfer = {
          transfer_quantity: 0,
          transfer_value: 0,
          price_diff: 0,
          value_diff: 0,
          new_transfer_value: 0,
          from_remaining: 0,
          from_remaining_value: 0,
          to_new_stock: 0,
          to_new_value: 0
        }
        return
      }
      
      const transferQuantity = this.formData.transfer_quantity
      const originalUnitCost = this.fromStockInfo.unit_cost
      const newUnitCost = this.formData.adjust_price ? this.formData.new_unit_cost : originalUnitCost
      
      const transferValue = transferQuantity * originalUnitCost
      const newTransferValue = transferQuantity * newUnitCost
      const priceDiff = newUnitCost - originalUnitCost
      const valueDiff = newTransferValue - transferValue
      
      const fromRemaining = this.fromStockInfo.current_stock - transferQuantity
      const fromRemainingValue = fromRemaining * originalUnitCost
      
      const toCurrentStock = this.toStockInfo?.current_stock || 0
      const toCurrentValue = this.toStockInfo?.total_value || 0
      const toNewStock = toCurrentStock + transferQuantity
      const toNewValue = toCurrentValue + newTransferValue
      
      this.calculatedTransfer = {
        transfer_quantity: transferQuantity,
        transfer_value: transferValue,
        price_diff: priceDiff,
        value_diff: valueDiff,
        new_transfer_value: newTransferValue,
        from_remaining: fromRemaining,
        from_remaining_value: fromRemainingValue,
        to_new_stock: toNewStock,
        to_new_value: toNewValue
      }
    },
    
    validateNewUnitCost(rule, value, callback) {
      if (this.formData.adjust_price && (!value || value <= 0)) {
        callback(new Error('新単価を入力してください'))
      } else {
        callback()
      }
    },
    
    handleSave() {
      this.$refs.transferForm.validate((valid) => {
        if (valid) {
          if (this.formData.transfer_quantity > this.fromStockInfo.current_stock) {
            this.$message.error('転送数量が現在庫を超えています')
            return
          }
          
          this.saving = true
          
          const saveData = {
            ...this.formData,
            from_current_stock: this.fromStockInfo.current_stock,
            from_unit_cost: this.fromStockInfo.unit_cost,
            to_current_stock: this.toStockInfo?.current_stock || 0,
            to_unit_cost: this.toStockInfo?.unit_cost || this.formData.new_unit_cost,
            ...this.calculatedTransfer
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
    
    getSupplierName(supplierId) {
      const supplier = this.supplierList.find(s => s.id === supplierId)
      return supplier ? supplier.supplier_name : ''
    },
    
    getPriceDiffClass(value) {
      if (value > 0) return 'price-increase'
      if (value < 0) return 'price-decrease'
      return 'price-neutral'
    },
    
    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    }
  }
}
</script>

<style scoped>
.stock-transfer-form {
  padding: 0;
}

.transfer-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.transfer-section h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.transfer-section h5 {
  margin: 0 0 10px 0;
  color: #5a6c7d;
  font-size: 14px;
}

.current-stock-info {
  background-color: #e8f4fd;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
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

.transfer-value {
  font-weight: 600;
  color: #67c23a;
}

.price-adjustment-info {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
}

.transfer-preview {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 6px;
  padding: 20px;
  margin: 20px 0;
}

.transfer-preview h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
}

.preview-section {
  background-color: white;
  border-radius: 4px;
  padding: 15px;
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

/* 价格差异颜色 */
.price-increase {
  color: #f56c6c;
  font-weight: 600;
}

.price-decrease {
  color: #67c23a;
  font-weight: 600;
}

.price-neutral {
  color: #909399;
  font-weight: 600;
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