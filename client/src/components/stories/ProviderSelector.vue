<template>
  <div class="provider-selector">
    <el-form-item label="Use Default Providers">
      <el-switch v-model="useDefaultProviders" @change="handleDefaultToggle" />
    </el-form-item>
    <div v-if="!useDefaultProviders && overrides" class="capability-providers">
      <el-collapse accordion>
        <el-collapse-item
          v-for="type in relevantCapabilityTypes"
          :key="type"
          :title="formatCapabilityType(type)"
          :name="type"
        >
          <div class="provider-select">
            <el-select
              v-model="overrides[type]"
              :placeholder="`Select ${formatCapabilityType(type)} provider`"
              filterable
              clearable
            >
              <el-option
                v-for="provider in providersWithCapability(type)"
                :key="provider.id"
                :label="provider.name"
                :value="provider.id"
              >
                <div class="provider-option">
                  <span>{{ provider.name }}</span>
                  <el-tag size="small" type="success" v-if="provider.isActive"
                    >Active</el-tag
                  >
                  <el-tag size="small" type="danger" v-else>Inactive</el-tag>
                </div>
              </el-option>
            </el-select>
            <div class="provider-info" v-if="overrides[type]">
              <span class="selected-provider"
                >Selected: {{ getProviderName(overrides[type]) }}</span
              >
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else class="default-providers-info">
      <p class="info-text">
        Using system default providers for all capabilities.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useProviderStore } from "@/stores/provider.store";
import { CapabilityType } from "@/types/provider.types";
import isEqual from "lodash/isEqual";

const props = defineProps<{
  modelValue: {
    overrides: Record<string, number> | null;
  };
  storyId?: number;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const providerStore = useProviderStore();

const overrides = ref<Record<string, number> | null>(
  props.modelValue?.overrides ?? null,
);

const useDefaultProviders = ref(overrides.value === null);

watch(useDefaultProviders, (newVal) => {
  if (newVal) {
    overrides.value = null;
  } else {
    overrides.value = {};
  }
});

const relevantCapabilityTypes = [
  CapabilityType.TEXT_GENERATION,
  CapabilityType.TEXT_TO_SPEECH,
  CapabilityType.IMAGE_GENERATION,
];

const formatCapabilityType = (type: string) => {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const providersWithCapability = (capabilityType: string) => {
  return providerStore.providers.filter((provider) =>
    provider.capabilities?.some((cap) => cap.type === capabilityType),
  );
};

const getProviderName = (providerId: number) => {
  const provider = providerStore.providers.find((p) => p.id === providerId);
  return provider ? provider.name : "Unknown";
};

watch(
  overrides,
  (newValue) => {
    if (!isEqual(newValue, props.modelValue?.overrides)) {
      emit("update:modelValue", {
        overrides: useDefaultProviders.value ? null : overrides.value,
      });
    }
  },
  { deep: true },
);

const handleDefaultToggle = () => {
  if (useDefaultProviders.value) {
    overrides.value = {};
  }
};

onMounted(async () => {
  if (providerStore.providers.length === 0) {
    await providerStore.fetchProviders(true);
  }
});
</script>

<style scoped>
.provider-selector {
  margin-bottom: 16px;
}

.capability-providers {
  margin-top: 16px;
}

.provider-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.provider-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.provider-info {
  margin-top: 8px;
  font-size: 0.9em;
  color: #606266;
}

.selected-provider {
  font-weight: 500;
}

.default-providers-info {
  margin-top: 16px;
  padding: 12px;
  background-color: #f0f9eb;
  border-radius: 4px;
  border-left: 4px solid #67c23a;
}

.info-text {
  margin: 0;
  color: #606266;
}
</style>
