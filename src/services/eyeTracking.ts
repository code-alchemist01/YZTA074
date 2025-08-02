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
  private previewElement: HTMLVideoElement | null = null;
  private sessionData: EyeTrackingData | null = null;
  private lastFaceDetectionTime = Date.now();
  private currentDistractionStart: number | null = null;
  
  // OpenCV classifiers
  private faceCascade: any = null;
  private eyeCascade: any = null;
  
  // Tracking parameters
  private readonly DISTRACTION_THRESHOLD = 2000; // 2 saniye
  private readonly FACE_DETECTION_INTERVAL = 100; // 100ms
  
  // Yeni parametreler - 10 saniyelik periyot kontrolü
  private readonly PERIOD_DURATION = 10000; // 10 saniye
  private readonly MAX_DISTRACTION_IN_PERIOD = 5000; // 5 saniye
  private periodStartTime = Date.now();
  private distractionTimeInCurrentPeriod = 0;
  private onExamPaused: ((reason: string) => void) | null = null;
  
  // Gelişmiş göz takibi parametreleri (Python kodundan uyarlama)
  private readonly EAR_THRESHOLD = 0.25; // Göz kırpma eşiği
  private readonly SACCADE_VELOCITY_THRESH = 50; // piksel/frame
  private readonly SMOOTH_PURSUIT_THRESH = 10; // piksel/frame
  private readonly FOCUS_DURATION_THRESH = 1000; // 1 saniye
  private readonly COGNITIVE_LOAD_THRESH = 0.7;
  
  // Gelişmiş takip verileri
  private eyeHistory: Array<any> = [];
  private pupilHistory: Array<any> = [];
  private gazeHistory: Array<any> = [];
  private blinkHistory: Array<number> = [];
  
  // Göz hareketi analizi
  private lastPupilPositions = { left: null as any, right: null as any };
  private saccadeCount = 0;
  private smoothPursuitCount = 0;
  private fixationCount = 0;
  
  // Dikkat metrikleri
  private focusStartTime: number | null = null;
  private totalFocusTime = 0;
  private attentionScore = 100;
  private cognitiveLoad = 0.0;
  private concentrationScore = 0.0;
  private totalBlinks = 0;
  
  // Odak bölgesi
  private focusZoneCenter = { x: 320, y: 240 };
  private focusZoneRadius = 100;
  
  // UI element'leri
  private metricsDisplay: HTMLDivElement | null = null;
  
  // Performans optimizasyonu için
  private skipFrameCount = 0;
  private readonly SKIP_FRAME_THRESHOLD = 3; // Her 3 frame'de bir işle
  
  // Hata yönetimi
  private consecutiveErrors = 0;
  private readonly MAX_CONSECUTIVE_ERRORS = 5;
  private isErrorRecovering = false;
  
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
  
  // Sadece kamera önizlemesi başlat (göz takibi olmadan)
  async startCameraPreview(): Promise<boolean> {
    console.log('📸 Starting camera preview only...');
    
    try {
      // Kamera erişimi
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      // Önizleme video elementi oluştur (büyük ve belirgin)
      if (!this.previewElement) {
        this.previewElement = document.createElement('video');
        this.previewElement.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          width: 280px;
          height: 210px;
          border: 4px solid #3b82f6;
          border-radius: 16px;
          z-index: 10000;
          background: #000;
          object-fit: cover;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          transform: scaleX(-1);
        `;
        this.previewElement.muted = true;
        this.previewElement.autoplay = true;
        this.previewElement.playsInline = true;
        
        // Preview için başlık ekle
        const title = document.createElement('div');
        title.style.cssText = `
          position: fixed;
          top: 55px;
          right: 25px;
          color: #3b82f6;
          font-size: 14px;
          font-weight: 600;
          z-index: 10001;
          background: rgba(255,255,255,0.9);
          padding: 4px 12px;
          border-radius: 8px;
          backdrop-filter: blur(4px);
        `;
        title.textContent = '🎥 Canlı Kamera';
        title.id = 'camera-preview-title';
        
        // Status indicator (daha büyük)
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
          position: fixed;
          top: 90px;
          right: 30px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          border-radius: 50%;
          z-index: 10001;
          animation: pulse 2s infinite;
          border: 2px solid white;
        `;
        statusIndicator.id = 'camera-status-indicator';
        
        document.body.appendChild(this.previewElement);
        document.body.appendChild(title);
        document.body.appendChild(statusIndicator);
        
        // Metrik görüntüleme paneli oluştur
        this.createMetricsDisplay();
        
        console.log('✅ Camera preview element created (preview only mode)');
      }

      this.previewElement.srcObject = stream;
      
      // Preview video event handlers
      this.previewElement.addEventListener('loadedmetadata', () => {
        console.log('👁️ Preview video loaded:', this.previewElement?.videoWidth, 'x', this.previewElement?.videoHeight);
        
        // Status indicator'ı yeşil yap
        const indicator = document.getElementById('camera-status-indicator');
        if (indicator) {
          indicator.style.background = '#10b981';
          console.log('✅ Camera preview is live!');
        }
      });
      
      try {
        await this.previewElement.play();
        console.log('✅ Camera preview started successfully');
        return true;
      } catch (error) {
        console.error('❌ Preview video play failed:', error);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Camera preview failed:', error);
      return false;
    }
  }

  // Metrik görüntüleme paneli oluştur
  private createMetricsDisplay(): void {
    if (!this.metricsDisplay) {
      this.metricsDisplay = document.createElement('div');
      this.metricsDisplay.style.cssText = `
        position: fixed;
        top: 300px;
        right: 20px;
        width: 280px;
        background: rgba(0, 0, 0, 0.85);
        color: white;
        padding: 15px;
        border-radius: 12px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 12px;
        z-index: 10000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
      `;
      this.metricsDisplay.id = 'eye-tracking-metrics';
      document.body.appendChild(this.metricsDisplay);
    }
    this.updateMetricsDisplay();
  }

  // Metrikleri güncelle
  private updateMetricsDisplay(): void {
    if (!this.metricsDisplay) return;

    const sessionDuration = this.sessionData 
      ? Math.floor((Date.now() - new Date(this.sessionData.startTime).getTime()) / 1000)
      : 0;

    const minutes = Math.floor(sessionDuration / 60);
    const seconds = sessionDuration % 60;
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.metricsDisplay.innerHTML = `
      <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3);">
        <strong style="color: #3b82f6;">📊 Göz Takibi Metrikleri</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #10b981;">⏱️ Süre:</span> <strong>${timeStr}</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #f59e0b;">🎯 Odak Puanı:</span> <strong>${this.concentrationScore.toFixed(1)}%</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #ef4444;">⚠️ Dikkat Dağınıklığı:</span> <strong>${this.sessionData?.distractionEvents.length || 0}</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #8b5cf6;">🧠 Dikkat Skoru:</span> <strong>${this.attentionScore.toFixed(1)}</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #06b6d4;">👁️ Göz Kırpma:</span> <strong>${this.totalBlinks}</strong>
      </div>
      
      <div style="margin-bottom: 8px;">
        <span style="color: #84cc16;">📈 Bilişsel Yük:</span> <strong>${(this.cognitiveLoad * 100).toFixed(1)}%</strong>
      </div>
      
      <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
        Saccade: ${this.saccadeCount} | Fixation: ${this.fixationCount}
      </div>
    `;
  }

  // Pupil tespiti (Python algoritmasından uyarlama)
  private detectPupil(eyeRegion: ImageData, eyeRect: { x: number, y: number, width: number, height: number }): { center: { x: number, y: number }, radius: number } | null {
    // JavaScript'te OpenCV.js kullanarak pupil tespiti
    // Bu basitleştirilmiş bir versiyondur
    const centerX = eyeRect.x + eyeRect.width / 2;
    const centerY = eyeRect.y + eyeRect.height / 2;
    
    // Basit pupil merkezi tahmini (gerçek implementasyon için OpenCV.js gerekir)
    return {
      center: { x: centerX, y: centerY },
      radius: Math.min(eyeRect.width, eyeRect.height) / 4
    };
  }

  // Göz hareket türünü tespit et (Python'dan uyarlama)
  private detectEyeMovementType(currentPupil: any, previousPupil: any, timeDelta: number): string {
    if (!currentPupil || !previousPupil || timeDelta <= 0) {
      return 'unknown';
    }

    const distance = Math.sqrt(
      Math.pow(currentPupil.center.x - previousPupil.center.x, 2) +
      Math.pow(currentPupil.center.y - previousPupil.center.y, 2)
    );

    const velocity = distance / (timeDelta / 1000); // piksel/saniye

    if (velocity > this.SACCADE_VELOCITY_THRESH) {
      this.saccadeCount++;
      return 'saccade';
    } else if (velocity > this.SMOOTH_PURSUIT_THRESH) {
      this.smoothPursuitCount++;
      return 'smooth_pursuit';
    } else {
      this.fixationCount++;
      return 'fixation';
    }
  }

  // Bilişsel yük hesapla (Python'dan uyarlama)
  private calculateCognitiveLoad(): number {
    if (this.blinkHistory.length < 10) return 0.0;

    // Son 10 saniyedeki göz kırpma sıklığı
    const recentBlinks = this.blinkHistory.slice(-300).reduce((sum, blink) => sum + blink, 0);
    const blinkRate = recentBlinks / 10.0; // blink/saniye

    let cognitiveLoad = 0.0;

    if (blinkRate < 0.15) { // Çok az göz kırpma
      cognitiveLoad = Math.min(1.0, (0.25 - blinkRate) / 0.1);
    } else if (blinkRate > 0.5) { // Çok fazla göz kırpma
      cognitiveLoad = Math.min(1.0, (blinkRate - 0.33) / 0.5);
    }

    // Saccade sıklığını da dahil et
    if (this.gazeHistory.length > 10) {
      const recentMovements = this.gazeHistory.slice(-30).filter(h => h.movementType === 'saccade').length;
      const saccadeRate = recentMovements / 30.0;

      if (saccadeRate > 0.3) {
        cognitiveLoad += Math.min(0.5, saccadeRate - 0.3);
      }
    }

    return Math.min(1.0, cognitiveLoad);
  }

  // Konsantrasyon skoru hesapla (Python'dan uyarlama)
  private calculateConcentrationScore(): number {
    if (this.gazeHistory.length < 30) return 50.0;

    const recentGaze = this.gazeHistory.slice(-60); // Son 2 saniye

    // Odak bölgesinde geçirilen süre
    const focusTime = recentGaze.filter(g => g.inFocusZone).length;
    const totalTime = recentGaze.length;
    const focusRatio = focusTime / totalTime;

    // Fixation oranı
    const fixationCount = recentGaze.filter(g => g.movementType === 'fixation').length;
    const fixationRatio = fixationCount / totalTime;

    // Bilişsel yük faktörü
    const cognitiveFactor = 1.0 - this.cognitiveLoad;

    // Konsantrasyon skorunu hesapla
    const concentration = (focusRatio * 0.4 + fixationRatio * 0.4 + cognitiveFactor * 0.2) * 100;

    return Math.min(100.0, Math.max(0.0, concentration));
  }

  // Dikkat dağılma türünü sınıflandır (Python'dan uyarlama)
  private classifyAttentionDistraction(): string {
    if (this.gazeHistory.length < 30) return 'insufficient_data';

    const recentGaze = this.gazeHistory.slice(-30);

    // Saccade oranı
    const saccadeCount = recentGaze.filter(g => g.movementType === 'saccade').length;
    const saccadeRatio = saccadeCount / recentGaze.length;

    // Odak dışı bakış oranı
    const outOfFocus = recentGaze.filter(g => !g.inFocusZone).length;
    const outOfFocusRatio = outOfFocus / recentGaze.length;

    // Göz kırpma sıklığı
    const recentBlinks = this.blinkHistory.slice(-30).reduce((sum, blink) => sum + blink, 0);

    // Sınıflandırma
    if (this.cognitiveLoad > 0.7) {
      return 'cognitive_overload';
    } else if (recentBlinks > 10) {
      return 'fatigue';
    } else if (saccadeRatio > 0.5) {
      return 'visual_distraction';
    } else if (outOfFocusRatio > 0.7) {
      return 'external_distraction';
    } else if (outOfFocusRatio > 0.3) {
      return 'mild_distraction';
    } else {
      return 'focused';
    }
  }

  // Dikkat metriklerini güncelle (Python'dan uyarlama)
  private updateAdvancedAttentionMetrics(eyeData: any, gazeInFocus: boolean): void {
    const currentTime = Date.now();

    // Gaze history güncelle
    const gazeEntry = {
      timestamp: currentTime,
      eyeData: eyeData,
      inFocusZone: gazeInFocus,
      movementType: 'unknown'
    };

    // Göz hareket türünü belirle
    if (this.gazeHistory.length > 0 && eyeData.leftPupil) {
      const prevEntry = this.gazeHistory[this.gazeHistory.length - 1];
      if (prevEntry.eyeData.leftPupil) {
        const timeDelta = currentTime - prevEntry.timestamp;
        const movementType = this.detectEyeMovementType(
          eyeData.leftPupil,
          prevEntry.eyeData.leftPupil,
          timeDelta
        );
        gazeEntry.movementType = movementType;
      }
    }

    this.gazeHistory.push(gazeEntry);

    // Maksimum 300 entry tut (10 saniye @ 30fps)
    if (this.gazeHistory.length > 300) {
      this.gazeHistory = this.gazeHistory.slice(-300);
    }

    // Odaklanma süresi takibi
    if (gazeInFocus) {
      if (this.focusStartTime === null) {
        this.focusStartTime = currentTime;
      }
    } else {
      if (this.focusStartTime !== null) {
        const focusDuration = currentTime - this.focusStartTime;
        if (focusDuration >= this.FOCUS_DURATION_THRESH) {
          this.totalFocusTime += focusDuration;
        }
        this.focusStartTime = null;
      }
    }

    // Bilişsel yük hesapla
    this.cognitiveLoad = this.calculateCognitiveLoad();

    // Konsantrasyon skoru hesapla
    this.concentrationScore = this.calculateConcentrationScore();

    // Dikkat skoru güncelle
    const distractionType = this.classifyAttentionDistraction();

    if (distractionType === 'focused') {
      this.attentionScore = Math.min(100, this.attentionScore + 1);
    } else if (distractionType === 'mild_distraction') {
      this.attentionScore = Math.max(0, this.attentionScore - 0.5);
    } else {
      this.attentionScore = Math.max(0, this.attentionScore - 2);
    }

    // Metrikleri güncelle
    this.updateMetricsDisplay();
  }

  // Gelişmiş göz analizi (Python'dan uyarlama)
  private performAdvancedEyeAnalysis(eyes: any, face: any, currentTime: number): any {
    const eyeArray = [];
    for (let i = 0; i < Math.min(eyes.size(), 2); i++) {
      const eye = eyes.get(i);
      eyeArray.push({
        x: face.x + eye.x,
        y: face.y + eye.y,
        width: eye.width,
        height: eye.height
      });
    }

    // Gözleri sol ve sağa ayır (x koordinatına göre)
    eyeArray.sort((a, b) => a.x - b.x);
    
    const leftEye = eyeArray[0];
    const rightEye = eyeArray[1] || leftEye;

    // Basit pupil tahmini
    const leftPupil = {
      center: { 
        x: leftEye.x + leftEye.width / 2, 
        y: leftEye.y + leftEye.height / 2 
      },
      radius: Math.min(leftEye.width, leftEye.height) / 4
    };

    const rightPupil = {
      center: { 
        x: rightEye.x + rightEye.width / 2, 
        y: rightEye.y + rightEye.height / 2 
      },
      radius: Math.min(rightEye.width, rightEye.height) / 4
    };

    return {
      leftPupil,
      rightPupil,
      leftEye,
      rightEye,
      timestamp: currentTime
    };
  }

  // Odak bölgesi kontrolü
  private checkGazeInFocusZone(eyeData: any): boolean {
    if (!eyeData.leftPupil && !eyeData.rightPupil) return false;

    // Ortalama pupil pozisyonu
    let avgX = 0, avgY = 0, count = 0;

    if (eyeData.leftPupil) {
      avgX += eyeData.leftPupil.center.x;
      avgY += eyeData.leftPupil.center.y;
      count++;
    }

    if (eyeData.rightPupil) {
      avgX += eyeData.rightPupil.center.x;
      avgY += eyeData.rightPupil.center.y;
      count++;
    }

    if (count === 0) return false;

    avgX /= count;
    avgY /= count;

    // Odak bölgesine olan mesafe
    const distance = Math.sqrt(
      Math.pow(avgX - this.focusZoneCenter.x, 2) + 
      Math.pow(avgY - this.focusZoneCenter.y, 2)
    );

    return distance <= this.focusZoneRadius;
  }

  // Göz kırpma tespiti (Python'dan uyarlama)
  private detectBlinking(eyeData: any): void {
    if (!eyeData.leftEye || !eyeData.rightEye) {
      this.blinkHistory.push(0);
      return;
    }

    // Basit göz açıklığı hesaplama (yükseklik/genişlik oranı)
    const leftOpenness = eyeData.leftEye.height / eyeData.leftEye.width;
    const rightOpenness = eyeData.rightEye.height / eyeData.rightEye.width;
    const avgOpenness = (leftOpenness + rightOpenness) / 2;

    // Eşikten küçükse göz kapalı
    const isBlinking = avgOpenness < this.EAR_THRESHOLD;

    // Yeni göz kırpma tespit edildi mi?
    const lastBlink = this.blinkHistory[this.blinkHistory.length - 1] || 0;
    if (isBlinking && lastBlink === 0) {
      this.totalBlinks++;
    }

    this.blinkHistory.push(isBlinking ? 1 : 0);

    // Maksimum 300 entry tut (10 saniye @ 30fps)
    if (this.blinkHistory.length > 300) {
      this.blinkHistory = this.blinkHistory.slice(-300);
    }
  }

  // Kamera önizlemesini durdur
  stopCameraPreview(): void {
    console.log('📸 Stopping camera preview...');
    
    // Video stream'i durdur
    if (this.previewElement && this.previewElement.srcObject) {
      const stream = this.previewElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped track: ${track.label}`);
      });
      this.previewElement.srcObject = null;
    }
    
    // Preview elementi kaldır
    if (this.previewElement && this.previewElement.parentNode) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }
    
    // Title kaldır
    const title = document.getElementById('camera-preview-title');
    if (title && title.parentNode) {
      title.parentNode.removeChild(title);
    }
    
    // Status indicator kaldır
    const indicator = document.getElementById('camera-status-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    // Metrikleri kaldır
    if (this.metricsDisplay && this.metricsDisplay.parentNode) {
      this.metricsDisplay.parentNode.removeChild(this.metricsDisplay);
      this.metricsDisplay = null;
    }
    
    console.log('✅ Camera preview stopped and cleaned up');
  }

  async startTracking(userId: string, sessionId: string, onExamPaused?: (reason: string) => void): Promise<boolean> {
    console.log('🚀 Starting eye tracking for user:', userId, 'session:', sessionId);
    
    if (!this.isInitialized) {
      console.error('❌ Eye tracking service not initialized');
      return false;
    }
    
    if (this.isTracking) {
      console.warn('⚠️ Eye tracking already in progress');
      return true;
    }
    
    // Callback fonksiyonunu kaydet
    this.onExamPaused = onExamPaused || null;
    
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
      
      // Önizleme video elementi oluştur (küçük kamera penceresi)
      if (!this.previewElement) {
        this.previewElement = document.createElement('video');
        this.previewElement.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          width: 220px;
          height: 165px;
          border: 3px solid #10b981;
          border-radius: 12px;
          z-index: 10000;
          background: #000;
          object-fit: cover;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transform: scaleX(-1);
        `;
        this.previewElement.muted = true;
        this.previewElement.autoplay = true;
        this.previewElement.playsInline = true;
        
        // Preview için overlay ekle
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 60px;
          right: 15px;
          width: 230px;
          height: 185px;
          z-index: 9999;
          pointer-events: none;
          border-radius: 12px;
          background: linear-gradient(45deg, transparent 0%, rgba(16,185,129,0.1) 100%);
        `;
        
        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.style.cssText = `
          position: fixed;
          top: 70px;
          right: 25px;
          width: 12px;
          height: 12px;
          background: #ef4444;
          border-radius: 50%;
          z-index: 10001;
          animation: pulse 2s infinite;
        `;
        statusIndicator.id = 'camera-status-indicator';
        
        // CSS animasyonu ekle
        const style = document.createElement('style');
        style.textContent = `
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(overlay);
        document.body.appendChild(this.previewElement);
        document.body.appendChild(statusIndicator);
        
        console.log('✅ Camera preview element created and added to DOM');
      }

      this.videoElement.srcObject = stream;
      this.previewElement.srcObject = stream;
      
      console.log('🎥 Setting up camera streams...');
      
      // Video play event handlers
      this.videoElement.addEventListener('loadedmetadata', () => {
        console.log('📹 Main video loaded:', this.videoElement?.videoWidth, 'x', this.videoElement?.videoHeight);
      });
      
      this.previewElement.addEventListener('loadedmetadata', () => {
        console.log('👁️ Preview video loaded:', this.previewElement?.videoWidth, 'x', this.previewElement?.videoHeight);
        
        // Status indicator'ı yeşil yap
        const indicator = document.getElementById('camera-status-indicator');
        if (indicator) {
          indicator.style.background = '#10b981';
          console.log('✅ Camera status indicator turned green');
        }
      });
      
      this.previewElement.addEventListener('playing', () => {
        console.log('▶️ Preview video is now playing');
      });
      
      this.previewElement.addEventListener('error', (e) => {
        console.error('❌ Preview video error:', e);
      });
      
      try {
        await this.videoElement.play();
        console.log('✅ Main video started playing');
      } catch (error) {
        console.error('❌ Main video play failed:', error);
      }
      
      try {
        await this.previewElement.play();
        console.log('✅ Preview video started playing');
      } catch (error) {
        console.error('❌ Preview video play failed:', error);
      }
      
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
      
      // Periyot takibini başlat
      this.periodStartTime = Date.now();
      this.distractionTimeInCurrentPeriod = 0;
      
      // Tracking loop başlat
      this.trackingLoop();
      
      // Metrik görüntüleme paneli oluştur
      this.createMetricsDisplay();
      
      // Metrikleri periyodik olarak güncelle
      const metricsInterval = setInterval(() => {
        if (this.isTracking) {
          this.updateMetricsDisplay();
        } else {
          clearInterval(metricsInterval);
        }
      }, 1000); // Her saniye güncelle
      
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
    
    // Önizleme elementini ve overlay'ları kaldır
    if (this.previewElement) {
      document.body.removeChild(this.previewElement);
      this.previewElement = null;
    }
    
    // Status indicator'ı kaldır
    const indicator = document.getElementById('camera-status-indicator');
    if (indicator) {
      document.body.removeChild(indicator);
    }
    
    // Overlay'ları kaldır
    const overlays = document.querySelectorAll('[style*="pointer-events: none"]');
    overlays.forEach(overlay => {
      if (overlay.parentNode === document.body) {
        document.body.removeChild(overlay);
      }
    });
    
    console.log('🧹 Camera preview elements cleaned up');
    
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
    
    const currentTime = Date.now();
    
    // Performans optimizasyonu: Belirli frame'leri atla
    this.skipFrameCount++;
    if (this.skipFrameCount < this.SKIP_FRAME_THRESHOLD) {
      setTimeout(() => this.trackingLoop(), this.FACE_DETECTION_INTERVAL);
      return;
    }
    this.skipFrameCount = 0;
    
    try {
      const cv = window.cv;
      if (!cv || !cv.Mat) {
        this.handleTrackingError('OpenCV not available');
        return;
      }
      
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
        this.faceCascade.detectMultiScale(gray, faces, 1.1, 3, 0, new cv.Size(30, 30));
        
        if (faces.size() > 0) {
          // Yüz tespit edildi
          this.handleFaceDetected(currentTime);
          this.consecutiveErrors = 0; // Hata sayacını sıfırla
          
          // Göz tespiti ve gelişmiş analiz
          for (let i = 0; i < faces.size(); i++) {
            const face = faces.get(i);
            const faceROI = gray.roi(face);
            
            const eyes = new cv.RectVector();
            this.eyeCascade.detectMultiScale(faceROI, eyes, 1.1, 3);
            
            if (eyes.size() >= 2) {
              // İki göz tespit edildi
              this.sessionData.totalFocusTime += Math.min(currentTime - this.lastFaceDetectionTime, this.FACE_DETECTION_INTERVAL);
              
              // Gelişmiş göz analizi
              const eyeData = this.performAdvancedEyeAnalysis(eyes, face, currentTime);
              
              // Odak bölgesi kontrolü (basitleştirilmiş)
              const gazeInFocus = this.checkGazeInFocusZone(eyeData);
              
              // Gelişmiş dikkat metriklerini güncelle
              this.updateAdvancedAttentionMetrics(eyeData, gazeInFocus);
              
              // Göz kırpma tespiti
              this.detectBlinking(eyeData);
            }
            
            eyes.delete();
            faceROI.delete();
            break; // İlk yüzü işle, çoklu yüz tespitini önle
          }
        } else {
          // Yüz tespit edilmedi
          this.handleFaceNotDetected(currentTime);
          
          // Göz kırpma history'sine 0 ekle
          this.blinkHistory.push(0);
          if (this.blinkHistory.length > 300) { // 10 saniye
            this.blinkHistory = this.blinkHistory.slice(-300);
          }
        }
        
        // Cleanup
        src.delete();
        gray.delete();
        faces.delete();
      }
    } catch (error) {
      this.handleTrackingError(`Tracking error: ${error}`);
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
    
    // 10 saniyelik periyot kontrolü
    this.checkPeriodDistraction(currentTime);
  }
  
  private checkPeriodDistraction(currentTime: number): void {
    const timeSincePeriodStart = currentTime - this.periodStartTime;
    
    // 10 saniye geçti mi?
    if (timeSincePeriodStart >= this.PERIOD_DURATION) {
      // Mevcut periyotta 5 saniyeden fazla dikkat dağınıklığı var mı?
      if (this.distractionTimeInCurrentPeriod > this.MAX_DISTRACTION_IN_PERIOD) {
        // Sınavı durdur ve uyarı ver
        this.pauseExamForDistraction();
        return;
      }
      
      // Yeni periyodu başlat
      this.periodStartTime = currentTime;
      this.distractionTimeInCurrentPeriod = 0;
    } else {
      // Mevcut periyotta dikkat dağınıklığı süresini güncelle
      if (this.currentDistractionStart !== null) {
        this.distractionTimeInCurrentPeriod = currentTime - this.currentDistractionStart;
      }
    }
  }
  
  private pauseExamForDistraction(): void {
    if (this.onExamPaused) {
      this.onExamPaused('Dikkatiniz dağılıyor, biraz dinlenin. Sınav duraklatıldı.');
    }
    
    // Göz takibini geçici olarak durdur
    this.isTracking = false;
    
    // Uyarı mesajı göster
    this.showDistractionWarning();
  }
  
  private showDistractionWarning(): void {
    // Uyarı popup'ı oluştur
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fee2e2;
      border: 2px solid #dc2626;
      border-radius: 12px;
      padding: 24px;
      z-index: 10000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      max-width: 400px;
      text-align: center;
    `;
    
    warningDiv.innerHTML = `
      <div style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">⚠️</div>
      <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 18px;">Dikkat Dağınıklığı Tespit Edildi</h3>
      <p style="color: #7f1d1d; margin: 0 0 20px 0; line-height: 1.5;">Son 10 saniyede 5 saniyeden fazla göz temasınız kaçtı. Biraz dinlenin ve odaklanmaya çalışın.</p>
      <button id="continueExam" style="
        background: #dc2626;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
      ">Sınava Devam Et</button>
    `;
    
    document.body.appendChild(warningDiv);
    
    // Devam et butonuna tıklama olayı
    const continueButton = document.getElementById('continueExam');
    if (continueButton) {
      continueButton.onclick = () => {
        document.body.removeChild(warningDiv);
        this.resumeTracking();
      };
    }
  }
  
  private resumeTracking(): void {
    // Göz takibini yeniden başlat
    this.isTracking = true;
    this.periodStartTime = Date.now();
    this.distractionTimeInCurrentPeriod = 0;
    this.currentDistractionStart = null;
    this.consecutiveErrors = 0;
    this.isErrorRecovering = false;
    
    // Tracking loop'u yeniden başlat
    this.trackingLoop();
  }

  // Hata yönetimi fonksiyonu
  private handleTrackingError(errorMessage: string): void {
    console.error('Eye tracking error:', errorMessage);
    this.consecutiveErrors++;
    
    if (this.consecutiveErrors >= this.MAX_CONSECUTIVE_ERRORS && !this.isErrorRecovering) {
      this.isErrorRecovering = true;
      console.warn('Too many consecutive tracking errors, attempting recovery...');
      
      // Hata kurtarma stratejisi
      setTimeout(() => {
        if (this.isTracking) {
          this.attemptErrorRecovery();
        }
      }, 2000);
    }
  }

  // Hata kurtarma stratejisi
  private async attemptErrorRecovery(): Promise<void> {
    try {
      console.log('Attempting eye tracking recovery...');
      
      // Mevcut stream'i durdur
      if (this.videoElement && this.videoElement.srcObject) {
        const stream = this.videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Yeni stream almaya çalış
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        }
      });
      
      if (this.videoElement && this.previewElement) {
        this.videoElement.srcObject = stream;
        this.previewElement.srcObject = stream;
        this.videoElement.play();
        this.previewElement.play();
      }
      
      // Hata sayacını sıfırla
      this.consecutiveErrors = 0;
      this.isErrorRecovering = false;
      
      console.log('Eye tracking recovery successful');
    } catch (error) {
      console.error('Eye tracking recovery failed:', error);
      this.isErrorRecovering = false;
      
      // Kritik hata durumunda tracking'i durdur
      if (this.onExamPaused) {
        this.onExamPaused('Kamera bağlantısında teknik bir sorun oluştu. Sınav duraklatıldı.');
      }
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
      console.log('🔍 Checking camera permissions...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ getUserMedia not supported');
        return false;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        } 
      });
      
      console.log('✅ Camera permission granted, stream obtained');
      console.log('📹 Video tracks:', stream.getVideoTracks().length);
      
      stream.getTracks().forEach(track => {
        console.log(`🎥 Track: ${track.label} (${track.kind})`);
        track.stop();
      });
      
      return true;
    } catch (error) {
      console.error('❌ Camera permission denied:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
      }
      return false;
    }
  }
  
  // Cleanup
  cleanup(): void {
    console.log('🧹 Starting eye tracking cleanup...');
    
    if (this.isTracking) {
      this.stopTracking();
    }

    if (this.videoElement && this.videoElement.parentNode) {
      this.videoElement.parentNode.removeChild(this.videoElement);
      this.videoElement = null;
    }

    if (this.canvasElement && this.canvasElement.parentNode) {
      this.canvasElement.parentNode.removeChild(this.canvasElement);
      this.canvasElement = null;
    }
    
    if (this.previewElement && this.previewElement.parentNode) {
      this.previewElement.parentNode.removeChild(this.previewElement);
      this.previewElement = null;
    }

    // Status indicator'ı kaldır
    const indicator = document.getElementById('camera-status-indicator');
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
    
    // Title kaldır
    const title = document.getElementById('camera-preview-title');
    if (title && title.parentNode) {
      title.parentNode.removeChild(title);
    }
    
    // Metrikleri kaldır
    if (this.metricsDisplay && this.metricsDisplay.parentNode) {
      this.metricsDisplay.parentNode.removeChild(this.metricsDisplay);
      this.metricsDisplay = null;
    }
    
    // Overlay'ları kaldır
    const overlays = document.querySelectorAll('[style*="pointer-events: none"]');
    overlays.forEach(overlay => {
      if (overlay.parentNode === document.body) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    
    console.log('✅ Eye tracking cleanup completed');
  }
}