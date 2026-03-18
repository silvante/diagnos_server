import { ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({
    cors: {
        origin: "*",
    },
})
export class ClientsGateway {
    @WebSocketServer()
    server: Server;

    sendNewClient(org_id: string, client: any) {
        this.server.to(`org-${org_id}`).emit("client-created", client)
    }

    sendUpdatedClient(org_id: string, client: any) {
        this.server.to(`org-${org_id}`).emit("client-updated", client)
    }

    sendDeletedClient(org_id: string, client_id: number) {
        this.server.to(`org-${org_id}`).emit("client-deleted", client_id)
    }


    @SubscribeMessage("join-org")
    handleJoinOrg(@ConnectedSocket() socket: Socket, org_id: string) {
        if (!org_id) {
            console.log(`Socket (${socket.id}) could not connect`);
            socket.emit("join-error", "No organization id provided");
            return;
        }

        const room = `org-${org_id}`;
        socket.join(room)
        console.log(`Socket ${socket.id} joined ${room}`);

        socket.emit("join-success", { room, message: `Successfully joined ${room}` });
    }
}
