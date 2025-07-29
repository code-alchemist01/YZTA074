import { EyeTrackingData, DistractionEvent, AttentionAnalysis } from '../types';

declare global {
  interface Window {
    cv: any;
  }
}

export class EyeTrackingService {
  private static instance: EyeTrackingService;
  private isInitialized = false;
  private isTracking = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private sessionData: EyeTrackingData | null = null;
  private lastFaceDetectionTime = Date.now();
  private currentDistractionStart: number | null = null;
  
  // OpenCV classifiers
  private faceCascade: any = null;
  private eyeCascade: any = null;
  
  // Tracking parameters
  private readonly DISTRACTION_THRESHOLD = 2000; // 2 saniye
  private readonly BLINK_THRESHOLD = 150; // 150ms
  private readonly FACE_DETECTION_INTERVAL = 100; // 100ms
  
  private constructor() {}
  
  static getInstance(): EyeTrackingService {
    if (!EyeTrackingService.instance) {
      EyeTrackingService.instance = new EyeTrackingService();
    }
    return EyeTrackingService.instance;
  }
  
  async initialize(): Promise<boolean> {
    try {
      // OpenCV.js yüklenmesini bekle
      await this.loadOpenCV();
      
      // Haar cascade dosyalarını yükle
      await this.loadCascades();
      
      this.isInitialized = true;
      console.log('Eye tracking service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize eye tracking:', error);
      return false;
    }
  }
  
  private async loadOpenCV(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.cv && window.cv.Mat) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.5.2/opencv.js';
      script.async = true;
      
      script.onload = () => {
        // OpenCV yüklenme kontrolü
        const checkOpenCV = () => {
          if (window.cv && window.cv.Mat) {
            resolve();
          } else {
            setTimeout(checkOpenCV, 100);
          }
        };
        checkOpenCV();
      };
      
