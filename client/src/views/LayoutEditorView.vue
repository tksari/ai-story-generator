<template>
  <div class="layout-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-select
          v-model="store.currentLayout"
          @change="handleLayoutChange"
          placeholder="Select Layout"
          class="layout-selector"
        >
          <el-option
            v-for="layout in store.layouts"
            :key="layout.id"
            :label="layout.name"
            :value="layout.id"
          >
            <span>{{ layout.name }}</span>
            <span class="layout-item-count"
              >({{ getLayoutItemCount(layout.id) }})</span
            >
            <el-tag
              v-if="layout.id.startsWith('layout-')"
              size="small"
              type="warning"
              class="unsaved-tag"
              >Not Saved</el-tag
            >
          </el-option>
        </el-select>
      </div>

      <div class="toolbar-right">
        <el-button-group>
          <el-button
            type="danger"
            @click="handleDeleteLayout(store.currentLayout)"
            :disabled="store.layouts.length <= 1"
            :icon="Delete"
            class="delete-layout-button"
          >
            Delete Layout
          </el-button>
          <el-button type="primary" @click="addNewLayout">
            <el-icon>
              <Plus />
            </el-icon>
            New Layout
          </el-button>
          <el-button type="success" @click="handleSave">
            <el-icon>
              <Download />
            </el-icon>
            Save
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="editor-content">
      <div class="items-panel">
        <h3>Items</h3>
        <div class="draggable-items">
          <div
            class="draggable-item"
            draggable="true"
            @dragstart="
              handleDragStart($event, {
                type: 'text',
                content: 'Sample Text',
                color: '#000000',
              })
            "
          >
            <el-icon>
              <Document />
            </el-icon>
            Text
          </div>
          <div
            class="draggable-item"
            draggable="true"
            @dragstart="handleDragStart($event, { type: 'image', content: '' })"
          >
            <el-icon>
              <Picture />
            </el-icon>
            Image
          </div>
        </div>

        <div class="properties-panel">
          <h4>Properties</h4>

          <div v-if="store.currentLayout" class="layout-properties">
            <h5>Layout Properties</h5>
            <el-form label-position="top" @submit.prevent>
              <el-form-item label="Layout Name">
                <el-input
                  v-model="currentLayoutName"
                  @change="updateCurrentLayoutName"
                  @blur="updateCurrentLayoutName"
                  placeholder="Enter layout name"
                />
              </el-form-item>
            </el-form>
          </div>

          <div v-if="selectedStoreItem" class="item-properties">
            <div class="properties-header">
              <h5>Item Properties ({{ selectedStoreItem.type }})</h5>
              <el-button
                type="danger"
                @click="handleDeleteItem"
                size="small"
                :icon="Delete"
                class="delete-button"
              >
                Delete
              </el-button>
            </div>
            <el-form label-position="top" @submit.prevent>
              <el-form-item
                label="Position X"
                v-if="selectedStoreItem.position"
              >
                <el-input-number
                  v-model="selectedStoreItem.position.x"
                  :min="0"
                  :max="
                    selectedStoreItem.type === 'image'
                      ? 800 - (selectedStoreItem.width || 200)
                      : 800
                  "
                  @change="
                    (val: number) =>
                      selectedItem !== null &&
                      selectedStoreItem &&
                      selectedStoreItem.position &&
                      handleItemMove(
                        selectedItem,
                        val,
                        selectedStoreItem.position.y,
                      )
                  "
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
              <el-form-item
                label="Position Y"
                v-if="selectedStoreItem.position"
              >
                <el-input-number
                  v-model="selectedStoreItem.position.y"
                  :min="0"
                  :max="
                    selectedStoreItem.type === 'image'
                      ? 450 - (selectedStoreItem.height || 200)
                      : 450
                  "
                  @change="
                    (val: number) =>
                      selectedItem !== null &&
                      selectedStoreItem &&
                      selectedStoreItem.position &&
                      handleItemMove(
                        selectedItem,
                        selectedStoreItem.position.x,
                        val,
                      )
                  "
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>

              <template>
                <el-form-item label="Width">
                  <el-input-number
                    v-model="selectedStoreItem.width"
                    @change="
                      (val: number) =>
                        selectedItem !== null &&
                        selectedStoreItem &&
                        handleItemResize(
                          selectedItem,
                          val,
                          selectedStoreItem.height || 200,
                        )
                    "
                    :min="20"
                    :max="
                      selectedStoreItem.position
                        ? 800 - selectedStoreItem.position.x
                        : 800
                    "
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="Height">
                  <el-input-number
                    v-model="selectedStoreItem.height"
                    @change="
                      (val: number) =>
                        selectedItem !== null &&
                        selectedStoreItem &&
                        handleItemResize(
                          selectedItem,
                          selectedStoreItem.width || 200,
                          val,
                        )
                    "
                    :min="20"
                    :max="
                      selectedStoreItem.position
                        ? 450 - selectedStoreItem.position.y
                        : 450
                    "
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
              </template>
              <template v-if="selectedStoreItem.type === 'text'">
                <el-form-item label="Text Content">
                  <el-input
                    v-model="selectedStoreItem.content"
                    @change="drawCanvas"
                  />
                </el-form-item>
                <el-form-item label="Text Color">
                  <el-color-picker
                    v-model="selectedStoreItem.color"
                    @change="
                      () => {
                        drawCanvas();
                      }
                    "
                    show-alpha
                    :predefine="predefinedColors"
                  />
                </el-form-item>
                <el-form-item label="Text Background Color">
                  <el-color-picker
                    v-model="selectedStoreItem.backgroundColor"
                    @change="
                      () => {
                        drawCanvas();
                      }
                    "
                    show-alpha
                    :predefine="predefinedColors"
                  />
                </el-form-item>
                <el-form-item label="Font Size">
                  <el-input-number
                    v-model="selectedStoreItem.fontSize"
                    :min="8"
                    :max="120"
                    @change="drawCanvas"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item label="Font Family">
                  <el-select
                    v-model="selectedStoreItem.fontFamily"
                    @change="drawCanvas"
                    placeholder="Select Font"
                  >
                    <el-option label="Arial" value="Arial" />
                    <el-option
                      label="Times New Roman"
                      value="Times New Roman"
                    />
                    <el-option label="Verdana" value="Verdana" />
                    <el-option label="Courier New" value="Courier New" />
                    <el-option label="Georgia" value="Georgia" />
                    <el-option label="Helvetica" value="Helvetica" />
                  </el-select>
                </el-form-item>
              </template>
            </el-form>
          </div>
          <div v-else class="placeholder-text">
            Select an item on the canvas to see its properties, or select a
            layout to edit its name.
          </div>
        </div>
      </div>

      <div class="canvas-container">
        <canvas
          ref="canvas"
          @mousedown="handleMouseDown"
          @drop="handleDrop"
          @dragover="handleDragOver"
          @mouseleave="handleMouseUp"
        >
          Your browser does not support the HTML5 canvas tag.
        </canvas>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import {
  Document,
  Picture,
  Delete,
  Plus,
  Download,
} from "@element-plus/icons-vue";
import { useLayoutEditorStore } from "@/stores/layout-editor";
import {
  useCanvas,
  CANVAS_CONFIG,
} from "@/composables/layout-editor/useCanvas";
import { useDragDrop } from "@/composables/layout-editor/useDragDrop";
import { useLayoutEditor } from "@/composables/layout-editor/useLayoutEditor";
import { useItems } from "@/composables/layout-editor/useItems";

