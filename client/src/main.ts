import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "element-plus/dist/index.css";
import "./assets/styles/main.css";
import App from "./App.vue";
import router from "./router";
import { useSettingsStore } from "./stores/settings.store";

const app = createApp(App);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.use(ElementPlus, {
  size: "default",
  zIndex: 3000,
});

const settingsStore = useSettingsStore();
settingsStore.fetchSettings();

app.mount("#app");
