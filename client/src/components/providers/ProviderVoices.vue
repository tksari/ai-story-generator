<template>
  <div class="provider-voices">
    <div class="tab-header">
      <h3>Provider Voices</h3>
      <div class="tab-actions">
        <el-button type="primary" @click="showImportVoicesDialog = true">
          <el-icon>
            <Upload />
          </el-icon>
          Import Voices
        </el-button>
        <el-button type="success" @click="showAddVoiceDialog = true">
          <el-icon>
            <Plus />
          </el-icon>
          Add Voice
        </el-button>
      </div>
    </div>

    <el-table :data="voices" style="width: 100%" v-loading="loading">
      <el-table-column prop="name" label="Name" />
      <el-table-column prop="voiceId" label="Voice ID" />
      <el-table-column prop="languages" label="Languages">
        <template #default="{ row }">
          <el-tag v-for="lang in row.languages" :key="lang" class="mr-1">
            {{ lang }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gender" label="Gender" />
      <el-table-column prop="style" label="Style" />
      <el-table-column prop="sampleRate" label="Sample Rate" />
      <el-table-column prop="isDefault" label="Default">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault" type="success">Default</el-tag>
          <el-button
            v-else
            size="small"
            text
            type="primary"
            @click="setDefaultVoice(row)"
          >
            Set Default
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="isActive" label="Status">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'danger'">
            {{ row.isActive ? "Active" : "Inactive" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="150">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="editVoice(row)">
              <el-icon>
                <Edit />
              </el-icon>
            </el-button>
            <el-button type="danger" size="small" @click="deleteVoice(row)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showAddVoiceDialog"
      :title="editingVoice ? 'Edit Voice' : 'Add Voice'"
      width="500px"
    >
      <el-form
        :model="voiceForm"
        label-width="120px"
        ref="voiceFormRef"
        :rules="voiceRules"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="voiceForm.name" />
        </el-form-item>
        <el-form-item label="Voice ID" prop="voiceId">
          <el-input v-model="voiceForm.voiceId" />
        </el-form-item>
        <el-form-item label="Languages">
          <el-select
            v-model="voiceForm.languages"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="Enter language codes (e.g., en-US, tr-TR)"
          />
        </el-form-item>
        <el-form-item label="Gender">
          <el-select v-model="voiceForm.gender" placeholder="Select gender">
            <el-option label="Female" value="female" />
            <el-option label="Male" value="male" />
            <el-option label="Neutral" value="neutral" />
          </el-select>
        </el-form-item>
        <el-form-item label="Style">
          <el-input
            v-model="voiceForm.style"
            placeholder="e.g., casual, professional"
          />
        </el-form-item>
        <el-form-item label="Sample Rate">
          <el-input-number
            v-model="voiceForm.sampleRate"
            :min="8000"
            :step="8000"
          />
        </el-form-item>
        <el-form-item label="Default Voice">
          <el-switch v-model="voiceForm.isDefault" />
        </el-form-item>
        <el-form-item label="Active">
          <el-switch v-model="voiceForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddVoiceDialog = false">Cancel</el-button>
          <el-button type="primary" @click="saveVoice">
            {{ editingVoice ? "Update" : "Create" }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showImportVoicesDialog"
      title="Import Voices"
      width="600px"
    >
      <el-alert type="info" :closable="false" show-icon>
        <p>
          Enter voice data in JSON format. Each voice requires name and voiceId
          fields.
        </p>
      </el-alert>
      <el-form class="mt-4">
        <el-form-item>
          <MonacoEditor
            v-model="importVoicesText"
            language="json"
            theme="vs-light"
            @change="
              (value) => {
                try {
                  JSON.parse(value);
                  editorContainer?.classList.remove('error');
                } catch (e) {
                  editorContainer?.classList.add('error');
                }
              }
            "
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showImportVoicesDialog = false">Cancel</el-button>
          <el-button type="primary" @click="importVoices"> Import </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Edit, Delete, Plus, Upload } from "@element-plus/icons-vue";
import { useVoiceStore } from "@/stores/voice.store";
import type { Voice, CreateVoiceDto } from "@/types/provider.types";
import MonacoEditor from "@/components/common/MonacoEditor.vue";
import { showConfirm } from "@/utils/message-box.helper.ts";

const props = defineProps<{
  providerId: number;
}>();

const voiceStore = useVoiceStore();
const loading = ref(false);
const voices = ref<Voice[]>([]);

const showAddVoiceDialog = ref(false);
const editingVoice = ref<Voice | null>(null);
const voiceFormRef = ref<FormInstance>();
const voiceForm = ref<CreateVoiceDto>({
  name: "",
  voiceId: "",
  languages: [],
  gender: "",
  style: "",
  sampleRate: 24000,
  isDefault: false,
  isActive: true,
});

const voiceRules: FormRules = {
  name: [
    { required: true, message: "Please enter voice name", trigger: "blur" },
  ],
  voiceId: [
    { required: true, message: "Please enter voice ID", trigger: "blur" },
  ],
};

const showImportVoicesDialog = ref(false);
const importVoicesText = ref("");

const editorContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  await fetchVoices();
});

async function fetchVoices() {
  loading.value = true;
  try {
    await voiceStore.fetchVoices(props.providerId, true);
    voices.value = voiceStore.voices;
  } catch (error) {
    ElMessage.error("Failed to load voices");
  } finally {
    loading.value = false;
  }
}

const editVoice = (voice: Voice) => {
  editingVoice.value = voice;
  voiceForm.value = {
    name: voice.name,
    voiceId: voice.voiceId,
    languages: voice.languages || [],
    gender: voice.gender || "",
    style: voice.style || "",
    sampleRate: voice.sampleRate || 24000,
    isDefault: voice.isDefault,
    isActive: voice.isActive,
  };
  showAddVoiceDialog.value = true;
};

const deleteVoice = async (voice: Voice) => {
  try {
    await showConfirm("Are you sure you want to delete this voice?", {
      title: "Warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    await voiceStore.deleteVoice(voice.id);
    ElMessage.success("Voice deleted successfully");
    await fetchVoices();
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("Failed to delete voice");
    }
  }
};

const saveVoice = async () => {
  if (!voiceFormRef.value) return;

  await voiceFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      if (editingVoice.value) {
        await voiceStore.updateVoice(editingVoice.value.id, voiceForm.value);
        ElMessage.success("Voice updated successfully");
      } else {
        await voiceStore.bulkCreate(props.providerId, [voiceForm.value]);
        ElMessage.success("Voice created successfully");
      }

      showAddVoiceDialog.value = false;
      resetVoiceForm();
      await fetchVoices();
    } catch (error) {
      ElMessage.error("Failed to save voice");
    }
  });
};

