<template>
  <div
    ref="editorContainer"
    class="monaco-editor-container"
    :style="{ height: height + 'px' }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import * as monaco from "monaco-editor";

const props = defineProps<{
  modelValue: string;
  language?: string;
  theme?: string;
  height?: number;
}>();

const emit = defineEmits(["update:modelValue", "change"]);

const editorContainer = ref<HTMLElement | null>(null);
let editor: monaco.editor.IStandaloneCodeEditor | null = null;

const initMonaco = () => {
  if (!editorContainer.value) return;

  if (editor) {
    editor.dispose();
    editor = null;
  }

  editor = monaco.editor.create(editorContainer.value, {
    value: props.modelValue,
    language: props.language || "json",
    theme: props.theme || "vs-light",
    minimap: { enabled: false },
    automaticLayout: true,
    scrollBeyondLastLine: false,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    lineNumbers: "on",
    folding: true,
    wordWrap: "on",
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
  });

  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() || "";
    emit("update:modelValue", value);
    emit("change", value);
  });
};

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor && newValue !== editor.getValue()) {
      editor.setValue(newValue);
    }
  },
  { immediate: true },
);

watch(
  () => props.language,
  () => {
    initMonaco();
  },
);

watch(
  () => props.theme,
  () => {
    if (editor) {
      monaco.editor.setTheme(props.theme || "vs-light");
    }
  },
);

onMounted(() => {
  initMonaco();
});

onBeforeUnmount(() => {
  if (editor) {
    editor.dispose();
    editor = null;
  }
});
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 300px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}
</style>
