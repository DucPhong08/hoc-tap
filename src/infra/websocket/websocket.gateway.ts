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
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: JwtPayload;
}

@WebSocketGateway({
  cors: {
    origin: '*',
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
  private connectedClients = new Map<string, AuthenticatedSocket>();
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('Khởi tạo WebSocket Gateway thành công');
  }

  private extractToken(client: AuthenticatedSocket): string | null {
    return (
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '') ||
      null
    );
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Lấy token từ handshake
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

      // Lưu kết nối
      this.connectedClients.set(client.id, client);

      // Theo dõi sockets của user
      if (!this.userSockets.has(client.userId)) {
        this.userSockets.set(client.userId, new Set());
      }
      this.userSockets.get(client.userId)!.add(client.id);

      // Tham gia room cá nhân của user
      void client.join(`user:${client.userId}`);

      this.logger.log(
        `User ${client.userId} đã kết nối (socket: ${client.id})`,
      );
      this.logger.log(`Tổng số clients: ${this.connectedClients.size}`);

      // Thông báo cho user
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

    // Xóa khỏi danh sách clients đang kết nối
    this.connectedClients.delete(client.id);

    // Xóa khỏi sockets của user
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }

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
    this.server.to(`user:${userId}`).emit(event, data);
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
    return this.userSockets.get(userId)?.size || 0;
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
