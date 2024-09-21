"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const wss = new ws_1.WebSocketServer({ port: 8080 });
let senderSocket = null;
let receiverSocket = null;
wss.on('connection', function connection(ws) {
    console.log('Client connected');
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
    ws.on('message', function message(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);
            if (message.type === 'sender') {
                senderSocket = ws;
                ws.send('Sender socket registered.');
            }
            else if (message.type === 'receiver') {
                receiverSocket = ws;
                ws.send('Receiver socket registered.');
            }
        }
        catch (e) {
            console.error('Invalid message format', e);
            ws.send('Error: Invalid message format');
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
    ws.send('Welcome! Connection established.');
});
