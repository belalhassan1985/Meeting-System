// Local Recording Service using MediaRecorder API
// Works offline without LiveKit Egress

export class LocalRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  async startRecording(roomElement: HTMLElement): Promise<void> {
    try {
      // Use screen capture API to record the meeting
      // @ts-ignore - getDisplayMedia types
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
        },
        audio: true,
      });

      // Create MediaRecorder
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      
      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }
      
      // Fallback to default if neither supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000); // Collect data every second
      
      // Handle when user stops screen sharing
      this.stream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('📹 Screen sharing stopped by user');
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      });
      
      console.log('📹 Local recording started - اختر نافذة المتصفح لتسجيل الاجتماع');
    } catch (error) {
      console.error('Failed to start local recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        console.log('📹 Local recording stopped, size:', blob.size);
        
        // Clean up
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  async uploadRecording(recordingId: string, blob: Blob, apiUrl: string): Promise<void> {
    console.log(`📤 Uploading recording... Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    const formData = new FormData();
    formData.append('file', blob, `recording-${recordingId}.webm`);

    try {
      const response = await fetch(`${apiUrl}/recordings/upload/${recordingId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload recording: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Recording uploaded successfully:', result);
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
