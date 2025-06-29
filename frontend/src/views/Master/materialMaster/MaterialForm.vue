<!-- MaterialEditDialog.vue -->
<template>
  <el-dialog v-model="visibleLocal" width="700px" :before-close="handleClose" :destroy-on-close="true" :draggable="true"
    :close-on-click-modal="false" class="material-dialog" transition="dialog-fade-zoom">
    <div class="dialog-title">
      <span class="icon">🧱</span> 材料情報の登録・編集
    </div>

    <el-tabs v-model="activeTab" class="dialog-tabs">
      <el-tab-pane label="基本情報" name="basic">
        <div class="tab-content">
          <el-form :model="form" ref="formRef" label-width="130px" class="dialog-form">
            <el-form-item label="材料CD" prop="material_cd">
              <el-input v-model="form.material_cd" />
            </el-form-item>
            <el-form-item label="材料名" prop="material_name">
              <el-input v-model="form.material_name" />
            </el-form-item>
            <el-form-item label="材料種類">
              <el-select v-model="form.material_type" placeholder="選択">
                <el-option label="鋼管" value="鋼管" />
                <el-option label="鋼板" value="鋼板" />
                <el-option label="棒鋼" value="棒鋼" />
                <el-option label="コイル材" value="コイル材" />
              </el-select>
            </el-form-item>
            <el-form-item label="規格">
              <el-input v-model="form.standard_spec" />
            </el-form-item>
            <el-form-item label="用途">
              <el-select v-model="form.usegae" placeholder="選択">
                <el-option label="生産用" value="生産用" />
                <el-option label="試作用" value="試作用" />
                <el-option label="支給用" value="支給用" />
                <el-option label="その他" value="その他" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="寸法・仕様" name="specs">
        <div class="tab-content">
          <el-form :model="form" label-width="130px" class="dialog-form">
            <el-form-item label="単位" prop="unit">
              <el-select v-model="form.unit" placeholder="選択">
                <el-option label="kg" value="kg" />
                <el-option label="本" value="本" />
                <el-option label="m" value="m" />
                <el-option label="枚" value="枚" />
              </el-select>
            </el-form-item>
            <el-form-item label="直径（mm）"><el-input-number v-model="form.diameter" :min="0" :step="0.1" /></el-form-item>
            <el-form-item label="厚さ（mm）"><el-input-number v-model="form.thickness" :min="0"
                :step="0.01" /></el-form-item>
            <el-form-item label="長さ（mm）"><el-input-number v-model="form.length" :min="0" :step="1" /></el-form-item>
            <el-form-item label="束本数"><el-input-number v-model="form.pieces_per_bundle" :min="0" /></el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="仕入・在庫" name="purchase">
        <div class="tab-content">
          <el-form :model="form" label-width="130px" class="dialog-form">
            <el-form-item label="支給区分">
              <el-select v-model="form.supply_classification" placeholder="選択">
                <el-option label="有償" value="有償" />
                <el-option label="無償" value="無償" />
                <el-option label="自給" value="自給" />
              </el-select>
            </el-form-item>
            <el-form-item label="仕入先CD">
              <el-select v-model="form.supplier_cd" placeholder="選択">
                <el-option v-for="item in supplierOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                  :value="item.cd" />
              </el-select>
            </el-form-item>
            <el-form-item label="単重単価" prop="unit_price"><el-input-number v-model="form.unit_price" :min="0"
                :step="0.01" /></el-form-item>
            <el-form-item label="長尺単重"><el-input-number v-model="form.long_weight" :min="0"
                :step="0.01" /></el-form-item>
            <el-form-item label="一本単価"><el-input-number v-model="form.single_price" :min="0"
                :step="0.01" /></el-form-item>
            <el-form-item label="安全在庫"><el-input-number v-model="form.safety_stock" :min="0" /></el-form-item>
            <el-form-item label="リードタイム"><el-input-number v-model="form.lead_time" :min="0" /></el-form-item>
            <el-form-item label="保管場所">
              <el-select v-model="form.storage_location" placeholder="選択">
                <el-option v-for="loc in locationOptions" :key="loc.cd" :label="loc.name" :value="loc.cd" />
              </el-select>
            </el-form-item>
            <el-form-item label="状態"><el-switch v-model="form.status" :active-value="1"
                :inactive-value="0" /></el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="備考" name="note">
        <div class="tab-content">
          <el-form :model="form" label-width="130px" class="dialog-form">
            <el-form-item label="備考"><el-input type="textarea" v-model="form.note" :rows="6" /></el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button class="cancel-btn" @click="handleClose">キャンセル</el-button>
      <el-button class="save-btn" type="primary" :loading="loading" @click="submitForm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createMaterial, updateMaterial, getMaxMaterialCd, getMaterialById } from '@/api/master/materialMaster'
import type { Material, OptionItem } from '@/types/master'
import { getSupplierOptions } from '@/api/options'

