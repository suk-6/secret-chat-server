import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor() {}

  @WebSocketServer()
  server: Server;

  connectedClients: string[] = [];

  getOpponentIds(myId: string): string[] {
    const opponentIds = this.connectedClients.filter((id) => id !== myId);

    if (!opponentIds) throw new Error('Opponent not found');
    return opponentIds;
  }

  handleConnection(client: Socket): void {
    this.connectedClients.push(client.id);
    this.sendMessageToOpponents(
      `New user connected: ${client.handshake.address}`,
      client.id,
    );
    console.log('User Connected:', client.id, client.handshake.address);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients = this.connectedClients.filter(
      (id) => id !== client.id,
    );
    console.log('Connected Clients: ', this.connectedClients);
  }

  @SubscribeMessage('send')
  async handleMessage(client: Socket, message: string): Promise<void> {
    this.sendMessageToOpponents(message, client.id);
  }

  sendMessageToOpponents(message: string, myId: string): void {
    const opponentIds = this.getOpponentIds(myId);
    opponentIds.forEach((id) => {
      this.server.to(id).emit('receive', message);
    });
  }
}
