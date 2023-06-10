import {
  WebSocketGateway,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { AuthSocket, WSAuthMiddleware } from './middlewares/ws-auth.middleware';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  afterInit(server: Server) {
    const middle = WSAuthMiddleware(this.jwtService, this.userService)
    server.use(middle)
    console.log('Chat gateway initialized');
  }

  async handleConnection(client: AuthSocket, ...args: any[]) {
    this.chatService.saveUserSocketId(client.user.id, client.id);
    console.log(client.user.id);
    
    const data = await this.chatService.getUserMessages(client.user.id);
    console.log(data);
    
    
    this.server.to(client.id).emit('getPreviousMessages', data);
  }
  
  handleDisconnect(client: AuthSocket) {    
    console.log(`Disconnected: ${client.id}`);
    this.chatService.removeUserSocketId(client.user.id);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage( client: AuthSocket, payload: CreateMessageDto): Promise<void> {

    const { recipient, text } = payload;

    //STEP 1: save on db
    await this.chatService.createMessage({
      sender: client.user.id,
      recipient,
      text,
      sentAt: new Date()
    });
    
    //STEP 2: verify if recipient is online and catch its socketid  send to related recipient sockeid
    const recipientSocketId = this.chatService.getUserSocketId(recipient);

    if (recipientSocketId) {
      // IF Recipient is online, send the message directly to their socket
      this.server.to(recipientSocketId).emit('receiveMessage', {
        ...payload,
        sender: client.user.id
      });
    } else {
      // STEP 3: Recipient is offline, but message is saved on database
    }
  }
}
