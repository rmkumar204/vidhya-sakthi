# ConnectSphere Signaling Server

A WebSocket-based signaling server for real-time chat and WebRTC communication in ConnectSphere.

## Features

- Real-time chat messaging
- Typing indicators
- WebRTC signaling for video/audio calls
- User presence management
- CORS support for cross-origin requests

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run the Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on port 1883 by default. You can change this by setting the `PORT` environment variable.

### Environment Variables

- `PORT`: Server port (default: 1883)

## API

### WebSocket Connection

Connect to the server using:
```
ws://localhost:1883?userId=<your-user-id>
```

### Message Types

#### Chat Messages
```json
{
  "type": "message",
  "payload": {
    "chatId": "chat-123",
    "content": "Hello!",
    "type": "text"
  }
}
```

#### Typing Indicators
```json
{
  "type": "typing",
  "payload": {
    "chatId": "chat-123",
    "isTyping": true
  }
}
```

#### WebRTC Signaling
```json
{
  "type": "call_offer",
  "to": "user-456",
  "payload": {
    "offer": "<sdp-offer>",
    "callType": "video"
  }
}
```

## Deployment

This server can be deployed to any Node.js hosting platform:

- Heroku
- Railway
- DigitalOcean App Platform
- AWS EC2
- Google Cloud Run

Make sure to configure the WebSocket URL in your client application to point to the deployed server.