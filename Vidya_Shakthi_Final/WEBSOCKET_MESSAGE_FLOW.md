# WebSocket Message Flow Documentation

## Call Reject Flow

### Message Types and Their Purposes:

#### 1. `call_reject` (WebSocket Message)
- **Direction**: Client → Server
- **Sent by**: useCallSignaling hook when WebRTC service emits 'call_rejected'
- **Received by**: Server's `handleCallReject` method
- **Purpose**: Notify server that a call was rejected by the receiver
- **Payload**: `{ callId, toUserId, fromUserId }`

#### 2. `call_rejected` (WebSocket Message)
- **Direction**: Server → Client
- **Sent by**: Server's `handleCallReject` method
- **Received by**: AppWithCalls component + useCallSignaling hook
- **Purpose**: Notify the requestor that their call was rejected
- **Payload**: `{ callId, fromUserId, timestamp }`

#### 3. `call_rejected` (WebRTC Service Event)
- **Direction**: Internal (WebRTC Service → useCallSignaling)
- **Emitted by**: WebRTC service when `rejectCall()` is called
- **Received by**: useCallSignaling hook's `handleCallRejected` function
- **Purpose**: Trigger sending of `call_reject` WebSocket message
- **Payload**: `{ callId, fromUserId }`

## Complete Call Reject Flow:

1. **User B clicks reject** → `rejectCall()` called in useCallSignaling
2. **WebRTC service emits** → `call_rejected` event (internal)
3. **useCallSignaling receives** → `handleCallRejected` function
4. **useCallSignaling sends** → `call_reject` WebSocket message to server
5. **Server processes** → `handleCallReject()` method
6. **Server sends** → `call_rejected` WebSocket message to User A
7. **User A receives** → AppWithCalls `handleCallRejected` + useCallSignaling `handleCallReject`

## Message Type Summary:

| Message Type | Direction | Purpose | Handler |
|-------------|-----------|---------|---------|
| `call_reject` | Client → Server | Notify server of rejection | Server: `handleCallReject` |
| `call_rejected` | Server → Client | Notify requestor of rejection | Client: `handleCallRejected` (AppWithCalls) + `handleCallReject` (useCallSignaling) |
| `call_rejected` | Internal Event | Trigger WebSocket message | useCallSignaling: `handleCallRejected` |

## Key Differences:

- **`call_reject`**: Outgoing WebSocket message from client to server
- **`call_rejected`**: Incoming WebSocket message from server to client
- **`call_rejected`**: Internal WebRTC service event (same name, different context)

The naming convention follows:
- **`call_reject`**: Action being performed (rejecting a call)
- **`call_rejected`**: Result/notification (call was rejected)
