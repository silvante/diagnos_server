import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: "*",
    },
    transports: ['websocket']
})
export class ClientsGateway {
    @WebSocketServer()
    server: Server;

    sendNewClient(org_id: string, client: any, event_owner_id: number) {
        this.server.to(`org-${org_id}`).emit("client-created", {client: client, event_owner: event_owner_id})
    }

    sendUpdatedClient(org_id: string, client: any, event_owner_id: number) {
        this.server.to(`org-${org_id}`).emit("client-updated", {client: client, event_owner: event_owner_id})
    }

    sendDeletedClient(org_id: string, client: any, event_owner_id: number) {
        this.server.to(`org-${org_id}`).emit("client-deleted", {client: client, event_owner: event_owner_id})
    }

    @SubscribeMessage("join-org")
    handleJoinOrg(@ConnectedSocket() socket: Socket, @MessageBody() org_id: any) {
        if (!org_id) {
            console.log(`>> Socket (${socket.id}) could not connect`);
            socket.emit("join-error", "No organization id provided");
            return;
        }

        const room = `org-${org_id}`;
        socket.join(room)
        console.log(`>> Socket ID: "${socket.id}" >> Joined ROOM: "${room}"`);

        socket.emit("join-success", { room, message: `Successfully joined ${room}` });
    }
}
