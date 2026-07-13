import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@/modules/auth/strategies/jwt.strategy';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: JwtPayload;
}

const USER_ROOM_PREFIX = 'user:';

@WebSocketGateway({
  cors: {
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const envOrigins = process.env.CORS_ALLOWED_ORIGINS;
      const allowed = envOrigins
        ? envOrigins.split(',').map((o) => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001'];

      if (
        !requestOrigin ||
        allowed.includes(requestOrigin) ||
        allowed.includes('*')
      ) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly connectedClients = new Map<string, AuthenticatedSocket>();
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  afterInit(): void {
    this.logger.log('Khởi tạo WebSocket Gateway thành công');
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    const authorizationHeader = client.handshake.headers.authorization;
    const bearerToken = Array.isArray(authorizationHeader)
      ? authorizationHeader[0]
      : authorizationHeader;

    return (
      client.handshake.auth?.token ??
      bearerToken?.replace(/^Bearer\s+/i, '') ??
      null
    );
  }

  private getUserRoom(userId: string): string {
    return `${USER_ROOM_PREFIX}${userId}`;
  }

  private registerClient(client: AuthenticatedSocket): void {
    const userId = client.userId;

    if (!userId) {
      return;
    }

    this.connectedClients.set(client.id, client);

    const sockets = this.userSockets.get(userId) ?? new Set<string>();
    sockets.add(client.id);
    this.userSockets.set(userId, sockets);
  }

  private unregisterClient(client: AuthenticatedSocket): void {
    this.connectedClients.delete(client.id);

    if (!client.userId) {
      return;
    }

    const sockets = this.userSockets.get(client.userId);
    if (!sockets) {
      return;
    }

    sockets.delete(client.id);

    if (sockets.size === 0) {
      this.userSockets.delete(client.userId);
    }
  }

  private logConnectionStats(
    userId: string | undefined,
    socketId: string,
  ): void {
    this.logger.log(`User ${userId} đã kết nối (socket: ${socketId})`);
    this.logger.log(`Tổng số clients: ${this.connectedClients.size}`);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} kết nối không có token`);
        client.disconnect();
        return;
      }

      // Xác thực token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      client.userId = payload.sub;
      client.user = payload;

      this.registerClient(client);
      void client.join(this.getUserRoom(client.userId));
      this.logConnectionStats(client.userId, client.id);

      client.emit('connected', {
        userId: client.userId,
        socketId: client.id,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Lỗi không xác định';
      this.logger.error(
        `Xác thực thất bại cho client ${client.id}:`,
        errorMessage,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    this.unregisterClient(client);

    this.logger.log(`User ${userId} đã ngắt kết nối (socket: ${client.id})`);
    this.logger.log(`Tổng số clients: ${this.connectedClients.size}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: unknown,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): void {
    this.logger.log(
      `Tin nhắn từ user ${client.userId}: ${JSON.stringify(data)}`,
    );
    client.emit('message', { echo: data, userId: client.userId });
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await client.join(room);
    this.logger.log(`User ${client.userId} tham gia room: ${room}`);
    client.emit('joined-room', { room });
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): Promise<void> {
    await client.leave(room);
    this.logger.log(`User ${client.userId} rời khỏi room: ${room}`);
    client.emit('left-room', { room });
  }

  // Broadcast tới tất cả users đang kết nối
  broadcast(event: string, data: unknown): void {
    this.server.emit(event, data);
  }

  // Gửi tới room cụ thể
  sendToRoom(room: string, event: string, data: unknown): void {
    this.server.to(room).emit(event, data);
  }

  // Gửi tới user cụ thể (tất cả sockets của họ)
  sendToUser(userId: string, event: string, data: unknown): void {
    this.server.to(this.getUserRoom(userId)).emit(event, data);
  }

  // Gửi tới socket cụ thể
  sendToSocket(socketId: string, event: string, data: unknown): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.emit(event, data);
    }
  }

  // Kiểm tra user có online không
  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Lấy số lượng sockets của user
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size ?? 0;
  }

  // Lấy danh sách IDs của users đang online
  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Lấy số lượng clients đang kết nối
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Lấy số lượng users đang online
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }
}
