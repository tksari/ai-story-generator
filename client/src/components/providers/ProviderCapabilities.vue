<template>
  <div class="provider-capabilities">
    <div class="tab-header">
      <h3>Provider Capabilities</h3>
      <el-button type="primary" @click="showAddCapabilityDialog = true">
        <el-icon>
          <Plus />
        </el-icon>
        Add Capability
      </el-button>
    </div>

    <el-table :data="capabilities" style="width: 100%" v-loading="loading">
      <el-table-column prop="type" label="Capability">
        <template #default="{ row }">
          {{ formatCapabilityType(row.type) }}
        </template>
      </el-table-column>
      <el-table-column prop="configOptions" label="Configuration">
        <template #default="{ row }">
          <pre v-if="row.configOptions">{{
            JSON.stringify(row.configOptions, null, 2)
          }}</pre>
          <span v-else>No configuration</span>
        </template>
      </el-table-column>
      <el-table-column prop="isDefault" label="Default">
        <template #default="{ row }">
          <el-tag v-if="row.isDefault" type="success">Default</el-tag>
          <el-button
            v-else
            size="small"
            text
            type="primary"
            @click="setDefaultCapability(row)"
          >
            Set Default
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="150">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click="editCapability(row)">
              <el-icon>
                <Edit />
              </el-icon>
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="deleteCapability(row)"
            >
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit Capability Dialog -->
    <el-dialog
      v-model="showAddCapabilityDialog"
      :title="editingCapability ? 'Edit Capability' : 'Add Capability'"
      width="700px"
      destroy-on-close
      @closed="resetCapabilityForm"
    >
      <el-form
        :model="capabilityForm"
        label-width="120px"
        ref="capabilityFormRef"
        :rules="capabilityRules"
      >
        <el-form-item label="Capability" prop="type">
          <el-select
            v-model="capabilityForm.type"
            placeholder="Select capability"
            :disabled="!!editingCapability"
          >
            <el-option label="Text to Speech" :value="'TEXT_TO_SPEECH'" />
            <el-option label="Speech to Text" :value="'SPEECH_TO_TEXT'" />
            <el-option label="Text Generation" :value="'TEXT_GENERATION'" />
            <el-option label="Image Generation" :value="'IMAGE_GENERATION'" />
          </el-select>
        </el-form-item>
        <el-form-item label="Configuration">
          <MonacoEditor
            v-if="showAddCapabilityDialog"
            v-model="configOptionsText"
            language="json"
            theme="vs-light"
            @change="
              (value: any) => {
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
        <el-form-item label="Default">
          <el-switch v-model="capabilityForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddCapabilityDialog = false">Cancel</el-button>
          <el-button type="primary" @click="saveCapability">
            {{ editingCapability ? "Update" : "Create" }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Edit, Delete, Plus } from "@element-plus/icons-vue";
import { useCapabilityStore } from "@/stores/capability.store";
import { CapabilityType } from "@/types/provider.types";
import type { Capability, AddCapabilityDto } from "@/types/provider.types";
import MonacoEditor from "@/components/common/MonacoEditor.vue";
import { showConfirm } from "@/utils/message-box.helper.ts";

const props = defineProps<{
  providerId: number;
}>();

const capabilityStore = useCapabilityStore();
const loading = ref(false);
const capabilities = ref<Capability[]>([]);

const showAddCapabilityDialog = ref(false);
const editingCapability = ref<Capability | null>(null);
const capabilityFormRef = ref<FormInstance>();
const capabilityForm = ref<AddCapabilityDto>({
  type: CapabilityType.TEXT_TO_SPEECH,
  configOptions: {},
  isDefault: false,
});
const configOptionsText = ref("{}");

const capabilityRules: FormRules = {
  type: [
    {
      required: true,
      message: "Please select a capability",
      trigger: "change",
    },
  ],
};

const editorContainer = ref<HTMLElement | null>(null);

onMounted(async () => {
  await fetchCapabilities();
});

async function fetchCapabilities() {
  loading.value = true;
  try {
    await capabilityStore.fetchCapabilities(props.providerId);
    capabilities.value = capabilityStore.capabilities;
  } catch (error) {
    ElMessage.error("Failed to load capabilities");
  } finally {
    loading.value = false;
  }
}

function formatCapabilityType(type: CapabilityType) {
  return type.replace(/_/g, " ");
}

const editCapability = (capability: Capability) => {
  editingCapability.value = capability;
  capabilityForm.value = {
    type: capability.type,
    configOptions: capability.configOptions,
    isDefault: capability.isDefault,
  };
  configOptionsText.value = capability.configOptions
    ? JSON.stringify(capability.configOptions, null, 2)
    : "{}";
  showAddCapabilityDialog.value = true;
};

const deleteCapability = async (capability: Capability) => {
  try {
    await showConfirm("Are you sure you want to delete this capability?", {
      title: "Warning",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    await capabilityStore.deleteCapability(capability.id);
    ElMessage.success("Capability deleted successfully");
    await fetchCapabilities();
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error("Failed to delete capability");
    }
  }
};

const saveCapability = async () => {
  if (!capabilityFormRef.value) return;

  await capabilityFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      let configOptions = {};
      try {
        configOptions = JSON.parse(configOptionsText.value);
      } catch (e) {
        ElMessage.error("Invalid JSON configuration");
        return;
      }

      capabilityForm.value.configOptions = configOptions;

      if (editingCapability.value) {
        await capabilityStore.updateCapability(editingCapability.value.id, {
          configOptions: capabilityForm.value.configOptions,
          isDefault: capabilityForm.value.isDefault,
        });
        ElMessage.success("Capability updated successfully");
      } else {
        await capabilityStore.createCapability(
          props.providerId,
          capabilityForm.value,
        );
        ElMessage.success("Capability created successfully");
      }

      showAddCapabilityDialog.value = false;
      resetCapabilityForm();
      await fetchCapabilities();
    } catch (error) {
      ElMessage.error("Failed to save capability");
    }
  });
};

const resetCapabilityForm = () => {
  capabilityForm.value = {
    type: CapabilityType.TEXT_TO_SPEECH,
    configOptions: {},
    isDefault: false,
  };
  configOptionsText.value = "{}";
  editingCapability.value = null;
  if (capabilityFormRef.value) {
    capabilityFormRef.value.resetFields();
  }
};

const setDefaultCapability = async (capability: Capability) => {
  try {
    await capabilityStore.updateCapability(capability.id, {
      isDefault: true,
    });
    ElMessage.success("Default capability set successfully");
    await fetchCapabilities();
  } catch (error) {
    ElMessage.error("Failed to set default capability");
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 4px;
  max-height: 100px;
  overflow-y: auto;
  font-size: 12px;
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
