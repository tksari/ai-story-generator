<template>
  <div class="provider-detail">
    <el-card v-loading="loading">
      <div class="header">
        <h2>{{ provider?.name || "Provider Details" }}</h2>
      </div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="Details" name="details">
          <div v-if="provider" class="details-content">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="Name">{{
                provider.name
              }}</el-descriptions-item>
              <el-descriptions-item label="Code">{{
                provider.code
              }}</el-descriptions-item>
              <el-descriptions-item label="Description">{{
                provider.description
              }}</el-descriptions-item>
              <el-descriptions-item label="Status">
                <el-tag :type="provider.isActive ? 'success' : 'danger'">
                  {{ provider.isActive ? "Active" : "Inactive" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="Created At">
                {{ new Date(provider.createdAt).toLocaleString() }}
              </el-descriptions-item>
              <el-descriptions-item label="Updated At">
                {{ new Date(provider.updatedAt).toLocaleString() }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Voices" name="voices">
          <ProviderVoices v-if="provider" :provider-id="provider.id" />
        </el-tab-pane>

        <el-tab-pane label="Capabilities" name="capabilities">
          <ProviderCapabilities v-if="provider" :provider-id="provider.id" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useProviderStore } from "@/stores/provider.store";
import type { Provider } from "@/types/provider.types";
import ProviderVoices from "@/components/providers/ProviderVoices.vue";
import ProviderCapabilities from "@/components/providers/ProviderCapabilities.vue";

const route = useRoute();
const router = useRouter();
const providerStore = useProviderStore();

const provider = ref<Provider | null>(null);
const loading = ref(false);
const activeTab = ref("details");

onMounted(async () => {
  const providerId = Number(route.params.id);
  if (isNaN(providerId)) {
    ElMessage.error("Invalid provider ID");
    router.push("/providers");
    return;
  }

  await fetchProvider(providerId);
});

async function fetchProvider(id: number) {
  loading.value = true;
  try {
    await providerStore.fetchProviderById(id);
    provider.value = providerStore.currentProvider;
  } catch (error) {
    ElMessage.error("Failed to load provider details");
    router.push("/providers");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.provider-detail {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.actions {
  display: flex;
  gap: 10px;
}

.details-content {
  margin-top: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
