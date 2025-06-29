import {
  ElMessageBox,
  ElMessageBoxOptions,
  MessageBoxData,
} from "element-plus";

export interface ConfirmOptions extends ElMessageBoxOptions {
  title?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  type?: "warning" | "error" | "success" | "info";
}

export function showConfirm(
  message: string,
  {
    title = "Are you sure?",
    confirmButtonText = "Yes",
    cancelButtonText = "Cancel",
    type = "warning",
    ...rest
  }: ConfirmOptions = {},
): Promise<MessageBoxData> {
  return ElMessageBox.confirm(message, title, {
    confirmButtonText,
    cancelButtonText,
    type,
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    ...rest,
  });
}

export interface AlertOptions extends ElMessageBoxOptions {
  title?: string;
  confirmButtonText?: string;
  type?: "warning" | "error" | "success" | "info";
}

export function showAlert(
  message: string,
  {
    title = "Info",
    confirmButtonText = "OK",
    type = "info",
    ...rest
  }: AlertOptions = {},
): Promise<MessageBoxData> {
  return ElMessageBox.alert(message, title, {
    confirmButtonText,
    type,
    showClose: true,
    closeOnClickModal: true,
    closeOnPressEscape: true,
    ...rest,
  });
}
