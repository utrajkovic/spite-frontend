import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';

const MAX_TRIM = 5; // max sekundi

@Component({
  standalone: true,
  selector: 'video-trim-modal',
  templateUrl: './video-trim.modal.html',
  styleUrls: ['./video-trim.modal.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonSpinner]
})
export class VideoTrimModal implements AfterViewInit, OnDestroy {

  @Input() file!: File;
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('timelineTrack') timelineTrackRef!: ElementRef<HTMLDivElement>;

  videoUrl = '';
  duration = 0;
  startTime = 0;
  endTime = 5;

  isProcessing = false;
  processingMsg = '';
  recordingProgress = 0; // 0-100 za progress bar tokom snimanja

  private isDraggingSelection = false;
  private dragStartX = 0;
  private dragStartStart = 0;
  private dragStartEnd = 0;
  private seekTimeout: any = null;
  private recordingTimer: any = null;

  constructor(private modalCtrl: ModalController, private zone: NgZone) {}

  ngAfterViewInit() {
    this.videoUrl = URL.createObjectURL(this.file);
    const video = this.videoRef.nativeElement;
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      this.zone.run(() => {
        this.duration = video.duration;
        this.endTime = Math.min(MAX_TRIM, this.duration);
        this.startTime = 0;
      });
    };
    video.load();
  }

  ngOnDestroy() {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    if (this.seekTimeout) clearTimeout(this.seekTimeout);
    if (this.recordingTimer) clearInterval(this.recordingTimer);
  }

  // ========================
  // SEEKING
  // ========================

  private seekTo(t: number) {
    const video = this.videoRef?.nativeElement;
    if (!video || this.duration === 0) return;
    const clamped = Math.max(0, Math.min(t, this.duration));
    video.pause();
    if (this.seekTimeout) clearTimeout(this.seekTimeout);
    this.seekTimeout = setTimeout(() => {
      if ((video as any).fastSeek) (video as any).fastSeek(clamped);
      else video.currentTime = clamped;
    }, 50);
  }

  // ========================
  // SLIDERS
  // ========================

  onStartChange(val: number) {
    const maxStart = this.endTime - 0.5;
    this.startTime = Math.min(val, maxStart);
    // Ako bi selekcija prešla MAX_TRIM, pomeri end
    if (this.endTime - this.startTime > MAX_TRIM) {
      this.endTime = Math.min(this.startTime + MAX_TRIM, this.duration);
    }
    this.seekTo(this.startTime);
  }

  onEndChange(val: number) {
    const minEnd = this.startTime + 0.5;
    this.endTime = Math.max(val, minEnd);
    // Ako bi selekcija prešla MAX_TRIM, pomeri start
    if (this.endTime - this.startTime > MAX_TRIM) {
      this.startTime = Math.max(this.endTime - MAX_TRIM, 0);
    }
    this.seekTo(this.startTime);
  }

  // ========================
  // DRAGGABLE SELECTION
  // ========================

  onSelectionPointerDown(event: PointerEvent) {
    event.preventDefault();
    this.isDraggingSelection = true;
    this.dragStartX = event.clientX;
    this.dragStartStart = this.startTime;
    this.dragStartEnd = this.endTime;

    const onMove = (e: PointerEvent) => this.onSelectionPointerMove(e);
    const onUp = () => {
      this.isDraggingSelection = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  private onSelectionPointerMove(event: PointerEvent) {
    if (!this.isDraggingSelection || !this.timelineTrackRef) return;
    const trackWidth = this.timelineTrackRef.nativeElement.getBoundingClientRect().width;
    if (trackWidth === 0) return;

    const dx = event.clientX - this.dragStartX;
    const dTime = (dx / trackWidth) * this.duration;
    const selDuration = this.dragStartEnd - this.dragStartStart;

    let newStart = this.dragStartStart + dTime;
    let newEnd = newStart + selDuration;

    if (newStart < 0) { newStart = 0; newEnd = selDuration; }
    if (newEnd > this.duration) { newEnd = this.duration; newStart = this.duration - selDuration; }

    this.zone.run(() => {
      this.startTime = newStart;
      this.endTime = newEnd;
    });
    this.seekTo(newStart);
  }

  // ========================
  // PREVIEW
  // ========================

  previewTrim() {
    const video = this.videoRef?.nativeElement;
    if (!video) return;
    video.currentTime = this.startTime;
    video.play();
    const stop = () => {
      if (video.currentTime >= this.endTime) {
        video.pause();
        video.removeEventListener('timeupdate', stop);
      }
    };
    video.addEventListener('timeupdate', stop);
  }

  // ========================
  // GETTERS
  // ========================

  get trimDuration(): number {
    return Math.round((this.endTime - this.startTime) * 10) / 10;
  }

  get selectionLeftPct(): number {
    return this.duration > 0 ? (this.startTime / this.duration) * 100 : 0;
  }

  get selectionWidthPct(): number {
    return this.duration > 0 ? ((this.endTime - this.startTime) / this.duration) * 100 : 0;
  }

  get dimLeftWidthPct(): number {
    return this.duration > 0 ? (this.startTime / this.duration) * 100 : 0;
  }

  get dimRightWidthPct(): number {
    return this.duration > 0 ? ((this.duration - this.endTime) / this.duration) * 100 : 0;
  }

  get selectionTooLong(): boolean {
    return this.trimDuration > MAX_TRIM;
  }

  // ========================
  // TRIM via MediaRecorder
  // ========================

  async trimAndReturn() {
    const video = this.videoRef?.nativeElement;
    if (!video) return;

    this.isProcessing = true;
    this.processingMsg = `Recording ${this.trimDuration}s...`;
    this.recordingProgress = 0;

    try {
      // Seek na startTime
      video.currentTime = this.startTime;
      await new Promise<void>(resolve => {
        const onSeeked = () => { video.removeEventListener('seeked', onSeeked); resolve(); };
        video.addEventListener('seeked', onSeeked);
      });

      // Capture stream iz video elementa
      const stream = (video as any).captureStream
        ? (video as any).captureStream()
        : (video as any).mozCaptureStream();

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: this.getSupportedMimeType()
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.start(100);
      video.play();

      // Progress timer
      const trimMs = this.trimDuration * 1000;
      const startedAt = Date.now();
      this.recordingTimer = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        this.zone.run(() => {
          this.recordingProgress = Math.min((elapsed / trimMs) * 100, 100);
          this.processingMsg = `Recording... ${Math.ceil((trimMs - elapsed) / 1000)}s`;
        });
      }, 100);

      // Čekaj trimDuration sekundi
      await new Promise<void>(resolve => setTimeout(resolve, trimMs));

      clearInterval(this.recordingTimer);
      video.pause();
      recorder.stop();

      // Sačekaj da recorder završi
      await new Promise<void>(resolve => { recorder.onstop = () => resolve(); });

      const mimeType = this.getSupportedMimeType();
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(chunks, { type: mimeType });
      const trimmedFile = new File([blob], `trimmed.${ext}`, { type: mimeType });

      this.modalCtrl.dismiss(trimmedFile);

    } catch (e) {
      console.error('MediaRecorder error:', e);
      this.processingMsg = 'Error — try Skip Trim';
      clearInterval(this.recordingTimer);
      setTimeout(() => { this.isProcessing = false; this.processingMsg = ''; }, 2000);
    }
  }

  private getSupportedMimeType(): string {
    const types = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    return types.find(t => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  }

  skipTrim() { this.modalCtrl.dismiss(this.file); }
  cancel() { this.modalCtrl.dismiss(null); }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}