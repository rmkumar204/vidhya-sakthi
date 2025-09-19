interface PerformanceMetrics {
  callSetupTime: number;
  connectionTime: number;
  audioQuality: number;
  videoQuality: number;
  packetLoss: number;
  jitter: number;
  latency: number;
  bandwidth: number;
}

interface CallEvent {
  type: string;
  timestamp: number;
  data?: any;
}

export class CallPerformanceMonitor {
  private static instance: CallPerformanceMonitor;
  private metrics: PerformanceMetrics;
  private events: CallEvent[] = [];
  private startTime: number = 0;
  private connectionStartTime: number = 0;
  private peerConnection: RTCPeerConnection | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.metrics = {
      callSetupTime: 0,
      connectionTime: 0,
      audioQuality: 0,
      videoQuality: 0,
      packetLoss: 0,
      jitter: 0,
      latency: 0,
      bandwidth: 0
    };
  }

  public static getInstance(): CallPerformanceMonitor {
    if (!CallPerformanceMonitor.instance) {
      CallPerformanceMonitor.instance = new CallPerformanceMonitor();
    }
    return CallPerformanceMonitor.instance;
  }

  public startCallMonitoring(peerConnection: RTCPeerConnection): void {
    this.peerConnection = peerConnection;
    this.startTime = Date.now();
    this.addEvent('call_started', { timestamp: this.startTime });
    
    // Start collecting stats every 5 seconds
    this.statsInterval = setInterval(() => {
      this.collectStats();
    }, 5000);
  }

  public markConnectionEstablished(): void {
    this.connectionStartTime = Date.now();
    this.metrics.connectionTime = this.connectionStartTime - this.startTime;
    this.addEvent('connection_established', { 
      timestamp: this.connectionStartTime,
      connectionTime: this.metrics.connectionTime
    });
  }

  public markCallEnded(): void {
    const endTime = Date.now();
    this.metrics.callSetupTime = endTime - this.startTime;
    this.addEvent('call_ended', { 
      timestamp: endTime,
      totalDuration: this.metrics.callSetupTime
    });

    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }

    // Log final metrics
    this.logMetrics();
  }

  private async collectStats(): Promise<void> {
    if (!this.peerConnection) return;

    try {
      const stats = await this.peerConnection.getStats();
      let audioPacketsLost = 0;
      let audioPacketsSent = 0;
      let videoPacketsLost = 0;
      let videoPacketsSent = 0;
      let rtt = 0;
      let jitter = 0;

      stats.forEach((report) => {
        if (report.type === 'inbound-rtp') {
          if (report.mediaType === 'audio') {
            audioPacketsLost += report.packetsLost || 0;
            audioPacketsSent += report.packetsReceived || 0;
            jitter = report.jitter || 0;
          } else if (report.mediaType === 'video') {
            videoPacketsLost += report.packetsLost || 0;
            videoPacketsSent += report.packetsReceived || 0;
          }
        } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime || 0;
        }
      });

      // Calculate packet loss percentages
      const audioPacketLoss = audioPacketsSent > 0 ? (audioPacketsLost / audioPacketsSent) * 100 : 0;
      const videoPacketLoss = videoPacketsSent > 0 ? (videoPacketsLost / videoPacketsSent) * 100 : 0;

      // Update metrics
      this.metrics.audioQuality = Math.max(0, 100 - audioPacketLoss);
      this.metrics.videoQuality = Math.max(0, 100 - videoPacketLoss);
      this.metrics.packetLoss = (audioPacketLoss + videoPacketLoss) / 2;
      this.metrics.jitter = jitter * 1000; // Convert to milliseconds
      this.metrics.latency = rtt * 1000; // Convert to milliseconds

      this.addEvent('stats_collected', {
        audioQuality: this.metrics.audioQuality,
        videoQuality: this.metrics.videoQuality,
        packetLoss: this.metrics.packetLoss,
        jitter: this.metrics.jitter,
        latency: this.metrics.latency
      });

    } catch (error) {
      console.error('Error collecting call stats:', error);
    }
  }

  private addEvent(type: string, data?: any): void {
    this.events.push({
      type,
      timestamp: Date.now(),
      data
    });

    // Keep only last 100 events to prevent memory leaks
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  private logMetrics(): void {
    console.group('📊 Call Performance Metrics');
    console.log('Call Setup Time:', this.metrics.callSetupTime, 'ms');
    console.log('Connection Time:', this.metrics.connectionTime, 'ms');
    console.log('Audio Quality:', this.metrics.audioQuality.toFixed(1), '%');
    console.log('Video Quality:', this.metrics.videoQuality.toFixed(1), '%');
    console.log('Packet Loss:', this.metrics.packetLoss.toFixed(2), '%');
    console.log('Jitter:', this.metrics.jitter.toFixed(2), 'ms');
    console.log('Latency:', this.metrics.latency.toFixed(2), 'ms');
    console.log('Total Events:', this.events.length);
    console.groupEnd();

    // Send metrics to analytics service if available
    this.sendMetricsToAnalytics();
  }

  private sendMetricsToAnalytics(): void {
    // This would integrate with your analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const analyticsData = {
        timestamp: new Date().toISOString(),
        metrics: this.metrics,
        events: this.events.slice(-20) // Last 20 events
      };

      const existingData = JSON.parse(localStorage.getItem('callAnalytics') || '[]');
      existingData.push(analyticsData);
      
      // Keep only last 10 call sessions
      if (existingData.length > 10) {
        existingData.splice(0, existingData.length - 10);
      }
      
      localStorage.setItem('callAnalytics', JSON.stringify(existingData));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getEvents(): CallEvent[] {
    return [...this.events];
  }

  public getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' {
    const { audioQuality, videoQuality, packetLoss, latency } = this.metrics;
    
    // Calculate overall quality score
    const qualityScore = (audioQuality + videoQuality) / 2;
    
    if (qualityScore >= 90 && packetLoss < 1 && latency < 100) {
      return 'excellent';
    } else if (qualityScore >= 75 && packetLoss < 3 && latency < 200) {
      return 'good';
    } else if (qualityScore >= 50 && packetLoss < 5 && latency < 300) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  public reset(): void {
    this.metrics = {
      callSetupTime: 0,
      connectionTime: 0,
      audioQuality: 0,
      videoQuality: 0,
      packetLoss: 0,
      jitter: 0,
      latency: 0,
      bandwidth: 0
    };
    this.events = [];
    this.startTime = 0;
    this.connectionStartTime = 0;
    
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }
}

export const callPerformanceMonitor = CallPerformanceMonitor.getInstance();
