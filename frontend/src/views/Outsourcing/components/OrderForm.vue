<template>
  <div class="order-form">
    <el-form
      ref="orderForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      :disabled="mode === 'view'"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h3>基本情報</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="注文番号" prop="order_no">
              <el-input
                v-model="formData.order_no"
                :disabled="mode !== 'create'"
                placeholder="自動生成"
              ></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注文日" prop="order_date">
              <el-date-picker
                v-model="formData.order_date"
                type="date"
                placeholder="注文日を選択"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仕入先" prop="supplier_cd">
              <el-select
                v-model="formData.supplier_cd"
                placeholder="仕入先を選択"
                style="width: 100%"
                filterable
                @change="handleSupplierChange"
              >
                <el-option
                  v-for="supplier in supplierList"
                  :key="supplier.supplier_cd"
                  :label="supplier.supplier_name"
                  :value="supplier.supplier_cd"
                >
                  <span style="float: left">{{ supplier.supplier_name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{
                    supplier.supplier_cd
                  }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="納期" prop="delivery_date">
              <el-date-picker
                v-model="formData.delivery_date"
                type="date"
                placeholder="納期を選択"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 製品情報 -->
      <div class="form-section">
        <h3>製品情報</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="製品CD" prop="product_cd">
              <el-select
                v-model="formData.product_cd"
                placeholder="製品を選択"
                style="width: 100%"
                filterable
                @change="handleProductChange"
              >
                <el-option
                  v-for="product in productList"
                  :key="product.product_cd"
                  :label="product.product_name"
                  :value="product.product_cd"
                >
                  <span style="float: left">{{ product.product_name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{
                    product.product_cd
                  }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工序" prop="process_cd">
              <el-select
                v-model="formData.process_cd"
                placeholder="工序を選択"
                style="width: 100%"
                @change="handleProcessChange"
              >
                <el-option
                  v-for="process in processList"
                  :key="process.process_cd"
                  :label="process.process_name"
                  :value="process.process_cd"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="製品名">
              <el-input v-model="formData.product_name" disabled></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 数量と価格 -->
      <div class="form-section">
        <h3>数量・価格</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="数量" prop="quantity">
              <el-input-number
                v-model="formData.quantity"
                :min="1"
                :precision="0"
                style="width: 100%"
                @change="calculateTotal"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="単価" prop="unit_price">
              <el-input-number
                v-model="formData.unit_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                @change="calculateTotal"
              ></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="総額">
              <el-input
                :value="formatCurrency(formData.total_amount)"
                disabled
                style="width: 100%"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 供料情報 -->
      <div class="form-section">
        <h3>供料情報</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供料タイプ" prop="material_supply_type">
              <el-radio-group v-model="formData.material_supply_type">
                <el-radio label="paid">有償</el-radio>
                <el-radio label="free">無償</el-radio>
                <el-radio label="none">なし</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材料費" v-if="formData.material_supply_type === 'paid'">
              <el-input-number
                v-model="formData.material_cost"
                :min="0"
                :precision="2"
                style="width: 100%"
              ></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 供料明細 -->
        <div v-if="formData.material_supply_type !== 'none'">
          <el-divider content-position="left">供料明細</el-divider>
          <el-table :data="formData.materials" border size="small">
            <el-table-column prop="material_cd" label="材料CD" width="120"></el-table-column>
            <el-table-column prop="material_name" label="材料名" width="200"></el-table-column>
            <el-table-column
              prop="required_qty"
              label="必要数量"
              width="100"
              align="right"
            ></el-table-column>
            <el-table-column prop="unit" label="単位" width="80"></el-table-column>
            <el-table-column
              prop="unit_cost"
              label="単価"
              width="100"
              align="right"
              v-if="formData.material_supply_type === 'paid'"
            ></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button size="small" type="danger" @click="removeMaterial(scope.$index)"
                  >削除</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 10px">
            <el-button size="small" type="primary" @click="addMaterial">材料追加</el-button>
          </div>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-section">
        <h3>備考</h3>
        <el-form-item label="備考" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="3"
            placeholder="備考を入力してください"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 状态信息（仅查看模式） -->
      <div class="form-section" v-if="mode === 'view'">
        <h3>状態情報</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="状態">
              <el-tag :type="getStatusType(formData.order_status)">
                {{ getStatusText(formData.order_status) }}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="作成日">
              <span>{{ formatDateTime(formData.created_at) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="更新日">
              <span>{{ formatDateTime(formData.updated_at) }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">{{ mode === 'view' ? '閉じる' : 'キャンセル' }}</el-button>
      <el-button v-if="mode !== 'view'" type="primary" @click="handleSave" :loading="saving"
        >保存</el-button
      >
      <el-button v-if="mode === 'view' && canEdit" type="primary" @click="handleEdit"
        >編集</el-button
      >
    </div>

    <!-- 材料选择对话框 -->
    <el-dialog title="材料選択" :visible.sync="materialDialogVisible" width="60%">
      <el-table :data="availableMaterials" @selection-change="handleMaterialSelection">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column prop="material_cd" label="材料CD" width="120"></el-table-column>
        <el-table-column prop="material_name" label="材料名"></el-table-column>
        <el-table-column prop="unit" label="単位" width="80"></el-table-column>
        <el-table-column
          prop="standard_cost"
          label="標準単価"
          width="100"
          align="right"
        ></el-table-column>
      </el-table>

      <div slot="footer" class="dialog-footer">
        <el-button @click="materialDialogVisible = false">キャンセル</el-button>
        <el-button type="primary" @click="confirmMaterialSelection">確定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'OrderForm',
  props: {
    orderData: {
      type: Object,
      default: null,
    },
    mode: {
      type: String,
      default: 'create', // create, edit, view
      validator: (value) => ['create', 'edit', 'view'].includes(value),
    },
  },
  data() {
    return {
      saving: false,
      formData: {
        order_no: '',
        supplier_cd: '',
        product_cd: '',
        product_name: '',
        process_cd: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        order_date: new Date(),
        delivery_date: null,
        material_supply_type: 'none',
        material_cost: 0,
        materials: [],
        remarks: '',
        order_status: 'created',
      },
      formRules: {
        supplier_cd: [{ required: true, message: '仕入先を選択してください', trigger: 'change' }],
        product_cd: [{ required: true, message: '製品を選択してください', trigger: 'change' }],
        process_cd: [{ required: true, message: '工序を選択してください', trigger: 'change' }],
        quantity: [{ required: true, message: '数量を入力してください', trigger: 'blur' }],
        unit_price: [{ required: true, message: '単価を入力してください', trigger: 'blur' }],
        order_date: [{ required: true, message: '注文日を選択してください', trigger: 'change' }],
        delivery_date: [{ required: true, message: '納期を選択してください', trigger: 'change' }],
      },
      supplierList: [],
      productList: [],
      processList: [],
      availableMaterials: [],
      selectedMaterials: [],
      materialDialogVisible: false,
    }
  },
  computed: {
    canEdit() {
      return this.formData.order_status && ['created', 'sent'].includes(this.formData.order_status)
    },
  },
  watch: {
    orderData: {
      handler(newVal) {
        if (newVal) {
          this.formData = { ...newVal }
          if (this.formData.order_date) {
            this.formData.order_date = new Date(this.formData.order_date)
          }
          if (this.formData.delivery_date) {
            this.formData.delivery_date = new Date(this.formData.delivery_date)
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true,
    },
  },
  mounted() {
    this.loadSuppliers()
    this.loadProducts()
    this.loadProcesses()
  },
  methods: {
    async loadSuppliers() {
      try {
        const response = await outsourcingApi.getSuppliers()
        if (response.success) {
          this.supplierList = response.data
        }
      } catch (error) {
        console.error('仕入先リスト取得エラー:', error)
      }
    },

    async loadProducts() {
      try {
        const response = await outsourcingApi.getProducts()
        if (response.success) {
          this.productList = response.data
        }
      } catch (error) {
        console.error('製品リスト取得エラー:', error)
      }
    },

    async loadProcesses() {
      try {
        const response = await outsourcingApi.getOutsourceProcesses()
        if (response.success) {
          this.processList = response.data
        }
      } catch (error) {
        console.error('工序リスト取得エラー:', error)
      }
    },

    handleSupplierChange(supplierCd) {
      const supplier = this.supplierList.find((s) => s.supplier_cd === supplierCd)
      if (supplier) {
        // 可以根据供应商加载对应的价格合同等信息
        this.loadSupplierPrices(supplierCd)
      }
    },

    handleProductChange(productCd) {
      const product = this.productList.find((p) => p.product_cd === productCd)
      if (product) {
        this.formData.product_name = product.product_name
        // 加载产品相关的工序和材料信息
        this.loadProductProcesses(productCd)
        this.loadProductMaterials(productCd)
      }
    },

    handleProcessChange(processCd) {
      // 根据工序获取价格信息
      this.loadProcessPrice()
    },

    async loadSupplierPrices(supplierCd) {
      try {
        const response = await outsourcingApi.getSupplierPrices(supplierCd)
        if (response.success) {
          // 处理价格信息
        }
      } catch (error) {
        console.error('価格情報取得エラー:', error)
      }
    },

    async loadProductProcesses(productCd) {
      try {
        const response = await outsourcingApi.getProductProcesses(productCd)
        if (response.success) {
          this.processList = response.data.filter((p) => p.is_outsource)
        }
      } catch (error) {
        console.error('製品工序取得エラー:', error)
      }
    },

    async loadProductMaterials(productCd) {
      try {
        const response = await outsourcingApi.getProductMaterials(productCd)
        if (response.success) {
          this.availableMaterials = response.data
        }
      } catch (error) {
        console.error('製品材料取得エラー:', error)
      }
    },

    async loadProcessPrice() {
      if (!this.formData.supplier_cd || !this.formData.product_cd || !this.formData.process_cd) {
        return
      }

      try {
        const response = await outsourcingApi.getProcessPrice({
          supplier_cd: this.formData.supplier_cd,
          product_cd: this.formData.product_cd,
          process_cd: this.formData.process_cd,
        })

        if (response.success && response.data) {
          this.formData.unit_price = response.data.unit_price
          this.calculateTotal()
        }
      } catch (error) {
        console.error('工序価格取得エラー:', error)
      }
    },

    calculateTotal() {
      this.formData.total_amount = (this.formData.quantity || 0) * (this.formData.unit_price || 0)
    },

    addMaterial() {
      this.materialDialogVisible = true
    },

    removeMaterial(index) {
      this.formData.materials.splice(index, 1)
    },

    handleMaterialSelection(selection) {
      this.selectedMaterials = selection
    },

    confirmMaterialSelection() {
      this.selectedMaterials.forEach((material) => {
        const exists = this.formData.materials.find((m) => m.material_cd === material.material_cd)
        if (!exists) {
          this.formData.materials.push({
            material_cd: material.material_cd,
            material_name: material.material_name,
            required_qty: 1,
            unit: material.unit,
            unit_cost: this.formData.material_supply_type === 'paid' ? material.standard_cost : 0,
          })
        }
      })
      this.materialDialogVisible = false
    },

    handleSave() {
      this.$refs.orderForm.validate((valid) => {
        if (valid) {
          this.saving = true
          const formData = { ...this.formData }

          // 格式化日期
          if (formData.order_date) {
            formData.order_date = this.formatDate(formData.order_date)
          }
          if (formData.delivery_date) {
            formData.delivery_date = this.formatDate(formData.delivery_date)
          }

          this.$emit('save', formData)
          this.saving = false
        }
      })
    },

    handleCancel() {
      this.$emit('cancel')
    },

    handleEdit() {
      this.$emit('edit')
    },

    resetForm() {
      this.formData = {
        order_no: '',
        supplier_cd: '',
        product_cd: '',
        product_name: '',
        process_cd: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        order_date: new Date(),
        delivery_date: null,
        material_supply_type: 'none',
        material_cost: 0,
        materials: [],
        remarks: '',
        order_status: 'created',
      }
    },

    getStatusType(status) {
      const statusMap = {
        created: '',
        sent: 'info',
        confirmed: 'warning',
        in_production: 'primary',
        completed: 'success',
        cancelled: 'danger',
      }
      return statusMap[status] || ''
    },

    getStatusText(status) {
      const statusMap = {
        created: '作成済',
        sent: '送信済',
        confirmed: '確認済',
        in_production: '生産中',
        completed: '完了',
        cancelled: 'キャンセル',
      }
      return statusMap[status] || status
    },

    formatCurrency(amount) {
      return amount ? `¥${amount.toLocaleString()}` : '¥0'
    },

    formatDate(date) {
      if (!date) return ''
      if (typeof date === 'string') return date.split('T')[0]
      return date.toISOString().split('T')[0]
    },

    formatDateTime(datetime) {
      if (!datetime) return ''
      return new Date(datetime).toLocaleString('ja-JP')
    },
  },
}
</script>

<style scoped>
.order-form {
  padding: 0;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}

.form-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.form-actions {
  text-align: right;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
  margin-top: 20px;
}

.form-actions .el-button {
  margin-left: 12px;
}

.dialog-footer {
  text-align: right;
}

.dialog-footer .el-button {
  margin-left: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}
</style>
