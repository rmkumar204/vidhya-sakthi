// Test script for the production messaging system
const WebSocket = require('ws');

class ProductionSystemTester {
  constructor(serverUrl = 'ws://localhost:1883') {
    this.serverUrl = serverUrl;
    this.clients = [];
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🧪 Starting Production System Tests...\n');

    try {
      await this.testWebSocketConnection();
      await this.testMessageExchange();
      await this.testCallSignaling();
      await this.testConnectionFlow();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      this.cleanup();
    }
  }

  async testWebSocketConnection() {
    console.log('🔌 Testing WebSocket Connection...');
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${this.serverUrl}?userId=test_user_1`);
      
      ws.on('open', () => {
        console.log('✅ WebSocket connection established');
        this.testResults.push({ test: 'WebSocket Connection', status: 'PASS' });
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        console.log('❌ WebSocket connection failed:', error.message);
        this.testResults.push({ test: 'WebSocket Connection', status: 'FAIL', error: error.message });
        reject(error);
      });
    });
  }

  async testMessageExchange() {
    console.log('💬 Testing Message Exchange...');
    
    return new Promise((resolve) => {
      const user1 = new WebSocket(`${this.serverUrl}?userId=test_user_1`);
      const user2 = new WebSocket(`${this.serverUrl}?userId=test_user_2`);
      
      let messagesReceived = 0;
      const expectedMessages = 2;
      
      const cleanup = () => {
        user1.close();
        user2.close();
        resolve();
      };
      
      user1.on('open', () => {
        user2.on('open', () => {
          // Send message from user1 to user2
          user1.send(JSON.stringify({
            type: 'message',
            payload: {
              chatId: 'test_chat',
              content: 'Hello from user 1',
              messageType: 'text'
            }
          }));
          
          // Send message from user2 to user1
          user2.send(JSON.stringify({
            type: 'message',
            payload: {
              chatId: 'test_chat',
              content: 'Hello from user 2',
              messageType: 'text'
            }
          }));
        });
      });
      
      user1.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'message') {
          messagesReceived++;
          console.log(`📨 User 1 received: ${message.payload.content}`);
        }
      });
      
      user2.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'message') {
          messagesReceived++;
          console.log(`📨 User 2 received: ${message.payload.content}`);
        }
      });
      
      // Wait for messages to be exchanged
      setTimeout(() => {
        if (messagesReceived >= expectedMessages) {
          console.log('✅ Message exchange successful');
          this.testResults.push({ test: 'Message Exchange', status: 'PASS' });
        } else {
          console.log('❌ Message exchange failed - not all messages received');
          this.testResults.push({ test: 'Message Exchange', status: 'FAIL', error: 'Not all messages received' });
        }
        cleanup();
      }, 2000);
    });
  }

  async testCallSignaling() {
    console.log('📞 Testing Call Signaling...');
    
    return new Promise((resolve) => {
      const caller = new WebSocket(`${this.serverUrl}?userId=caller`);
      const callee = new WebSocket(`${this.serverUrl}?userId=callee`);
      
      let callInitiated = false;
      let callAccepted = false;
      
      const cleanup = () => {
        caller.close();
        callee.close();
        resolve();
      };
      
      caller.on('open', () => {
        callee.on('open', () => {
          // Initiate call
          caller.send(JSON.stringify({
            type: 'call_initiate',
            payload: {
              callId: 'test_call_123',
              callType: 'audio',
              targetUserId: 'callee'
            }
          }));
        });
      });
      
      callee.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'call_initiate') {
          callInitiated = true;
          console.log('📞 Call initiated successfully');
          
          // Accept the call
          callee.send(JSON.stringify({
            type: 'call_accept',
            payload: {
              callId: 'test_call_123',
              targetUserId: 'caller'
            }
          }));
        }
      });
      
      caller.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'call_accept') {
          callAccepted = true;
          console.log('✅ Call accepted successfully');
        }
      });
      
      // Wait for call flow to complete
      setTimeout(() => {
        if (callInitiated && callAccepted) {
          console.log('✅ Call signaling successful');
          this.testResults.push({ test: 'Call Signaling', status: 'PASS' });
        } else {
          console.log('❌ Call signaling failed');
          this.testResults.push({ test: 'Call Signaling', status: 'FAIL', error: 'Call flow incomplete' });
        }
        cleanup();
      }, 3000);
    });
  }

  async testConnectionFlow() {
    console.log('🤝 Testing Connection Flow...');
    
    return new Promise((resolve) => {
      const mentor = new WebSocket(`${this.serverUrl}?userId=mentor`);
      const mentee = new WebSocket(`${this.serverUrl}?userId=mentee`);
      
      let requestSent = false;
      let requestReceived = false;
      let connectionAccepted = false;
      
      const cleanup = () => {
        mentor.close();
        mentee.close();
        resolve();
      };
      
      mentor.on('open', () => {
        mentee.on('open', () => {
          // Send connection request
          mentor.send(JSON.stringify({
            type: 'connection_request',
            payload: {
              connectionId: 'test_connection_123',
              mentorId: 'mentor',
              menteeId: 'mentee',
              projectId: 'test_project'
            }
          }));
          requestSent = true;
        });
      });
      
      mentee.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_request') {
          requestReceived = true;
          console.log('📨 Connection request received');
          
          // Accept the connection
          mentee.send(JSON.stringify({
            type: 'connection_accept',
            payload: {
              connectionId: 'test_connection_123',
              mentorId: 'mentor',
              menteeId: 'mentee'
            }
          }));
        }
      });
      
      mentor.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_accept') {
          connectionAccepted = true;
          console.log('✅ Connection accepted');
        }
      });
      
      // Wait for connection flow to complete
      setTimeout(() => {
        if (requestSent && requestReceived && connectionAccepted) {
          console.log('✅ Connection flow successful');
          this.testResults.push({ test: 'Connection Flow', status: 'PASS' });
        } else {
          console.log('❌ Connection flow failed');
          this.testResults.push({ test: 'Connection Flow', status: 'FAIL', error: 'Connection flow incomplete' });
        }
        cleanup();
      }, 3000);
    });
  }

  printResults() {
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      
      if (result.status === 'PASS') passed++;
      else failed++;
    });
    
    console.log('\n📈 Summary:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! Your production system is ready!');
    } else {
      console.log('\n⚠️ Some tests failed. Please check the server configuration.');
    }
  }

  cleanup() {
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
  }
}

// Run tests
const tester = new ProductionSystemTester();
tester.runAllTests().catch(console.error);