const store = useLayoutEditorStore();

const {
  canvas,
  ctx,
  selectedItem,
  globalSelectedItemIndex,
  selectedStoreItem,
  handleItemSelect,
  handleItemResize,
  handleItemMove,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  drawCanvas,
  getGlobalIndex,
} = useCanvas();

const { handleDragStart, handleDrop, handleDragOver } = useDragDrop(
  canvas,
  ctx,
);

const {
  currentLayoutName,
  addNewLayout,
  handleSave,
  updateCurrentLayoutName,
  getLayoutItemCount,
  handleLayoutChange,
  handleDeleteLayout,
} = useLayoutEditor();

const { handleDeleteItem: deleteItem } = useItems();

const handleDeleteItem = async () => {
  await deleteItem(selectedItem, globalSelectedItemIndex, drawCanvas);
};

const predefinedColors = ref([
  "#ff4500",
  "#ff8c00",
  "#ffd700",
  "#90ee90",
  "#00ced1",
  "#1e90ff",
  "#c71585",
  "rgba(255, 69, 0, 0.68)",
  "rgb(255, 120, 0)",
  "hsv(51, 100, 98)",
  "hsva(120, 40, 94, 0.5)",
  "hsl(181, 100%, 37%)",
  "hsla(209, 100%, 56%, 0.73)",
  "#c7158577",
]);

