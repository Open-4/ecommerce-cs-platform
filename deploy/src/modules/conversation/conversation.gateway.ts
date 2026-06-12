// @ts-nocheck
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { ConversationService } from "./conversation.service";

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  },
  namespace: "/conversations",
})
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  /** 用户 ID -> Socket 映射 */
  private userSockets = new Map<string, Set<string>>();

  constructor(private readonly conversationService: ConversationService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.trackUserSocket(userId, client.id);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.untrackUserSocket(userId, client.id);
    }
  }

  /** 加入会话房间 */
  @SubscribeMessage("join_conversation")
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`);
    return { success: true, room: `conversation:${data.conversationId}` };
  }

  /** 离开会话房间 */
  @SubscribeMessage("leave_conversation")
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  /** 发送消息 */
  @SubscribeMessage("send_message")
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
      contentType?: string;
    },
  ) {
    const message = await this.conversationService.saveMessage({
      conversationId: data.conversationId,
      direction: "outbound",
      senderType: "human",
      contentType: data.contentType ?? "text",
      content: data.content,
    });

    // 广播给房间内的所有用户
    this.server
      .to(`conversation:${data.conversationId}`)
      .emit("new_message", message);

    return message;
  }

  /** 推送新消息到指定会话 */
  notifyNewMessage(conversationId: string, message: unknown) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit("new_message", message);
  }

  /** 推送 AI 建议 */
  notifyAiSuggestion(
    conversationId: string,
    data: { suggestion: string; confidence: number; needsHumanReview?: boolean },
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit("ai_suggestion", data);
  }

  /** 通知 AI 处理状态 */
  notifyAiStatus(
    conversationId: string,
    status: "start" | "end" | "error",
  ) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit(
        status === "start"
          ? "ai_processing_start"
          : status === "end"
            ? "ai_processing_end"
            : "ai_processing_error",
      );
  }

  /** 推送给指定用户 */
  notifyUser(userId: string, event: string, data: unknown) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  private trackUserSocket(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private untrackUserSocket(userId: string, socketId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }
}
