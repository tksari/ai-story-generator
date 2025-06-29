import { EVENT_CHANNELS } from "@/constants/event";
import { io, Socket } from "socket.io-client";
import { ref } from "vue";

export class SocketService {
  private static instance: SocketService;
  public isConnected = ref(false);
  public socket: Socket | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public connect() {
    if (this.socket) return;

    this.socket = io(import.meta.env.VITE_API_URL || "http://localhost:3000", {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      this.isConnected.value = true;
    });

    this.socket.on("disconnect", () => {
      this.isConnected.value = false;
    });
  }

  public subscribeToRoom(roomId: number) {
    if (!this.socket) return;

    const emitJoin = () => {
      this.socket?.emit("join", EVENT_CHANNELS.STORY, roomId);
    };

    if (this.isConnected.value) {
      emitJoin();
    }

    this.socket.on("connect", emitJoin);
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = SocketService.getInstance();
