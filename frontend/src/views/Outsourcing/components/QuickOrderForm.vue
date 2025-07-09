<template>
  <div class="quick-order-form">
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="120px"
      size="small">

      <!-- 基本信息 -->
      <div class="form-section">
        <h4 class="section-title">
          <i class="el-icon-document"></i>
          基本情報
        </h4>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仕入先" prop="supplier_id">
              <el-select
                v-model="form.supplier_id"
                placeholder="仕入先を選択"
                filterable
                @change="onSupplierChange">
                <el-option
                  v-for="supplier in supplierList"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id">
                  <span style="float: left">{{ supplier.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">
                    {{ supplier.code }}
                  </span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注文タイプ" prop="order_type">
              <el-select v-model="form.order_type" placeholder="タイプを選択">
                <el-option label="通常注文" value="normal"></el-option>
                <el-option label="緊急注文" value="urgent"></el-option>
                <el-option label="試作注文" value="prototype"></el-option>
                <el-option label="補充注文" value="replenishment"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="希望納期" prop="delivery_date">
              <el-date-picker
                v-model="form.delivery_date"
                type="date"
                placeholder="納期を選択"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                :picker-options="datePickerOptions">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="優先度" prop="priority">
              <el-select v-model="form.priority" placeholder="優先度を選択">
                <el-option label="低" value="low">
                  <span style="color: #909399">低</span>
                </el-option>
                <el-option label="中" value="medium">
                  <span style="color: #e6a23c">中</span>
                </el-option>
                <el-option label="高" value="high">
                  <span style="color: #f56c6c">高</span>
                </el-option>
                <el-option label="緊急" value="urgent">
                  <span style="color: #f56c6c; font-weight: bold">緊急</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 产品信息 -->
      <div class="form-section">
        <h4 class="section-title">
          <i class="el-icon-goods"></i>
          製品情報
          <el-button
            type="link"
            size="small"
            @click="addProduct"
            style="float: right">
            <i class="el-icon-plus"></i> 製品追加
          </el-button>
        </h4>

        <div
          v-for="(product, index) in form.products"
          :key="index"
          class="product-item">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item
                :prop="`products.${index}.product_code`"
                :rules="rules.product_code"
                label="製品コード">
                <el-input
                  v-model="product.product_code"
                  placeholder="製品コードを入力"
                  @blur="loadProductInfo(index)">
                  <el-button
                    slot="append"
                    icon="el-icon-search"
                    @click="showProductSelector(index)">
                  </el-button>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item
                :prop="`products.${index}.product_name`"
                label="製品名">
                <el-input
                  v-model="product.product_name"
                  placeholder="製品名"
                  readonly>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item
                :prop="`products.${index}.quantity`"
                :rules="rules.quantity"
                label="数量">
                <el-input-number
                  v-model="product.quantity"
                  :min="1"
                  :precision="0"
                  controls-position="right"
                  @change="calculateAmount(index)">
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item
                :prop="`products.${index}.unit_price`"
                label="単価">
                <el-input-number
                  v-model="product.unit_price"
                  :min="0"
                  :precision="2"
                  controls-position="right"
                  @change="calculateAmount(index)">
                </el-input-number>
              </el-form-item>
            </el-col>
            <el-col :span="2">
              <el-form-item label=" ">
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  size="small"
                  @click="removeProduct(index)"
                  :disabled="form.products.length <= 1">
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="単位">
                <el-input v-model="product.unit" placeholder="単位" readonly></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="小計">
                <el-input
                  :value="formatCurrency(product.amount)"
                  readonly>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="備考">
                <el-input
                  v-model="product.remarks"
                  placeholder="備考を入力">
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 金额汇总 -->
      <div class="form-section">
        <h4 class="section-title">
          <i class="el-icon-money"></i>
          金額情報
        </h4>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="小計">
              <el-input
                :value="formatCurrency(totalAmount.subtotal)"
                readonly>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税率">
              <el-input-number
                v-model="form.tax_rate"
                :min="0"
                :max="100"
                :precision="2"
                controls-position="right"
                @change="calculateTotal">
                <template slot="append">%</template>
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税額">
              <el-input
                :value="formatCurrency(totalAmount.tax)"
                readonly>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="調整額">
              <el-input-number
                v-model="form.adjustment"
                :precision="2"
                controls-position="right"
                @change="calculateTotal">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="合計金額">
              <el-input
                :value="formatCurrency(totalAmount.total)"
                readonly
                class="total-amount">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 其他信息 -->
      <div class="form-section">
        <h4 class="section-title">
          <i class="el-icon-edit-outline"></i>
          その他情報
        </h4>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="納入場所">
              <el-input v-model="form.delivery_location" placeholder="納入場所を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支払条件">
              <el-select v-model="form.payment_terms" placeholder="支払条件を選択">
                <el-option label="現金" value="cash"></el-option>
                <el-option label="月末締翌月末払い" value="monthly"></el-option>
                <el-option label="30日後" value="30days"></el-option>
                <el-option label="60日後" value="60days"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="特記事項">
          <el-input
            v-model="form.special_notes"
            type="textarea"
            :rows="3"
            placeholder="特記事項があれば入力してください">
          </el-input>
        </el-form-item>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="$emit('cancel')">キャンセル</el-button>
      <el-button @click="saveDraft">下書き保存</el-button>
      <el-button type="primary" @click="submitOrder" :loading="submitting">
        注文作成
      </el-button>
    </div>

    <!-- 产品选择对话框 -->
    <el-dialog
      title="製品選択"
      :visible.sync="showProductDialog"
      width="800px">
      <ProductSelector
        v-if="showProductDialog"
        :supplier-id="form.supplier_id"
        @select="onProductSelect"
        @cancel="showProductDialog = false" />
    </el-dialog>
  </div>
</template>

<script>
import ProductSelector from './ProductSelector.vue'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'QuickOrderForm',
  components: {
    ProductSelector
  },
  data() {
    return {
      submitting: false,
      showProductDialog: false,
      currentProductIndex: 0,
      form: {
        supplier_id: '',
        order_type: 'normal',
        delivery_date: '',
        priority: 'medium',
        tax_rate: 10,
        adjustment: 0,
        delivery_location: '',
        payment_terms: 'monthly',
        special_notes: '',
        products: [
          {
            product_code: '',
            product_name: '',
            quantity: 1,
            unit: '',
            unit_price: 0,
            amount: 0,
            remarks: ''
          }
        ]
      },
      supplierList: [],
      rules: {
        supplier_id: [
          { required: true, message: '仕入先を選択してください', trigger: 'change' }
        ],
        order_type: [
          { required: true, message: '注文タイプを選択してください', trigger: 'change' }
        ],
        delivery_date: [
          { required: true, message: '希望納期を選択してください', trigger: 'change' }
        ],
        priority: [
          { required: true, message: '優先度を選択してください', trigger: 'change' }
        ],
        product_code: [
          { required: true, message: '製品コードを入力してください', trigger: 'blur' }
        ],
        quantity: [
          { required: true, message: '数量を入力してください', trigger: 'blur' },
          { type: 'number', min: 1, message: '数量は1以上で入力してください', trigger: 'blur' }
        ]
      },
      datePickerOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now() - 8.64e7 // 昨天之前的日期不可选
        }
      }
    }
  },
  computed: {
    totalAmount() {
      const subtotal = this.form.products.reduce((sum, product) => {
        return sum + (product.amount || 0)
      }, 0)

      const tax = subtotal * (this.form.tax_rate / 100)
      const total = subtotal + tax + (this.form.adjustment || 0)

      return {
        subtotal,
        tax,
        total
      }
    }
  },
  mounted() {
    this.loadSupplierList()
    this.setDefaultDeliveryDate()
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

    setDefaultDeliveryDate() {
      // 默认设置为7天后
      const date = new Date()
      date.setDate(date.getDate() + 7)
      this.form.delivery_date = date.toISOString().split('T')[0]
    },

    onSupplierChange() {
      // 清空产品信息
      this.form.products.forEach(product => {
        product.product_code = ''
        product.product_name = ''
        product.unit = ''
        product.unit_price = 0
        product.amount = 0
      })
    },

    async loadProductInfo(index) {
      const product = this.form.products[index]
      if (!product.product_code || !this.form.supplier_id) return

      try {
        const response = await outsourcingApi.getProductInfo({
          supplier_id: this.form.supplier_id,
          product_code: product.product_code
        })

        if (response.success && response.data) {
          const productInfo = response.data
          product.product_name = productInfo.name
          product.unit = productInfo.unit
          product.unit_price = productInfo.unit_price
          this.calculateAmount(index)
        }
      } catch (error) {
        console.error('製品情報取得エラー:', error)
      }
    },

    showProductSelector(index) {
      if (!this.form.supplier_id) {
        this.$message.warning('先に仕入先を選択してください')
        return
      }
      this.currentProductIndex = index
      this.showProductDialog = true
    },

    onProductSelect(product) {
      const index = this.currentProductIndex
      this.form.products[index].product_code = product.code
      this.form.products[index].product_name = product.name
      this.form.products[index].unit = product.unit
      this.form.products[index].unit_price = product.unit_price
      this.calculateAmount(index)
      this.showProductDialog = false
    },

    addProduct() {
      this.form.products.push({
        product_code: '',
        product_name: '',
        quantity: 1,
        unit: '',
        unit_price: 0,
        amount: 0,
        remarks: ''
      })
    },

    removeProduct(index) {
      if (this.form.products.length > 1) {
        this.form.products.splice(index, 1)
        this.calculateTotal()
      }
    },

    calculateAmount(index) {
      const product = this.form.products[index]
      product.amount = (product.quantity || 0) * (product.unit_price || 0)
      this.calculateTotal()
    },

    calculateTotal() {
      // 触发计算属性更新
      this.$forceUpdate()
    },

    async saveDraft() {
      try {
        const orderData = {
          ...this.form,
          status: 'draft',
          total_amount: this.totalAmount.total
        }

        const response = await outsourcingApi.createOrder(orderData)
        if (response.success) {
          this.$message.success('下書きを保存しました')
          this.$emit('success')
        }
      } catch (error) {
        console.error('下書き保存エラー:', error)
        this.$message.error('下書きの保存に失敗しました')
      }
    },

    async submitOrder() {
      try {
        const valid = await this.$refs.form.validate()
        if (!valid) return

        this.submitting = true

        const orderData = {
          ...this.form,
          status: 'pending',
          total_amount: this.totalAmount.total
        }

        const response = await outsourcingApi.createOrder(orderData)
        if (response.success) {
          this.$message.success('注文を作成しました')
          this.$emit('success')
        }
      } catch (error) {
        console.error('注文作成エラー:', error)
        this.$message.error('注文の作成に失敗しました')
      } finally {
        this.submitting = false
      }
    },

    formatCurrency(value) {
      if (value == null) return '¥0'
      return `¥${Number(value).toLocaleString()}`
    }
  }
}
</script>

<style scoped>
.quick-order-form {
  max-height: 70vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #409eff;
}

.section-title {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.section-title i {
  margin-right: 8px;
  color: #409eff;
}

.product-item {
  background: white;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 15px;
  border: 1px solid #e4e7ed;
}

.product-item:last-child {
  margin-bottom: 0;
}

.form-actions {
  text-align: right;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.form-actions .el-button {
  margin-left: 10px;
}

.total-amount .el-input__inner {
  font-weight: bold;
  font-size: 16px;
  color: #f56c6c;
}

.el-select {
  width: 100%;
}

.el-date-picker {
  width: 100%;
}

.el-input-number {
  width: 100%;
}

.el-form-item {
  margin-bottom: 15px;
}

.el-form-item__label {
  font-weight: 600;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-section {
    padding: 15px;
  }

  .product-item {
    padding: 15px;
  }

  .el-col {
    margin-bottom: 10px;
  }
}
</style>
