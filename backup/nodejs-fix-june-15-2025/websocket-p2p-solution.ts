// Custom WebRTC P2P using your reliable WebSocket server
// This replaces unreliable PeerJS cloud service

export class WebSocketP2P {
  private socket: any;
  private peerConnections = new Map<string, RTCPeerConnection>();
  private localStream: MediaStream | null = null;
  
  constructor(webSocketUrl: string) {
    this.socket = io(webSocketUrl);
    this.setupSignaling();
  }

  private setupSignaling() {
    // Use your existing WebSocket for WebRTC signaling
    this.socket.on('webrtc-offer', this.handleOffer.bind(this));
    this.socket.on('webrtc-answer', this.handleAnswer.bind(this));
    this.socket.on('webrtc-ice-candidate', this.handleIceCandidate.bind(this));
    this.socket.on('peer-disconnected', this.handlePeerDisconnected.bind(this));
  }

  async connectToPeer(targetPeerId: string): Promise<boolean> {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      // Create data channel for messaging
      const dataChannel = pc.createDataChannel('messages', {
        ordered: true
      });

      dataChannel.onopen = () => {
        console.log('✅ Data channel opened with', targetPeerId);
      };

      dataChannel.onmessage = (event) => {
        // Handle incoming P2P messages
        this.handleP2PMessage(event.data, targetPeerId);
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer through WebSocket
      this.socket.emit('webrtc-offer', {
        to: targetPeerId,
        offer: offer
      });

      this.peerConnections.set(targetPeerId, pc);
      return true;

    } catch (error) {
      console.error('❌ P2P connection failed:', error);
      return false;
    }
  }

  private async handleOffer(data: any) {
    // Handle incoming WebRTC offers via WebSocket
    // Create answer and send back via WebSocket
  }

  private async handleAnswer(data: any) {
    // Handle WebRTC answers
  }

  private handleIceCandidate(data: any) {
    // Handle ICE candidates for NAT traversal
  }

  private handlePeerDisconnected(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  private handleP2PMessage(message: string, fromPeer: string) {
    // Handle incoming P2P messages
    console.log('📨 P2P message from', fromPeer, ':', message);
  }

  sendMessage(message: string, toPeer?: string) {
    if (toPeer) {
      // Send to specific peer
      const pc = this.peerConnections.get(toPeer);
      const dataChannel = pc?.getDataChannels()?.[0];
      if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(message);
        return true;
      }
    } else {
      // Broadcast to all connected peers
      for (const [peerId, pc] of this.peerConnections) {
        const dataChannel = pc.getDataChannels()?.[0];
        if (dataChannel && dataChannel.readyState === 'open') {
          dataChannel.send(message);
        }
      }
    }
    return false;
  }
}