      script.onerror = () => reject(new Error('Failed to load OpenCV.js'));
      document.head.appendChild(script);
    });
  }
  
  private async loadCascades(): Promise<void> {
    const cv = window.cv;
    
    // Yüz tespiti için Haar cascade
    this.faceCascade = new cv.CascadeClassifier();
    await this.loadCascadeFile(
      'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml',
      this.faceCascade
    );
    
    // Göz tespiti için Haar cascade
    this.eyeCascade = new cv.CascadeClassifier();
    await this.loadCascadeFile(
      'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_eye.xml',
      this.eyeCascade
    );
  }
  
  private async loadCascadeFile(url: string, cascade: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'arraybuffer';
      
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = new Uint8Array(xhr.response);
          window.cv.FS_createDataFile('/', 'cascade.xml', data, true, false, false);
          cascade.load('cascade.xml');
          resolve();
        } else {
          reject(new Error(`Failed to load cascade file: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => reject(new Error('Network error loading cascade'));
      xhr.send();
    });
  }
  
  async startTracking(userId: string, sessionId: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Eye tracking service not initialized');
      return false;
    }
    
    if (this.isTracking) {
      console.warn('Eye tracking already in progress');
      return true;
    }
    
    try {
      // Kamera erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      // Video element oluştur
      if (!this.videoElement) {
        this.videoElement = document.createElement('video');
        this.videoElement.style.display = 'none';
        document.body.appendChild(this.videoElement);
      }
      
      // Canvas element oluştur
      if (!this.canvasElement) {
        this.canvasElement = document.createElement('canvas');
        this.canvasElement.style.display = 'none';
        document.body.appendChild(this.canvasElement);
      }
      
      this.videoElement.srcObject = stream;
      this.videoElement.play();
      
      // Session data başlat
      this.sessionData = {
        sessionId,
        userId,
        startTime: new Date().toISOString(),
        totalFocusTime: 0,
        totalDistractionTime: 0,
        distractionEvents: [],
        attentionScore: 100,
        averageGazeStability: 0
      };
      
      this.isTracking = true;
      this.lastFaceDetectionTime = Date.now();
      
      // Tracking loop başlat
      this.trackingLoop();
      
      console.log('Eye tracking started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start eye tracking:', error);
      return false;
    }
  }
  
  stopTracking(): EyeTrackingData | null {
    if (!this.isTracking || !this.sessionData) {
      return null;
    }
    
    this.isTracking = false;
    
    // Video stream'i durdur
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Session'ı sonlandır
    this.sessionData.endTime = new Date().toISOString();
    
    // Dikkat puanını hesapla
    this.calculateAttentionScore();
    
    const finalData = { ...this.sessionData };
    this.sessionData = null;
    
    console.log('Eye tracking stopped, session data:', finalData);
    return finalData;
  }
  
  private trackingLoop(): void {
    if (!this.isTracking || !this.videoElement || !this.canvasElement || !this.sessionData) {
      return;
    }
    
    const cv = window.cv;
    const ctx = this.canvasElement.getContext('2d');
    
    if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
      // Video frame'i canvas'a çiz
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      ctx?.drawImage(this.videoElement, 0, 0);
      
      // OpenCV Mat oluştur
      const src = cv.imread(this.canvasElement);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      
      // Yüz tespiti
      const faces = new cv.RectVector();
      this.faceCascade.detectMultiScale(gray, faces);
      
      const currentTime = Date.now();
      
      if (faces.size() > 0) {
        // Yüz tespit edildi
        this.handleFaceDetected(currentTime);
        
        // Göz tespiti
        for (let i = 0; i < faces.size(); i++) {
          const face = faces.get(i);
          const faceROI = gray.roi(face);
          
          const eyes = new cv.RectVector();
          this.eyeCascade.detectMultiScale(faceROI, eyes);
          
          if (eyes.size() >= 2) {
            // İki göz tespit edildi, odaklanma süresi arttır
            this.sessionData.totalFocusTime += currentTime - this.lastFaceDetectionTime;
          }
          
          eyes.delete();
          faceROI.delete();
        }
      } else {
        // Yüz tespit edilmedi
        this.handleFaceNotDetected(currentTime);
      }
      
      // Cleanup
      src.delete();
      gray.delete();
      faces.delete();
    }
    
    // Bir sonraki frame'i işle
    setTimeout(() => this.trackingLoop(), this.FACE_DETECTION_INTERVAL);
  }
  
  private handleFaceDetected(currentTime: number): void {
    if (this.currentDistractionStart !== null) {
      // Dikkat dağınıklığı sona erdi
      const distractionDuration = currentTime - this.currentDistractionStart;
      
      if (distractionDuration > this.DISTRACTION_THRESHOLD) {
        const event: DistractionEvent = {
          timestamp: new Date(this.currentDistractionStart).toISOString(),
          duration: distractionDuration,
          type: 'gaze_away',
          severity: this.getDistractionSeverity(distractionDuration)
        };
        
        this.sessionData?.distractionEvents.push(event);
        this.sessionData!.totalDistractionTime += distractionDuration;
      }
      
      this.currentDistractionStart = null;
    }
    
    this.lastFaceDetectionTime = currentTime;
  }
  
  private handleFaceNotDetected(currentTime: number): void {
    if (this.currentDistractionStart === null) {
      // Yeni dikkat dağınıklığı başladı
      this.currentDistractionStart = currentTime;
    }
  }
  
  private getDistractionSeverity(duration: number): 'low' | 'medium' | 'high' {
    if (duration < 5000) return 'low';      // 5 saniyeden az
    if (duration < 15000) return 'medium';  // 15 saniyeden az
    return 'high';                          // 15 saniye ve üzeri
  }
  
  private calculateAttentionScore(): void {
    if (!this.sessionData) return;
    
    const totalSessionTime = Date.now() - new Date(this.sessionData.startTime).getTime();
    const focusPercentage = (this.sessionData.totalFocusTime / totalSessionTime) * 100;
    
    // Dikkat puanını hesapla (0-100 arası)
    let attentionScore = focusPercentage;
    
    // Dikkat dağınıklığı olaylarına göre puan düşür
    this.sessionData.distractionEvents.forEach(event => {
      switch (event.severity) {
        case 'low':
          attentionScore -= 1;
          break;
        case 'medium':
          attentionScore -= 3;
          break;
        case 'high':
          attentionScore -= 5;
          break;
      }
    });
    
    // Minimum 0, maksimum 100
    this.sessionData.attentionScore = Math.max(0, Math.min(100, attentionScore));
  }
  
  generateAttentionAnalysis(eyeTrackingData: EyeTrackingData): AttentionAnalysis {
    const totalSessionTime = new Date(eyeTrackingData.endTime!).getTime() - 
                            new Date(eyeTrackingData.startTime).getTime();
    
    const focusPercentage = (eyeTrackingData.totalFocusTime / totalSessionTime) * 100;
    
    const averageDistractionDuration = eyeTrackingData.distractionEvents.length > 0
      ? eyeTrackingData.distractionEvents.reduce((sum, event) => sum + event.duration, 0) / 
        eyeTrackingData.distractionEvents.length
      : 0;
    
    // Dikkat paternini belirle
    let attentionPattern: 'consistent' | 'variable' | 'declining' | 'improving' = 'consistent';
    if (eyeTrackingData.distractionEvents.length > 5) {
      attentionPattern = 'variable';
    } else if (eyeTrackingData.distractionEvents.length > 10) {
      attentionPattern = 'declining';
    }
    
    // Öneriler oluştur
    const recommendations: string[] = [];
    if (focusPercentage < 70) {
      recommendations.push('Çalışma ortamınızı dikkat dağıtıcı unsurlardan arındırın');
      recommendations.push('Kısa molalar vererek odaklanmanızı artırın');
    }
    if (eyeTrackingData.distractionEvents.length > 8) {
      recommendations.push('Pomodoro tekniği ile 25 dakikalık çalışma blokları kullanın');
    }
    if (averageDistractionDuration > 10000) {
      recommendations.push('Dikkat dağınıklığı fark ettiğinizde hemen odaklanmaya çalışın');
    }
    
    // Yaş grubuna göre karşılaştırma (genel değerler)
    let comparedToAverage: 'above' | 'average' | 'below' = 'average';
    if (eyeTrackingData.attentionScore > 80) comparedToAverage = 'above';
    else if (eyeTrackingData.attentionScore < 60) comparedToAverage = 'below';
    
    return {
      overallScore: eyeTrackingData.attentionScore,
      focusPercentage: Math.round(focusPercentage),
      distractionCount: eyeTrackingData.distractionEvents.length,
      averageDistractionDuration: Math.round(averageDistractionDuration),
      attentionPattern,
      recommendations,
      comparedToAverage
    };
  }
  
  // Kamera izinlerini kontrol et
  static async checkCameraPermissions(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }
  
  // Cleanup
  cleanup(): void {
    if (this.isTracking) {
      this.stopTracking();
    }
    
    if (this.videoElement) {
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    if (this.canvasElement) {
      document.body.removeChild(this.canvasElement);
      this.canvasElement = null;
    }
  }
} 