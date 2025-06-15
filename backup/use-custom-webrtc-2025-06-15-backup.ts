// 🚀 CUSTOM WEBRTC: Direct WebRTC using our WebSocket server for signaling
// Replaces unreliable PeerJS cloud service with rock-solid custom implementation
// Uses our WebSocket server for offer/answer/ICE exchange

import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';