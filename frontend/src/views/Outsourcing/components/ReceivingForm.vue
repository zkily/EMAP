<template>
  <div class="receiving-form">
    <el-form
      ref="receivingForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <h4>基本情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="受入番号" prop="receiving_no">
              <el-input
                v-model="formData.receiving_no"
                placeholder="自動生成"
                :disabled="mode !== 'create'"
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="外注注文" prop="order_id">
              <el-select
                v-model="formData.order_id"
                placeholder="外注注文を選択"
                filterable
                style="width: 100%"
                @change="onOrderChange"
                :disabled="mode === 'view'"
              >
                <el-option
                  v-for="order in orderList"
                  :key="order.id"
                  :label="order.order_no + ' - ' + order.product_name"
                  :value="order.id"
                >
                  <div class="order-option">
                    <div class="order-no">{{ order.order_no }}</div>
                    <div class="order-info">{{ order.supplier_name }} - {{ order.product_name }}</div>
                    <div class="order-quantity">数量: {{ formatNumber(order.order_quantity) }} {{ order.unit }}</div>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 订单信息显示 -->
        <div class="order-info-display" v-if="selectedOrder">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>仕入先:</label>
                <span>{{ selectedOrder.supplier_name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>製品名:</label>
                <span>{{ selectedOrder.product_name }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>注文数量:</label>
                <span>{{ formatNumber(selectedOrder.order_quantity) }} {{ selectedOrder.unit }}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <div class="info-item">
                <label>既受入数量:</label>
                <span>{{ formatNumber(selectedOrder.received_quantity || 0) }} {{ selectedOrder.unit }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>残り数量:</label>
                <span class="remaining-quantity">
                  {{ formatNumber((selectedOrder.order_quantity || 0) - (selectedOrder.received_quantity || 0)) }} {{ selectedOrder.unit }}
                </span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="info-item">
                <label>納期:</label>
                <span>{{ formatDate(selectedOrder.delivery_date) }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 受入详情 -->
      <div class="form-section">
        <h4>受入詳細</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="受入日" prop="receiving_date">
              <el-date-picker
                v-model="formData.receiving_date"
                type="datetime"
                placeholder="受入日時を選択"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
                :disabled="mode === 'view'"
              ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="受入数量" prop="received_quantity">
              <el-input-number
                v-model="formData.received_quantity"
                :min="0"
                :max="maxReceivableQuantity"
                :precision="2"
                style="width: 100%"
                :disabled="mode === 'view'"
                @change="calculateReceiving"
              >
                <template slot="append">{{ selectedOrder?.unit || '' }}</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="受入担当者" prop="received_by">
              <el-input
                v-model="formData.received_by"
                placeholder="受入担当者名を入力"
                :disabled="mode === 'view'"
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="受入場所" prop="receiving_location">
              <el-select
                v-model="formData.receiving_location"
                placeholder="受入場所を選択"
                style="width: 100%"
                :disabled="mode === 'view'"
              >
                <el-option label="第1倉庫" value="warehouse_1"></el-option>
                <el-option label="第2倉庫" value="warehouse_2"></el-option>
                <el-option label="検査エリア" value="inspection_area"></el-option>
                <el-option label="一時保管エリア" value="temp_storage"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 包装信息 -->
      <div class="form-section">
        <h4>梱包情報</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="梱包数" prop="package_count">
              <el-input-number
                v-model="formData.package_count"
                :min="1"
                style="width: 100%"
                :disabled="mode === 'view'"
              >
                <template slot="append">箱</template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="梱包タイプ" prop="package_type">
              <el-select
                v-model="formData.package_type"
                placeholder="梱包タイプを選択"
                style="width: 100%"
                :disabled="mode === 'view'"
              >
                <el-option label="段ボール箱" value="cardboard"></el-option>
                <el-option label="木箱" value="wooden"></el-option>
                <el-option label="プラスチック箱" value="plastic"></el-option>
                <el-option label="パレット" value="pallet"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="総重量" prop="total_weight">
              <el-input-number
                v-model="formData.total_weight"
                :min="0"
                :precision="2"
                style="width: 100%"
                :disabled="mode === 'view'"
              >
                <template slot="append">kg</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 运输信息 -->
      <div class="form-section">
        <h4>輸送情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="運送会社" prop="shipping_company">
              <el-input
                v-model="formData.shipping_company"
                placeholder="運送会社名を入力"
                :disabled="mode === 'view'"
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="追跡番号" prop="tracking_number">
              <el-input
                v-model="formData.tracking_number"
                placeholder="追跡番号を入力"
                :disabled="mode === 'view'"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出荷日" prop="shipped_date">
              <el-date-picker
                v-model="formData.shipped_date"
                type="date"
                placeholder="出荷日を選択"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                style="width: 100%"
                :disabled="mode === 'view'"
              ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="運送費" prop="shipping_cost">
              <el-input-number
                v-model="formData.shipping_cost"
                :min="0"
                :precision="0"
                style="width: 100%"
                :disabled="mode === 'view'"
              >
                <template slot="append">円</template>
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 品质检查 -->
      <div class="form-section">
        <h4>品質チェック</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="外観チェック" prop="appearance_check">
              <el-radio-group v-model="formData.appearance_check" :disabled="mode === 'view'">
                <el-radio label="good">良好</el-radio>
                <el-radio label="acceptable">許容</el-radio>
                <el-radio label="poor">不良</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="梱包状態" prop="package_condition">
              <el-radio-group v-model="formData.package_condition" :disabled="mode === 'view'">
                <el-radio label="good">良好</el-radio>
                <el-radio label="damaged">破損</el-radio>
                <el-radio label="wet">濡れ</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="受入時備考" prop="receiving_notes">
          <el-input
            v-model="formData.receiving_notes"
            type="textarea"
            :rows="3"
            placeholder="受入時の特記事項があれば記入してください"
            :disabled="mode === 'view'"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 文档附件 -->
      <div class="form-section">
        <h4>関連書類</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="納品書番号" prop="delivery_note_no">
              <el-input
                v-model="formData.delivery_note_no"
                placeholder="納品書番号を入力"
                :disabled="mode === 'view'"
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="検査証明書" prop="inspection_certificate">
              <el-input
                v-model="formData.inspection_certificate"
                placeholder="検査証明書番号を入力"
                :disabled="mode === 'view'"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="添付ファイル" v-if="mode !== 'view'">
          <el-upload
            class="upload-demo"
            drag
            action="/api/upload"
            multiple
            :file-list="fileList"
            :on-success="handleFileSuccess"
            :on-remove="handleFileRemove"
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">ファイルをドラッグするか、<em>クリックしてアップロード</em></div>
            <div class="el-upload__tip" slot="tip">jpg/png/pdf ファイル、サイズは 10MB 以下</div>
          </el-upload>
        </el-form-item>

        <el-form-item label="添付ファイル" v-else>
          <div class="file-list">
            <div v-for="file in fileList" :key="file.uid" class="file-item">
              <i class="el-icon-document"></i>
              <span>{{ file.name }}</span>
              <el-button type="link" @click="downloadFile(file)">ダウンロード</el-button>
            </div>
          </div>
        </el-form-item>
      </div>

      <!-- 状态信息 -->
      <div class="form-section" v-if="mode !== 'create'">
        <h4>状態情報</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="受入状態">
              <el-tag :type="getReceivingStatusType(formData.receiving_status)">
                {{ getReceivingStatusText(formData.receiving_status) }}
              </el-tag>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="作成日時">
              <span>{{ formatDateTime(formData.created_at) }}</span>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="更新日時">
              <span>{{ formatDateTime(formData.updated_at) }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions" v-if="mode !== 'view'">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">
        {{ mode === 'create' ? '登録' : '更新' }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'ReceivingForm',
  props: {
    receivingData: {
      type: Object,
      default: null
    },
    mode: {
      type: String,
      default: 'create' // create, edit, view
    }
  },
  data() {
    return {
      saving: false,
      orderList: [],
      selectedOrder: null,
      fileList: [],
      formData: {
        receiving_no: '',
        order_id: '',
        receiving_date: new Date().toISOString().slice(0, 19),
        received_quantity: 0,
        received_by: '',
        receiving_location: '',
        package_count: 1,
        package_type: '',
        total_weight: 0,
        shipping_company: '',
        tracking_number: '',
        shipped_date: '',
        shipping_cost: 0,
        appearance_check: 'good',
        package_condition: 'good',
        receiving_notes: '',
        delivery_note_no: '',
        inspection_certificate: '',
        receiving_status: 'completed'
      },
      formRules: {
        order_id: [
          { required: true, message: '外注注文を選択してください', trigger: 'change' }
        ],
        receiving_date: [
          { required: true, message: '受入日を選択してください', trigger: 'change' }
        ],
        received_quantity: [
          { required: true, message: '受入数量を入力してください', trigger: 'blur' },
          { type: 'number', min: 0.01, message: '0より大きい数値を入力してください', trigger: 'blur' }
        ],
        received_by: [
          { required: true, message: '受入担当者を入力してください', trigger: 'blur' }
        ],
        receiving_location: [
          { required: true, message: '受入場所を選択してください', trigger: 'change' }
        ],
        package_count: [
          { required: true, message: '梱包数を入力してください', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    maxReceivableQuantity() {
      if (!this.selectedOrder) return 0
      return (this.selectedOrder.order_quantity || 0) - (this.selectedOrder.received_quantity || 0)
    }
  },
  watch: {
    receivingData: {
      handler(newData) {
        if (newData) {
          this.formData = { ...newData }
          this.fileList = newData.attachments || []
          if (newData.order_id) {
            this.loadOrderInfo(newData.order_id)
          }
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.loadOrderList()
    if (this.mode === 'create') {
      this.generateReceivingNo()
    }
  },
  methods: {
    async loadOrderList() {
      try {
        const response = await outsourcingApi.getOrderList({
          status: 'confirmed,in_production,shipped',
          page: 1,
          size: 1000
        })
        if (response.success) {
          this.orderList = response.data.list.filter(order => {
            const remainingQty = (order.order_quantity || 0) - (order.received_quantity || 0)
            return remainingQty > 0
          })
        }
      } catch (error) {
        console.error('注文リスト取得エラー:', error)
      }
    },

    async loadOrderInfo(orderId) {
      try {
        const response = await outsourcingApi.getOrderDetail(orderId)
        if (response.success) {
          this.selectedOrder = response.data
        }
      } catch (error) {
        console.error('注文情報取得エラー:', error)
      }
    },

    async generateReceivingNo() {
      try {
        const response = await outsourcingApi.generateReceivingNo()
        if (response.success) {
          this.formData.receiving_no = response.data.receiving_no
        }
      } catch (error) {
        console.error('受入番号生成エラー:', error)
      }
    },

    onOrderChange() {
      if (this.formData.order_id) {
        this.loadOrderInfo(this.formData.order_id)
        const order = this.orderList.find(o => o.id === this.formData.order_id)
        if (order) {
          this.selectedOrder = order
          this.formData.received_quantity = 0
        }
      } else {
        this.selectedOrder = null
      }
    },

    calculateReceiving() {
      // 可以在这里添加计算逻辑
    },

    handleFileSuccess(response, file, fileList) {
      this.fileList = fileList
    },

    handleFileRemove(file, fileList) {
      this.fileList = fileList
    },

    downloadFile(file) {
      // 下载文件逻辑
      window.open(file.url)
    },

    handleSave() {
      this.$refs.receivingForm.validate((valid) => {
        if (valid) {
          if (this.formData.received_quantity > this.maxReceivableQuantity) {
            this.$message.error('受入数量が残り数量を超えています')
            return
          }

          this.saving = true

          const saveData = {
            ...this.formData,
            attachments: this.fileList
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

    getReceivingStatusType(status) {
      const statusMap = {
        pending: 'warning',
        partial: 'primary',
        completed: 'success'
      }
      return statusMap[status] || 'info'
    },

    getReceivingStatusText(status) {
      const statusMap = {
        pending: '未受入',
        partial: '一部受入',
        completed: '受入完了'
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

    formatDateTime(datetime) {
      if (!datetime) return '-'
      return new Date(datetime).toLocaleString('ja-JP')
    }
  }
}
</script>

<style scoped>
.receiving-form {
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
}

.order-info-display {
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
  min-width: 100px;
}

.info-item span {
  color: #2c3e50;
}

.remaining-quantity {
  font-weight: 600;
  color: #e6a23c;
}

.order-option {
  padding: 5px 0;
}

.order-no {
  font-weight: 600;
  color: #409eff;
}

.order-info {
  font-size: 12px;
  color: #666;
  margin: 2px 0;
}

.order-quantity {
  font-size: 12px;
  color: #999;
}

.file-list {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 10px;
  background-color: #fafafa;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item i {
  margin-right: 8px;
  color: #409eff;
}

.file-item span {
  flex: 1;
  margin-right: 10px;
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

.el-input-number {
  width: 100%;
}

.el-textarea {
  width: 100%;
}

.upload-demo {
  width: 100%;
}

.el-upload-dragger {
  width: 100%;
}
</style>
