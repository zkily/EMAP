<template>
  <el-card class="form-card" shadow="hover">
    <h2>🧪 材料在庫 入出庫登録</h2>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="vertical-form" label-position="left">
      <!-- 材料CD -->
      <el-form-item label="材料" prop="target_cd">
        <el-select v-model="form.target_cd" filterable placeholder="材料を選択" style="width: 100%">
          <el-option v-for="item in materialOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
            :value="item.cd" />
        </el-select>
      </el-form-item>

      <!-- 保管場所 -->
      <el-form-item label="保管場所" prop="location_cd">
        <el-radio-group v-model="form.location_cd" class="location-radio-group">
          <el-radio-button v-for="loc in locationOptions" :key="loc.cd" :label="loc.cd">{{ loc.name }}</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 操作種別 -->
      <el-form-item label="操作種別" prop="transaction_type">
        <el-radio-group v-model="form.transaction_type" class="transaction-type-group">
          <el-radio-button value="入庫">入庫</el-radio-button>
          <el-radio-button value="出庫">出庫</el-radio-button>
          <el-radio-button value="調整">調整</el-radio-button>
          <el-radio-button value="廃棄">廃棄</el-radio-button>
          <el-radio-button value="保留">保留</el-radio-button>
          <el-radio-button value="初期">初期</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <!-- 数量 + 単位 -->
      <el-form-item label="数量" prop="quantity">
        <div class="quantity-unit-row">
          <el-input-number v-model="form.quantity" :min="0" :step="1" class="quantity-input" style="width: 110px;" />
          <el-select v-model="form.unit" placeholder="単位を選択" class="unit-select">
            <el-option label="束" value="束" />
            <el-option label="kg" value="kg" />
            <el-option label="m" value="m" />
            <el-option label="枚" value="枚" />
            <el-option label="個" value="個" />
            <el-option label="本" value="本" />
            <el-option label="箱" value="箱" />
            <el-option label="その他" value="その他" />
          </el-select>
        </div>
      </el-form-item>

      <!-- 束本数 -->
      <el-form-item label="束本数" prop="base_qty">
        <el-input-number v-model="form.base_qty" :min="0" :step="1" class="quantity-input" style="width: 110px;"
          placeholder="束あたりの本数" />
        <span style="margin-left:8px; color:#888;">本/束</span>
      </el-form-item>

      <!-- 伝票情報 -->
      <el-form-item label="関連伝票">
        <el-input v-model="form.related_doc_type" style="width: 150px" placeholder="伝票種別" />
        <el-input v-model="form.related_doc_no" style="width: 180px" placeholder="伝票番号" />
      </el-form-item>
      <el-form-item label="備考">
        <el-input v-model="form.remarks" type="textarea" :rows="2" style="width: 100%" />
      </el-form-item>

      <!-- 操作日時 -->
      <el-form-item label="操作日時" prop="transaction_time">
        <el-date-picker v-model="form.transaction_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 100%" />
      </el-form-item>

      <!-- 操作 -->
      <el-form-item class="form-actions">
        <el-button type="primary" @click="submit">登録</el-button>
        <el-button @click="resetForm">リセット</el-button>
      </el-form-item>
    </el-form>

    <!-- 登録した材料一覧 -->
    <el-card v-if="todayLoggedMaterials.length" class="result-card" shadow="hover" style="margin-top: 24px">
      <h3>🗓 本日登録した材料</h3>
      <el-table :data="todayLoggedMaterials" stripe style="width: 100%">
        <el-table-column prop="cd" label="材料CD" width="120" />
        <el-table-column prop="name" label="材料名称" />
        <el-table-column prop="transaction_type" label="操作種別" width="100" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit" label="単位" width="80" />
      </el-table>
    </el-card>
  </el-card>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { getMaterialOptions } from '@/api/options';
import type { OptionItem } from '@/types/master';

interface MaterialStockForm {
  target_cd: string;
  location_cd: string;
  transaction_type: string;
  quantity: number;
  unit: string;
  base_qty: number;
  related_doc_type: string;
  related_doc_no: string;
  remarks: string;
  transaction_time: string;
}

interface LoggedMaterial extends OptionItem {
  transaction_type: string;
  quantity: number;
  unit: string;
}

