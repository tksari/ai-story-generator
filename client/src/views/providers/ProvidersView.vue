<template>
  <div class="providers">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h2>Providers</h2>
            <el-switch
              v-model="showInactive"
              active-text="Show Inactive"
              class="ml-4"
            />
          </div>
          <el-button type="primary" @click="showCreateDialog = true">
            Add Provider
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="filteredProviders"
        style="width: 100%"
      >
        <el-table-column prop="name" label="Name" />
        <el-table-column prop="code" label="Code" width="120" />
        <el-table-column
          prop="description"
          label="Description"
          show-overflow-tooltip
        />
        <el-table-column prop="isActive" label="Status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? "Active" : "Inactive" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Capabilities" width="180">
          <template #default="{ row }">
            <div class="capability-tags">
              <el-tag
                v-for="cap in row.capabilities"
                :key="cap.id"
                type="info"
                size="small"
                class="capability-tag"
              >
                {{ formatCapabilityType(cap.type) }}
              </el-tag>
              <span v-if="!row.capabilities || row.capabilities.length === 0">
                No capabilities
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="180" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-tooltip content="View Details" placement="top">
                <el-button
                  type="info"
                  :icon="View"
                  circle
                  @click="handleView(row)"
                />
              </el-tooltip>
              <el-tooltip content="Edit Provider" placement="top">
                <el-button
                  type="primary"
                  :icon="Edit"
                  circle
                  @click="handleEdit(row)"
                />
              </el-tooltip>
              <el-tooltip content="Delete Provider" placement="top">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  @click="handleDelete(row)"
                />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create/Edit Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingProvider ? 'Edit Provider' : 'Add Provider'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="providerForm"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="Name" prop="name">
          <el-input v-model="providerForm.name" />
        </el-form-item>
        <el-form-item label="Code" prop="code">
          <el-input v-model="providerForm.code" :disabled="!!editingProvider" />
        </el-form-item>
        <el-form-item label="Description" prop="description">
          <el-input
            v-model="providerForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="API Key" prop="apiKey">
          <el-input v-model="providerForm.apiKey" show-password />
        </el-form-item>
        <el-form-item label="API Endpoint" prop="apiEndpoint">
          <el-input v-model="providerForm.apiEndpoint" />
        </el-form-item>
        <el-form-item label="Region" prop="region">
          <el-input v-model="providerForm.region" />
        </el-form-item>
        <el-form-item label="Status">
          <el-switch v-model="providerForm.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">Cancel</el-button>
          <el-button type="primary" @click="handleSave">
            {{ editingProvider ? "Update" : "Create" }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog v-model="showDeleteDialog" title="Delete Provider" width="400px">
      <p>Are you sure you want to delete this provider?</p>
      <p class="text-danger">This action cannot be undone.</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDeleteDialog = false">Cancel</el-button>
          <el-button type="danger" @click="confirmDelete"> Delete </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { useProviderStore } from "../../stores/provider.store";
import type {
  Provider,
  CreateProviderDto,
  CapabilityType,
} from "../../types/provider.types";
import { Edit, Delete, View } from "@element-plus/icons-vue";

const router = useRouter();
const providerStore = useProviderStore();
const loading = ref(false);
const showInactive = ref(false);
const showCreateDialog = ref(false);
const showDeleteDialog = ref(false);
const editingProvider = ref<Provider | null>(null);
const providerToDelete = ref<Provider | null>(null);

const formRef = ref<FormInstance>();
const providerForm = ref<CreateProviderDto>({
  name: "",
  code: "",
  description: "",
  isActive: true,
  apiKey: "",
  apiEndpoint: "",
  region: "",
});

const rules: FormRules = {
  name: [
    { required: true, message: "Please enter provider name", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "Length should be 2 to 50 characters",
      trigger: "blur",
    },
  ],
  code: [
    { required: true, message: "Please enter provider code", trigger: "blur" },
    {
      min: 2,
      max: 20,
      message: "Length should be 2 to 20 characters",
      trigger: "blur",
    },
  ],
  description: [
    {
      max: 500,
      message: "Description cannot exceed 500 characters",
      trigger: "blur",
    },
  ],
  apiKey: [
    { required: true, message: "Please enter API key", trigger: "blur" },
  ],
  apiEndpoint: [
    { required: true, message: "Please enter API endpoint", trigger: "blur" },
  ],
};

const filteredProviders = computed(() => {
  if (showInactive.value) {
    return providerStore.providers;
  }
  return providerStore.activeProviders;
});

function formatCapabilityType(type: CapabilityType) {
  return type.replace(/_/g, " ");
}

function resetForm() {
  providerForm.value = {
    name: "",
    code: "",
    description: "",
    isActive: true,
    apiKey: "",
    apiEndpoint: "",
    region: "",
  };
  editingProvider.value = null;
  if (formRef.value) {
    formRef.value.resetFields();
  }
}

function handleView(provider: Provider) {
  router.push(`/providers/${provider.id}`);
}

function handleEdit(provider: Provider) {
  editingProvider.value = provider;
  providerForm.value = {
    name: provider.name,
    code: provider.code,
    description: provider.description || "",
    isActive: provider.isActive,
    apiKey: provider.apiKey || "",
    apiEndpoint: provider.apiEndpoint || "",
    region: provider.region || "",
  };
  showCreateDialog.value = true;
}

function handleDelete(provider: Provider) {
  providerToDelete.value = provider;
  showDeleteDialog.value = true;
}

async function handleSave() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingProvider.value) {
          await providerStore.updateProvider(
            editingProvider.value.id,
            providerForm.value,
          );
          ElMessage.success("Provider updated successfully");
        } else {
          await providerStore.createProvider(providerForm.value);
          ElMessage.success("Provider created successfully");
        }
        showCreateDialog.value = false;
        resetForm();
      } catch (error) {
        ElMessage.error("Failed to save provider");
      }
    }
  });
}

async function confirmDelete() {
  if (!providerToDelete.value) return;

  try {
    await providerStore.deleteProvider(providerToDelete.value.id);
    ElMessage.success("Provider deleted successfully");
    showDeleteDialog.value = false;
    providerToDelete.value = null;
  } catch (error) {
    ElMessage.error("Failed to delete provider");
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    await providerStore.fetchProviders(true);
  } catch (error) {
    ElMessage.error("Failed to fetch providers");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.providers {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-left h2 {
  margin: 0;
}

.ml-4 {
  margin-left: 1rem;
}

.text-danger {
  color: var(--el-color-danger);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .el-button {
  padding: 6px;
}

.action-buttons .el-button :deep(svg) {
  width: 16px;
  height: 16px;
}

.capability-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.capability-tag {
  margin: 2px;
}
</style>
