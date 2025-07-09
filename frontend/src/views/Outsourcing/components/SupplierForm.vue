<template>
  <div class="supplier-form">
    <el-form
      ref="supplierForm"
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
            <el-form-item label="仕入先CD" prop="supplier_cd">
              <el-input v-model="formData.supplier_cd" :disabled="mode === 'edit'" placeholder="仕入先CDを入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仕入先名" prop="supplier_name">
              <el-input v-model="formData.supplier_name" placeholder="仕入先名を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="仕入先名（カナ）" prop="supplier_name_kana">
              <el-input v-model="formData.supplier_name_kana" placeholder="仕入先名（カナ）を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="略称" prop="supplier_short_name">
              <el-input v-model="formData.supplier_short_name" placeholder="略称を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="状態" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option label="有効" value="active"></el-option>
                <el-option label="無効" value="inactive"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="仕入先区分" prop="supplier_type">
              <el-select v-model="formData.supplier_type" style="width: 100%">
                <el-option label="外注加工" value="outsourcing"></el-option>
                <el-option label="材料供給" value="material"></el-option>
                <el-option label="両方" value="both"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="評価" prop="overall_rating">
              <el-select v-model="formData.overall_rating" style="width: 100%">
                <el-option label="S" value="S"></el-option>
                <el-option label="A" value="A"></el-option>
                <el-option label="B" value="B"></el-option>
                <el-option label="C" value="C"></el-option>
                <el-option label="D" value="D"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 联系信息 -->
      <div class="form-section">
        <h3>連絡先情報</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="担当者" prop="contact_person">
              <el-input v-model="formData.contact_person" placeholder="担当者名を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部署" prop="contact_department">
              <el-input v-model="formData.contact_department" placeholder="部署名を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="電話番号" prop="phone">
              <el-input v-model="formData.phone" placeholder="電話番号を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="FAX番号" prop="fax">
              <el-input v-model="formData.fax" placeholder="FAX番号を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="メールアドレス" prop="email">
              <el-input v-model="formData.email" placeholder="メールアドレスを入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 住所信息 -->
      <div class="form-section">
        <h3>住所情報</h3>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="郵便番号" prop="postal_code">
              <el-input v-model="formData.postal_code" placeholder="郵便番号を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="都道府県" prop="prefecture">
              <el-select v-model="formData.prefecture" style="width: 100%" filterable>
                <el-option
                  v-for="prefecture in prefectureList"
                  :key="prefecture"
                  :label="prefecture"
                  :value="prefecture"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="市区町村" prop="city">
              <el-input v-model="formData.city" placeholder="市区町村を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="住所" prop="address">
              <el-input v-model="formData.address" placeholder="住所を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 财务信息 -->
      <div class="form-section">
        <h3>財務情報</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="支払条件" prop="payment_terms">
              <el-select v-model="formData.payment_terms" style="width: 100%">
                <el-option label="月末締翌月末払い" value="monthly_end"></el-option>
                <el-option label="20日締翌月10日払い" value="20th_next_10th"></el-option>
                <el-option label="15日締当月末払い" value="15th_current_end"></el-option>
                <el-option label="現金" value="cash"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支払方法" prop="payment_method">
              <el-select v-model="formData.payment_method" style="width: 100%">
                <el-option label="銀行振込" value="bank_transfer"></el-option>
                <el-option label="手形" value="promissory_note"></el-option>
                <el-option label="現金" value="cash"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="銀行名" prop="bank_name">
              <el-input v-model="formData.bank_name" placeholder="銀行名を入力"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支店名" prop="bank_branch">
              <el-input v-model="formData.bank_branch" placeholder="支店名を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="口座種別" prop="account_type">
              <el-select v-model="formData.account_type" style="width: 100%">
                <el-option label="普通" value="ordinary"></el-option>
                <el-option label="当座" value="current"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="口座番号" prop="account_number">
              <el-input v-model="formData.account_number" placeholder="口座番号を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="口座名義" prop="account_holder">
              <el-input v-model="formData.account_holder" placeholder="口座名義を入力"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 认证和资质 -->
      <div class="form-section">
        <h3>認証・資格</h3>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ISO認証">
              <el-checkbox-group v-model="formData.iso_certifications">
                <el-checkbox label="ISO9001">ISO9001</el-checkbox>
                <el-checkbox label="ISO14001">ISO14001</el-checkbox>
                <el-checkbox label="ISO45001">ISO45001</el-checkbox>
                <el-checkbox label="TS16949">TS16949</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="その他認証">
              <el-input
                v-model="formData.other_certifications"
                type="textarea"
                :rows="3"
                placeholder="その他の認証・資格を入力"
              ></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 备注 -->
      <div class="form-section">
        <h3>備考</h3>
        <el-form-item label="備考" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="4"
            placeholder="備考を入力してください"
          ></el-input>
        </el-form-item>
      </div>

      <!-- 创建/更新信息（仅查看模式） -->
      <div class="form-section" v-if="mode === 'view'">
        <h3>システム情報</h3>
        <el-row :gutter="20">
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
          <el-col :span="8">
            <el-form-item label="作成者">
              <span>{{ formData.created_by }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </div>
    </el-form>

    <!-- 操作按钮 -->
    <div class="form-actions">
      <el-button @click="handleCancel">{{ mode === 'view' ? '閉じる' : 'キャンセル' }}</el-button>
      <el-button v-if="mode !== 'view'" type="primary" @click="handleSave" :loading="saving">保存</el-button>
      <el-button v-if="mode === 'view'" type="primary" @click="handleEdit">編集</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SupplierForm',
  props: {
    supplierData: {
      type: Object,
      default: null
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
        supplier_cd: '',
        supplier_name: '',
        supplier_name_kana: '',
        supplier_short_name: '',
        status: 'active',
        supplier_type: 'outsourcing',
        overall_rating: 'B',
        contact_person: '',
        contact_department: '',
        phone: '',
        fax: '',
        email: '',
        postal_code: '',
        prefecture: '',
        city: '',
        address: '',
        payment_terms: 'monthly_end',
        payment_method: 'bank_transfer',
        bank_name: '',
        bank_branch: '',
        account_type: 'ordinary',
        account_number: '',
        account_holder: '',
        iso_certifications: [],
        other_certifications: '',
        remarks: ''
      },
      formRules: {
        supplier_cd: [
          { required: true, message: '仕入先CDを入力してください', trigger: 'blur' },
          { pattern: /^[A-Z0-9]{3,10}$/, message: '仕入先CDは3-10文字の英数字で入力してください', trigger: 'blur' }
        ],
        supplier_name: [
          { required: true, message: '仕入先名を入力してください', trigger: 'blur' },
          { max: 100, message: '仕入先名は100文字以内で入力してください', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '状態を選択してください', trigger: 'change' }
        ],
        supplier_type: [
          { required: true, message: '仕入先区分を選択してください', trigger: 'change' }
        ],
        email: [
          { type: 'email', message: '正しいメールアドレスを入力してください', trigger: 'blur' }
        ],
        phone: [
          { pattern: /^[0-9-+()\s]+$/, message: '正しい電話番号を入力してください', trigger: 'blur' }
        ]
      },
      prefectureList: [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
      ]
    }
  },
  watch: {
    supplierData: {
      handler(newVal) {
        if (newVal) {
          this.formData = {
            ...this.formData,
            ...newVal,
            iso_certifications: newVal.iso_certifications || []
          }
        } else {
          this.resetForm()
        }
      },
      immediate: true
    }
  },
  methods: {
    handleSave() {
      this.$refs.supplierForm.validate(valid => {
        if (valid) {
          this.saving = true
          this.$emit('save', { ...this.formData })
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
        supplier_cd: '',
        supplier_name: '',
        supplier_name_kana: '',
        supplier_short_name: '',
        status: 'active',
        supplier_type: 'outsourcing',
        overall_rating: 'B',
        contact_person: '',
        contact_department: '',
        phone: '',
        fax: '',
        email: '',
        postal_code: '',
        prefecture: '',
        city: '',
        address: '',
        payment_terms: 'monthly_end',
        payment_method: 'bank_transfer',
        bank_name: '',
        bank_branch: '',
        account_type: 'ordinary',
        account_number: '',
        account_holder: '',
        iso_certifications: [],
        other_certifications: '',
        remarks: ''
      }
    },
    
    formatDateTime(datetime) {
      if (!datetime) return ''
      return new Date(datetime).toLocaleString('ja-JP')
    }
  }
}
</script>

<style scoped>
.supplier-form {
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

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #c0c4cc;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>