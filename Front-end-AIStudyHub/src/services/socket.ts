import { io, Socket } from "socket.io-client";

const API_ORIGIN = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SOCKET_URL = API_ORIGIN.replace(/\/api$/, "") || "http://localhost:4000";

let socket: Socket | null = null;

export interface UploadProgressSocketPayload {
  documentId: string;
  uploadSessionId?: string;
  versionId?: string;
  status: "processing" | "completed" | "failed";
  step: string;
  progress: number;
  message: string;
  processedChunks?: number;
  totalChunks?: number;
  currentBatch?: number;
  totalBatches?: number;
}

export function getUploadProgressSocket(): Socket {
  if (!socket) {
    console.log(`[Upload Debug] Initializing Socket.IO connection to: ${SOCKET_URL}`);
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log(`[Upload Debug] Socket.IO Connected successfully! Socket ID: ${socket?.id}`);
    });

    socket.on("connect_error", (error) => {
      console.warn(`[Upload Debug] Socket.IO Connection error to ${SOCKET_URL}:`, error.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn(`[Upload Debug] Socket.IO Disconnected. Reason:`, reason);
    });
  }

  if (!socket.connected) {
    console.log("[Upload Debug] Socket not connected yet, calling socket.connect()...");
    socket.connect();
  }

  return socket;
}

export function subscribeToUploadSession(
  uploadSessionId: string,
  onProgress: (payload: UploadProgressSocketPayload) => void,
): () => void {
  const skt = getUploadProgressSocket();

  const joinRoom = () => {
    console.log(`[Upload Debug] Emitting join:upload-session for room: "upload-session:${uploadSessionId}"`);
    skt.emit("join:upload-session", uploadSessionId);
  };

  joinRoom();
  skt.on("connect", joinRoom);

  const handler = (payload: UploadProgressSocketPayload) => {
    if (payload.uploadSessionId === uploadSessionId) {
      console.log(`[Upload Debug] Socket Event Received [upload-session:${uploadSessionId}]`, {
        step: payload.step,
        progress: payload.progress,
        status: payload.status,
        message: payload.message,
        processedChunks: payload.processedChunks,
        totalChunks: payload.totalChunks,
      });
      onProgress(payload);
    }
  };

  skt.on("upload:progress", handler);

  return () => {
    console.log(`[Upload Debug] Unsubscribing socket listener for upload-session:${uploadSessionId}`);
    skt.off("connect", joinRoom);
    skt.off("upload:progress", handler);
  };
}
