const WebSocket = require('ws');
const http = require('http');
const url = require('url');

class SignalingServer {
    constructor(port = 8080) {
        this.port = port;
        this.clients = new Map(); // userId -> WebSocket
        this.rooms = new Map(); // roomId -> Set of userIds
        this.server = null;
        this.wss = null;
    }

    start() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });

        this.wss.on('connection', (ws, request) => {
            const query = url.parse(request.url, true).query;
            const userId = query.userId;

            if (!userId) {
                ws.close(1008, 'User ID required');
                return;
            }

            console.log(`User ${userId} connected`);
            this.clients.set(userId, ws);

            // Send connection confirmation
            ws.send(JSON.stringify({
                type: 'connection_established',
                userId,
                timestamp: Date.now()
            }));

            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMessage(userId, message);
                } catch (error) {
                    console.error('Error parsing message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Invalid message format'
                    }));
                }
            });

            ws.on('close', () => {
                console.log(`User ${userId} disconnected`);
                this.clients.delete(userId);
                this.removeUserFromAllRooms(userId);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for user ${userId}:`, error);
            });
        });

        this.server.listen(this.port, () => {
            console.log(`Signaling server running on port ${this.port}`);
        });
    }

    handleMessage(fromUserId, message) {
        console.log(`Message from ${fromUserId}:`, message.type);

        switch (message.type) {
            case 'call_initiate':
                this.handleCallInitiate(fromUserId, message);
                break;
            case 'call_accept':
                this.handleCallAccept(fromUserId, message);
                break;
            case 'call_reject':
                this.handleCallReject(fromUserId, message);
                break;
            case 'call_end':
                this.handleCallEnd(fromUserId, message);
                break;
            case 'offer':
                this.handleOffer(fromUserId, message);
                break;
            case 'answer':
                this.handleAnswer(fromUserId, message);
                break;
            case 'ice_candidate':
                this.handleIceCandidate(fromUserId, message);
                break;
            case 'join_room':
                this.handleJoinRoom(fromUserId, message);
                break;
            case 'leave_room':
                this.handleLeaveRoom(fromUserId, message);
                break;
            default:
                console.log(`Unknown message type: ${message.type}`);
        }
    }

    handleCallInitiate(fromUserId, message) {
        const { to, callId, callType, roomId } = message;

        // Create room if it doesn't exist
        if (roomId && !this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        // Add participants to room
        if (roomId) {
            this.rooms.get(roomId).add(fromUserId);
            this.rooms.get(roomId).add(to);
        }

        // Forward call initiation to target user
        const targetWs = this.clients.get(to);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
                type: 'call_initiate',
                from: fromUserId,
                callId,
                callType,
                roomId,
                timestamp: Date.now()
            }));
        } else {
            // User not available
            this.sendToUser(fromUserId, {
                type: 'call_failed',
                callId,
                reason: 'User not available'
            });
        }
    }

    handleCallAccept(fromUserId, message) {
        const { to, callId, roomId } = message;

        // Notify caller that call was accepted
        this.sendToUser(to, {
            type: 'call_accepted',
            from: fromUserId,
            callId,
            roomId,
            timestamp: Date.now()
        });
    }

    handleCallReject(fromUserId, message) {
        const { to, callId } = message;

        // Notify caller that call was rejected
        this.sendToUser(to, {
            type: 'call_rejected',
            from: fromUserId,
            callId,
            timestamp: Date.now()
        });
    }

    handleCallEnd(fromUserId, message) {
        const { to, callId, roomId } = message;

        // Notify all participants in the room
        if (roomId && this.rooms.has(roomId)) {
            const roomParticipants = this.rooms.get(roomId);
            roomParticipants.forEach(participantId => {
                if (participantId !== fromUserId) {
                    this.sendToUser(participantId, {
                        type: 'call_ended',
                        from: fromUserId,
                        callId,
                        roomId,
                        timestamp: Date.now()
                    });
                }
            });
            this.rooms.delete(roomId);
        } else if (to) {
            // Direct call
            this.sendToUser(to, {
                type: 'call_ended',
                from: fromUserId,
                callId,
                timestamp: Date.now()
            });
        }
    }

    handleOffer(fromUserId, message) {
        const { to, callId, offer } = message;

        // Forward offer to target user
        this.sendToUser(to, {
            type: 'offer',
            from: fromUserId,
            callId,
            offer,
            timestamp: Date.now()
        });
    }

    handleAnswer(fromUserId, message) {
        const { to, callId, answer } = message;

        // Forward answer to target user
        this.sendToUser(to, {
            type: 'answer',
            from: fromUserId,
            callId,
            answer,
            timestamp: Date.now()
        });
    }

    handleIceCandidate(fromUserId, message) {
        const { to, callId, candidate } = message;

        // Forward ICE candidate to target user
        this.sendToUser(to, {
            type: 'ice_candidate',
            from: fromUserId,
            callId,
            candidate,
            timestamp: Date.now()
        });
    }

    handleJoinRoom(fromUserId, message) {
        const { roomId } = message;

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        this.rooms.get(roomId).add(fromUserId);

        // Notify other participants in the room
        const roomParticipants = this.rooms.get(roomId);
        roomParticipants.forEach(participantId => {
            if (participantId !== fromUserId) {
                this.sendToUser(participantId, {
                    type: 'user_joined',
                    from: fromUserId,
                    roomId,
                    timestamp: Date.now()
                });
            }
        });
    }

    handleLeaveRoom(fromUserId, message) {
        const { roomId } = message;

        if (this.rooms.has(roomId)) {
            this.rooms.get(roomId).delete(fromUserId);

            // Notify other participants
            const roomParticipants = this.rooms.get(roomId);
            roomParticipants.forEach(participantId => {
                this.sendToUser(participantId, {
                    type: 'user_left',
                    from: fromUserId,
                    roomId,
                    timestamp: Date.now()
                });
            });

            // Clean up empty rooms
            if (roomParticipants.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    sendToUser(userId, message) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        } else {
            console.log(`User ${userId} not available for message:`, message.type);
        }
    }

    removeUserFromAllRooms(userId) {
        this.rooms.forEach((participants, roomId) => {
            if (participants.has(userId)) {
                participants.delete(userId);

                // Notify other participants
                participants.forEach(participantId => {
                    this.sendToUser(participantId, {
                        type: 'user_left',
                        from: userId,
                        roomId,
                        timestamp: Date.now()
                    });
                });

                // Clean up empty rooms
                if (participants.size === 0) {
                    this.rooms.delete(roomId);
                }
            }
        });
    }

    stop() {
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            this.server.close();
        }
    }
}

// Start the server
const signalingServer = new SignalingServer(8080);
signalingServer.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down signaling server...');
    signalingServer.stop();
    process.exit(0);
});

module.exports = SignalingServer;