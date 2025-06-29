import mitt from "mitt";
import type { EventType } from "./event-types.ts";

interface AppEventMap {
  [key: string | symbol]: any;
}

export const emitter = mitt<AppEventMap>();

export function emitEvent<T = any>(type: EventType, payload: T) {
  emitter.emit(type, payload);
}

export function onEvent<T = any>(
  type: EventType,
  callback: (payload: T) => void,
) {
  emitter.on(type, callback);
}

export function offEvent(type: EventType) {
  emitter.off(type);
}