function createEmptyMaterial(): Material {
  return {
    id: 0, material_cd: '', material_name: '', material_type: '', standard_spec: '',
    unit: '', diameter: 0, thickness: 0, length: 0, pieces_per_bundle: 0,
    supply_classification: '', usegae: '', supplier_cd: '', unit_price: 0,
    long_weight: 0, single_price: 0, safety_stock: 0, lead_time: 0,
    storage_location: '', status: 1, note: ''
  }
}

const props = defineProps<{ visible: boolean; dataId?: number | null }>()
const emit = defineEmits(['update:visible', 'refresh'])

const visibleLocal = ref(false)
watch(() => props.visible, val => { visibleLocal.value = val })
watch(visibleLocal, val => { emit('update:visible', val) })

const activeTab = ref('basic')
const supplierOptions = ref<OptionItem[]>([])
const locationOptions = ref<OptionItem[]>([
  { cd: '材料倉庫', name: '材料倉庫' }, { cd: '製品倉庫', name: '製品倉庫' },
  { cd: '仮設倉庫', name: '仮設倉庫' }, { cd: '部品倉庫', name: '部品倉庫' },
  { cd: '外注倉庫', name: '外注倉庫' }, { cd: 'その他', name: 'その他' }
])

const loading = ref(false)
const formRef = ref()
const form = ref<Material>(createEmptyMaterial())

function resetForm() {
  form.value = createEmptyMaterial()
  activeTab.value = 'basic'
}
function handleClose() {
  emit('update:visible', false)
  resetForm()
}

watch(() => props.visible, async (val) => {
  if (!val) return
  resetForm()
  if (props.dataId != null) {
    // 编辑模式
    const response = await getMaterialById(props.dataId)
    const data = response.data
    const empty = createEmptyMaterial()
    Object.keys(empty).forEach(key => {
      // @ts-expect-error 动态赋值Material字段，类型检查可忽略
      form.value[key] = data[key] !== undefined ? data[key] : empty[key]
    })
  } else {
    // 新规模式
    try {
      const res = await getMaxMaterialCd()
      const maxCd = Number(res.max_code ?? 0)
      form.value.material_cd = String(maxCd + 1).padStart(5, '0')
    } catch {
      form.value.material_cd = '10001'
    }
  }
}, { immediate: true })

async function submitForm() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    const fn = form.value.id ? updateMaterial : createMaterial
    await fn(form.value as Material)
    ElMessage.success('保存しました')
    emit('update:visible', false)
    emit('refresh')
    loading.value = false
  })
}
onMounted(async () => { supplierOptions.value = await getSupplierOptions() })
</script>

<style scoped>
.material-dialog .el-dialog__body {
  padding-top: 0;
}

.dialog-title {
  font-size: 22px;
  font-weight: bold;
  color: #2c3e50;
  padding: 20px 24px 12px;
  border-bottom: 1px solid #ebeef5;
  background: linear-gradient(to right, #e6f7ff, #ffffff);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  align-items: center;
}

.dialog-title .icon {
  margin-right: 12px;
  font-size: 24px;
}

.dialog-tabs {
  padding: 0 10px;
}

.tab-content {
  background: #f8fafc;
  border-radius: 14px;
  box-shadow: 0 2px 12px rgba(41, 128, 185, 0.08);
  padding: 24px 18px 10px 18px;
  margin: 18px 0 8px 0;
}

.dialog-form {
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 18px 24px;
}

.el-form-item {
  flex: 1 1 320px;
  min-width: 180px;
  margin-bottom: 0;
}

.el-input,
.el-select,
.el-input-number {
  width: 100%;
  font-size: 15px;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.el-input:focus-within,
.el-select:focus-within,
.el-input-number:focus-within {
  box-shadow: 0 0 0 2px #2980b933;
}

.cancel-btn {
  border-radius: 8px;
  background: #f5f7fa;
  color: #2980b9;
  border: 1px solid #2980b9;
  font-weight: 600;
  margin-right: 8px;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #eaf6fb;
  color: #1a5a7a;
}

.save-btn {
  border-radius: 8px;
  background: linear-gradient(90deg, #27ae60 0%, #2980b9 100%);
  color: #fff;
  font-weight: 700;
  border: none;
  box-shadow: 0 2px 8px rgba(41, 128, 185, 0.13);
  transition: all 0.2s;
}

.save-btn:hover {
  background: linear-gradient(90deg, #2980b9 0%, #27ae60 100%);
}

@media (max-width: 900px) {
  .dialog-form {
    flex-direction: column;
    gap: 12px;
  }

  .el-form-item {
    min-width: 120px;
  }

  .tab-content {
    padding: 14px 6px 6px 6px;
  }
}

@media (max-width: 600px) {
  .material-dialog .el-dialog {
    width: 98vw !important;
  }

  .dialog-title {
    font-size: 18px;
    padding: 12px 10px 8px;
  }

  .tab-content {
    margin: 8px 0;
  }
}
</style>