watch(
  () => store.items,
  () => {
    drawCanvas();
  },
  { deep: true },
);

watch(selectedItem, (newLocalIndex) => {
  if (newLocalIndex === null) {
    globalSelectedItemIndex.value = null;
  } else {
    globalSelectedItemIndex.value = getGlobalIndex(newLocalIndex);
  }
});

watch(
  () => store.currentLayout,
  () => {
    handleItemSelect(null);
  },
  { immediate: true },
);

onMounted(async () => {
  if (canvas.value) {
    ctx.value = canvas.value.getContext("2d");
    canvas.value.width = CANVAS_CONFIG.WIDTH;
    canvas.value.height = CANVAS_CONFIG.HEIGHT;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    await store.loadFromService();

    addNewLayout(false);
    if (
      !store.currentLayout ||
      !store.layouts.find((l) => l.id === store.currentLayout)
    ) {
      if (store.layouts.length > 0) {
        store.setCurrentLayout(store.layouts[0].id);
      }
    }
  }
});

onUnmounted(() => {
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});
</script>
<style scoped>
.layout-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: #f8f9fa;
  padding: 10px;
  box-sizing: border-box;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 8px 10px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-light);
  border-radius: 4px;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-content {
  display: flex;
  gap: 15px;
  flex: 1;
  overflow: hidden;
}

.items-panel {
  width: 280px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

.items-panel h3,
.items-panel h4,
.items-panel h5 {
  margin-top: 0;
  margin-bottom: 10px;
}

.draggable-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.draggable-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  transition: background-color 0.2s ease;
}

.draggable-item:hover {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
}

.draggable-item:active {
  cursor: grabbing;
}

.canvas-container {
  display: block;
  justify-content: center;
  background: var(--el-bg-color-page);
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: auto;
}

canvas {
  background: #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: default;
  display: block;
}

.properties-panel {
  padding-top: 0;
  margin-top: 10px;
}

.properties-panel .el-form-item {
  margin-bottom: 12px;
}

.properties-panel .el-select {
  width: 100%;
}

.layout-properties,
.item-properties {
  padding: 10px;
  background-color: var(--el-fill-color-lighter);
  border-radius: 4px;
  margin-bottom: 15px;
}

.item-properties h5 {
  font-weight: bold;
}

.layout-selector {
  min-width: 220px;
}

.layout-item-count {
  margin-left: 8px;
  color: var(--el-text-color-placeholder);
  font-size: 0.85em;
}

.placeholder-text {
  padding: 15px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 0.9em;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
}

.properties-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.properties-header h5 {
  margin: 0;
}

.delete-button {
  margin-left: auto;
}

.delete-button:hover {
  background-color: var(--el-color-danger-light-3);
}

.delete-layout-button {
  margin-left: 10px;
}

.delete-layout-button:hover {
  background-color: var(--el-color-danger-light-3);
}
</style>