const resetVoiceForm = () => {
  voiceForm.value = {
    name: "",
    voiceId: "",
    languages: [],
    gender: "",
    style: "",
    sampleRate: 24000,
    isDefault: false,
    isActive: true,
  };
  editingVoice.value = null;
  if (voiceFormRef.value) {
    voiceFormRef.value.resetFields();
  }
};

const importVoices = async () => {
  try {
    const voicesData = JSON.parse(importVoicesText.value);
    if (!Array.isArray(voicesData)) {
      throw new Error("Invalid data format. Expected an array of voices.");
    }

    await voiceStore.bulkCreate(props.providerId, voicesData);
    ElMessage.success("Voices imported successfully");
    showImportVoicesDialog.value = false;
    importVoicesText.value = "";
    await fetchVoices();
  } catch (error) {
    ElMessage.error(
      `Failed to import voices: ${error instanceof Error ? error.message : "Invalid data"}`,
    );
  }
};

const setDefaultVoice = async (voice: Voice) => {
  try {
    await voiceStore.setDefaultVoice(voice.id);
    ElMessage.success("Default voice set successfully");
    await fetchVoices();
  } catch (error) {
    ElMessage.error("Failed to set default voice");
  }
};
</script>

<style scoped>
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tab-actions {
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mr-1 {
  margin-right: 0.25rem;
}

.mt-4 {
  margin-top: 1rem;
}

.monaco-editor-container {
  width: 100%;
  height: 300px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.monaco-editor-container.error {
  border-color: var(--el-color-danger);
}
</style>