function getLocalDateTimeString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

const createInitialForm = (): MaterialStockForm => ({
  target_cd: '',
  location_cd: '材料置場',
  transaction_type: '',
  quantity: 0,
  unit: '束',
  base_qty: 0,
  related_doc_type: '',
  related_doc_no: '',
  remarks: '',
  transaction_time: getLocalDateTimeString(),
});

const formRef = ref<InstanceType<typeof import('element-plus').ElForm>>();
const form = ref<MaterialStockForm>(createInitialForm());

const rules = {
  target_cd: [{ required: true, message: '材料を選択してください', trigger: 'change' }],
  location_cd: [{ required: true, message: '保管場所を選択してください', trigger: 'change' }],
  transaction_type: [{ required: true, message: '操作種別を選択してください', trigger: 'change' }],
  quantity: [{ required: true, message: '数量を入力してください', trigger: 'blur' }],
  unit: [{ required: true, message: '単位を選択してください', trigger: 'change' }],
  base_qty: [{ required: true, message: '束本数を入力してください', trigger: 'blur' }],
  transaction_time: [{ required: true, message: '操作日時を選択してください', trigger: 'change' }],
};

const materialOptions = ref<OptionItem[]>([]);
const locationOptions = ref<OptionItem[]>([
  { cd: '製品倉庫', name: '製品倉庫' },
  { cd: '仮設倉庫', name: '仮設倉庫' },
  { cd: '部品倉庫', name: '部品倉庫' },
  { cd: '仕上倉庫', name: '仕上倉庫' },
  { cd: 'メッキ倉庫', name: 'メッキ倉庫' },
  { cd: '工程中間在庫', name: '工程中間在庫' },
  { cd: '材料置場', name: '材料置場' },
  { cd: 'その他', name: 'その他' },
]);

const todayLoggedMaterials = ref<LoggedMaterial[]>([]);

onMounted(async () => {
  materialOptions.value = await getMaterialOptions();
});

const submit = async () => {
  try {
    await formRef.value!.validate();
  } catch {
    ElMessage.warning('必須項目を確認してください');
    return;
  }

  try {
    await request.post('/api/stock/transaction', {
      stock_type: '材料',
      ...form.value,
      process_cd: 'KT15',
    });
    ElMessage.success('在庫履歴を登録しました');

    // 当日の登録のみ記録
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayYMD = `${y}-${m}-${d}`;
    const loggedDate = form.value.transaction_time.slice(0, 10);

    if (loggedDate === todayYMD) {
      const base = materialOptions.value.find(m => m.cd === form.value.target_cd);
      if (
        base &&
        !todayLoggedMaterials.value.some(
          x =>
            x.cd === base.cd &&
            x.transaction_type === form.value.transaction_type &&
            x.quantity === form.value.quantity &&
            x.unit === form.value.unit
        )
      ) {
        todayLoggedMaterials.value.push({
          cd: base.cd,
          name: base.name,
          transaction_type: form.value.transaction_type,
          quantity: form.value.quantity,
          unit: form.value.unit,
        });
      }
    }

    resetForm();
  } catch {
    ElMessage.error('登録に失敗しました');
  }
};

const resetForm = () => {
  formRef.value!.resetFields();
  form.value = createInitialForm();
};
</script>

<style scoped>
.form-card,
.result-card {
  max-width: 720px;
  margin: 0 auto;
}

.vertical-form .el-form-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 12px;
}

.vertical-form .el-form-item__label {
  margin-bottom: 4px;
  font-weight: 500;
}

.location-radio-group,
.transaction-type-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.location-radio-group :deep(.el-radio-button__inner),
.transaction-type-group :deep(.el-radio-button__inner) {
  border-radius: 8px !important;
  padding: 8px 16px;
  background: #fff;
  color: #1a202c;
  border: 1px solid #bfcbd9;
  font-weight: 500;
  min-width: 80px;
  text-align: center;
  transition: all 0.2s;
}

.location-radio-group :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner),
.transaction-type-group :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.quantity-unit-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 300px;
}

.quantity-input {
  flex: 0 0 120px;
  min-width: 70px;
}

.unit-select {
  flex: 0 0 100px;
  min-width: 70px;
}
</style>
