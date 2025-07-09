<template>
  <div class="inspection-form">
    <el-form
      ref="inspectionForm"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      size="small"
    >
      <!-- 受入信息 -->
      <div class="form-section">
        <h4>受入情報</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>受入番号:</label>
              <span>{{ receivingData.receiving_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>外注注文:</label>
              <span>{{ receivingData.order_no }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>仕入先:</label>
              <span>{{ receivingData.supplier_name }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>製品名:</label>
              <span>{{ receivingData.product_name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>受入数量:</label>
              <span class="quantity-value"
                >{{ formatNumber(receivingData.received_quantity) }} {{ receivingData.unit }}</span
              >
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>受入日:</label>
              <span>{{ formatDate(receivingData.receiving_date) }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 检查基本信息 -->
      <div class="form-section">
        <h4>検査基本情報</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="検査日時" prop="inspection_date">
              <el-date-picker
                v-model="formData.inspection_date"
                type="datetime"
                placeholder="検査日時を選択"
                format="yyyy-MM-dd HH:mm"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
              ></el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="検査者" prop="inspector">
              <el-input v-model="formData.inspector" placeholder="検査者名を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="検査場所" prop="inspection_location">
              <el-select
                v-model="formData.inspection_location"
                placeholder="検査場所を選択"
                style="width: 100%"
              >
                <el-option label="第1検査室" value="inspection_room_1"></el-option>
                <el-option label="第2検査室" value="inspection_room_2"></el-option>
                <el-option label="現場検査" value="on_site"></el-option>
                <el-option label="外部検査機関" value="external"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="検査タイプ" prop="inspection_type">
              <el-select
                v-model="formData.inspection_type"
                placeholder="検査タイプを選択"
                style="width: 100%"
              >
                <el-option label="全数検査" value="full"></el-option>
                <el-option label="抜取検査" value="sampling"></el-option>
                <el-option label="外観検査のみ" value="visual_only"></el-option>
                <el-option label="機能検査のみ" value="functional_only"></el-option>
                <el-option label="特別検査" value="special"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 检查数量 -->
      <div class="form-section">
        <h4>検査数量</h4>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="検査数量" prop="inspected_quantity">
              <el-input-number
                v-model="formData.inspected_quantity"
                :min="0"
                :max="receivingData.received_quantity"
                :precision="2"
                style="width: 100%"
                @change="calculateResults"
              >
                <template slot="append">{{ receivingData.unit }}</template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="合格数量" prop="passed_quantity">
              <el-input-number
                v-model="formData.passed_quantity"
                :min="0"
                :max="formData.inspected_quantity"
                :precision="2"
                style="width: 100%"
                @change="calculateResults"
              >
                <template slot="append">{{ receivingData.unit }}</template>
              </el-input-number>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="不合格数量">
              <el-input
                :value="formatNumber(formData.failed_quantity) + ' ' + receivingData.unit"
                readonly
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="result-item">
              <label>合格率:</label>
              <span class="pass-rate">{{ (calculatedResults.pass_rate * 100).toFixed(2) }}%</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="result-item">
              <label>不良率:</label>
              <span class="defect-rate"
                >{{ (calculatedResults.defect_rate * 100).toFixed(2) }}%</span
              >
            </div>
          </el-col>
          <el-col :span="8">
            <div class="result-item">
              <label>PPM:</label>
              <span class="ppm-value">{{
                Math.round(calculatedResults.defect_rate * 1000000)
              }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 检查项目 -->
      <div class="form-section">
        <h4>検査項目</h4>
        <div class="inspection-items">
          <el-table :data="inspectionItems" border size="small" style="width: 100%">
            <el-table-column prop="item_name" label="検査項目" width="200"></el-table-column>
            <el-table-column prop="standard" label="基準" width="150"></el-table-column>
            <el-table-column prop="method" label="検査方法" width="120"></el-table-column>

            <el-table-column label="検査結果" width="120">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.result"
                  placeholder="結果"
                  size="small"
                  style="width: 100%"
                  @change="updateInspectionResult(scope.$index)"
                >
                  <el-option label="合格" value="pass"></el-option>
                  <el-option label="不合格" value="fail"></el-option>
                  <el-option label="条件付合格" value="conditional"></el-option>
                  <el-option label="未検査" value="not_tested"></el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="測定値" width="120">
              <template slot-scope="scope">
                <el-input
                  v-model="scope.row.measured_value"
                  placeholder="測定値"
                  size="small"
                ></el-input>
              </template>
            </el-table-column>

            <el-table-column label="備考" min-width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.remarks" placeholder="備考" size="small"></el-input>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="add-item-section">
          <el-button type="link" @click="addInspectionItem" icon="el-icon-plus">
            検査項目を追加
          </el-button>
        </div>
      </div>

      <!-- 不良详情 -->
      <div class="form-section" v-if="formData.failed_quantity > 0">
        <h4>不良詳細</h4>
        <div class="defect-details">
          <el-table :data="defectDetails" border size="small" style="width: 100%">
            <el-table-column prop="defect_type" label="不良タイプ" width="150">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.defect_type"
                  placeholder="タイプを選択"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="寸法不良" value="dimensional"></el-option>
                  <el-option label="外観不良" value="visual"></el-option>
                  <el-option label="機能不良" value="functional"></el-option>
                  <el-option label="員数不足" value="shortage"></el-option>
                  <el-option label="その他" value="other"></el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column prop="quantity" label="数量" width="120">
              <template slot-scope="scope">
                <el-input-number
                  v-model="scope.row.quantity"
                  :min="1"
                  :max="formData.failed_quantity"
                  :precision="0"
                  controls-position="right"
                  size="small"
                  style="width: 100%"
                ></el-input-number>
              </template>
            </el-table-column>

            <el-table-column prop="action" label="処置" width="120">
              <template slot-scope="scope">
                <el-select
                  v-model="scope.row.action"
                  placeholder="処置を選択"
                  size="small"
                  style="width: 100%"
                >
                  <el-option label="返品" value="return"></el-option>
                  <el-option label="廃棄" value="scrap"></el-option>
                  <el-option label="手直し" value="rework"></el-option>
                  <el-option label="特別採用" value="special_acceptance"></el-option>
                </el-select>
              </template>
            </el-table-column>

            <el-table-column label="備考" min-width="150">
              <template slot-scope="scope">
                <el-input v-model="scope.row.notes" placeholder="備考" size="small"></el-input>
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  icon="el-icon-delete"
                  type="link"
                  @click="removeDefectDetail(scope.$index)"
                ></el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="add-item-section">
          <el-button type="link" @click="addDefectDetail" icon="el-icon-plus">
            不良詳細を追加
          </el-button>
        </div>
      </div>

      <!-- 检查结论 -->
      <div class="form-section">
        <h4>検査結論</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="総合判定" prop="overall_result">
              <el-radio-group v-model="formData.overall_result">
                <el-radio label="pass">合格</el-radio>
                <el-radio label="fail">不合格</el-radio>
                <el-radio label="conditional">条件付合格</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="処置" prop="disposition" v-if="formData.overall_result !== 'pass'">
              <el-select
                v-model="formData.disposition"
                placeholder="処置を選択"
                style="width: 100%"
              >
                <el-option label="返品" value="return"></el-option>
                <el-option label="返工" value="rework"></el-option>
                <el-option label="特別採用" value="special_acceptance"></el-option>
                <el-option label="廃棄" value="scrap"></el-option>
                <el-option label="その他" value="other"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="検査備考" prop="inspection_notes">
          <el-input
            v-model="formData.inspection_notes"
            type="textarea"
            :rows="3"
            placeholder="検査結果の詳細や特記事項を記入してください"
          ></el-input>
        </el-form-item>

        <el-form-item
          label="改善要求"
          prop="improvement_request"
          v-if="formData.overall_result !== 'pass'"
        >
          <el-input
            v-model="formData.improvement_request"
            type="textarea"
            :rows="3"
            placeholder="仕入先への改善要求事項を記入してください"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 检查证明 -->
      <div class="form-section">
        <h4>検査証明</h4>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="検査証明書番号" prop="inspection_certificate_no">
              <el-input
                v-model="formData.inspection_certificate_no"
                placeholder="検査証明書番号を入力"
              ></el-input>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="承認者" prop="approved_by">
              <el-input v-model="formData.approved_by" placeholder="承認者名を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="検査写真・資料">
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
            <div class="el-upload__text">
              ファイルをドラッグするか、<em>クリックしてアップロード</em>
            </div>
            <div class="el-upload__tip" slot="tip">jpg/png/pdf ファイル、サイズは 10MB 以下</div>
          </el-upload>
        </el-form-item>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving"> 検査結果保存 </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'InspectionForm',
  props: {
    receivingData: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      saving: false,
      fileList: [],
      formData: {
        receiving_id: '',
        inspection_date: new Date().toISOString().slice(0, 19),
        inspector: '',
        inspection_location: '',
        inspection_type: 'sampling',
        inspected_quantity: 0,
        passed_quantity: 0,
        failed_quantity: 0,
        overall_result: 'pass',
        disposition: '',
        inspection_notes: '',
        improvement_request: '',
        inspection_certificate_no: '',
        approved_by: '',
      },
      formRules: {
        inspection_date: [
          { required: true, message: '検査日時を選択してください', trigger: 'change' },
        ],
        inspector: [{ required: true, message: '検査者を入力してください', trigger: 'blur' }],
        inspection_location: [
          { required: true, message: '検査場所を選択してください', trigger: 'change' },
        ],
        inspection_type: [
          { required: true, message: '検査タイプを選択してください', trigger: 'change' },
        ],
        inspected_quantity: [
          { required: true, message: '検査数量を入力してください', trigger: 'blur' },
          {
            type: 'number',
            min: 0.01,
            message: '0より大きい数値を入力してください',
            trigger: 'blur',
          },
        ],
        passed_quantity: [
          { required: true, message: '合格数量を入力してください', trigger: 'blur' },
        ],
        overall_result: [
          { required: true, message: '総合判定を選択してください', trigger: 'change' },
        ],
      },
      inspectionItems: [
        {
          item_name: '外観検査',
          standard: '傷・汚れなし',
          method: '目視',
          result: 'pass',
          measured_value: '',
          remarks: '',
        },
        {
          item_name: '寸法検査',
          standard: '図面通り±0.1mm',
          method: 'ノギス測定',
          result: 'pass',
          measured_value: '',
          remarks: '',
        },
      ],
      defectDetails: [],
      calculatedResults: {
        pass_rate: 0,
        defect_rate: 0,
      },
    }
  },
  watch: {
    receivingData: {
      handler(newData) {
        if (newData) {
          this.formData.receiving_id = newData.id
          this.formData.inspected_quantity = newData.received_quantity
          this.formData.passed_quantity = newData.received_quantity
          this.calculateResults()
        }
      },
      immediate: true,
    },
  },
  methods: {
    calculateResults() {
      const inspectedQty = this.formData.inspected_quantity || 0
      const passedQty = this.formData.passed_quantity || 0
      const failedQty = inspectedQty - passedQty

      this.formData.failed_quantity = failedQty

      if (inspectedQty > 0) {
        this.calculatedResults.pass_rate = passedQty / inspectedQty
        this.calculatedResults.defect_rate = failedQty / inspectedQty
      } else {
        this.calculatedResults.pass_rate = 0
        this.calculatedResults.defect_rate = 0
      }

      // 根据不良数量自动调整总合判定
      if (failedQty === 0) {
        this.formData.overall_result = 'pass'
      } else if (failedQty > 0 && this.calculatedResults.defect_rate < 0.05) {
        this.formData.overall_result = 'conditional'
      } else {
        this.formData.overall_result = 'fail'
      }

      // 管理不良详情
      if (failedQty > 0 && this.defectDetails.length === 0) {
        this.addDefectDetail()
      }
    },

    updateInspectionResult(index) {
      const item = this.inspectionItems[index]
      if (item.result === 'fail') {
        // 如果有检查项目不合格，总合判定不能是合格
        if (this.formData.overall_result === 'pass') {
          this.formData.overall_result = 'conditional'
        }
      }
    },

    addInspectionItem() {
      this.inspectionItems.push({
        item_name: '',
        standard: '',
        method: '',
        result: 'pass',
        measured_value: '',
        remarks: '',
      })
    },

    addDefectDetail() {
      this.defectDetails.push({
        defect_type: '',
        quantity: 0,
        action: '',
        notes: '',
      })
    },

    removeDefectDetail(index) {
      this.defectDetails.splice(index, 1)
    },

    handleFileSuccess(response, file, fileList) {
      this.fileList = fileList
    },

    handleFileRemove(file, fileList) {
      this.fileList = fileList
    },

    handleSave() {
      this.$refs.inspectionForm.validate((valid) => {
        if (valid) {
          if (this.formData.inspected_quantity > this.receivingData.received_quantity) {
            this.$message.error('検査数量が受入数量を超えています')
            return
          }

          if (this.formData.passed_quantity > this.formData.inspected_quantity) {
            this.$message.error('合格数量が検査数量を超えています')
            return
          }

          this.saving = true

          const saveData = {
            ...this.formData,
            inspection_items: this.inspectionItems,
            defect_details: this.defectDetails,
            attachments: this.fileList,
            ...this.calculatedResults,
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
.inspection-form {
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

.quantity-value {
  font-weight: 600;
  color: #409eff;
}

.result-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.result-item label {
  font-weight: 600;
  color: #5a6c7d;
  margin-right: 8px;
  min-width: 80px;
}

.pass-rate {
  font-weight: 600;
  color: #67c23a;
}

.defect-rate {
  font-weight: 600;
  color: #f56c6c;
}

.ppm-value {
  font-weight: 600;
  color: #e6a23c;
}

.inspection-items,
.defect-details {
  margin-bottom: 15px;
}

.add-item-section,
.add-defect-section {
  text-align: center;
  padding: 10px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
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

.el-table .cell {
  padding: 4px;
}
</style>
