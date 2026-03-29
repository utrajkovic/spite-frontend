import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButton, IonSpinner } from '@ionic/angular/standalone';

const MAX_TRIM = 5;

@Component({
  standalone: true,
  selector: 'video-trim-modal',
  templateUrl: './video-trim.modal.html',
  styleUrls: ['./video-trim.modal.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonSpinner]
})
export class VideoTrimModal implements AfterViewInit, OnDestroy {

  @Input() file!: File;
  @ViewChild('videoEl')       videoRef!:         ElementRef<HTMLVideoElement>;
  @ViewChild('timelineTrack') timelineTrackRef!:  ElementRef<HTMLDivElement>;

  videoUrl  = '';
  duration  = 0;
  startTime = 0;
  endTime   = 5;

  isProcessing      = false;
  processingMsg     = '';
  recordingProgress = 0;

  private isDraggingSelection = false;
  private dragStartX     = 0;
  private dragStartStart = 0;
  private dragStartEnd   = 0;
  private seekTimeout: any = null;

  constructor(private modalCtrl: ModalController, private zone: NgZone) {}

  ngAfterViewInit() {
    this.videoUrl = URL.createObjectURL(this.file);
    const video   = this.videoRef.nativeElement;
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      this.zone.run(() => {
        this.duration  = video.duration;
        this.endTime   = Math.min(MAX_TRIM, this.duration);
        this.startTime = 0;
      });
    };
    video.load();
  }

  ngOnDestroy() {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    if (this.seekTimeout) clearTimeout(this.seekTimeout);
  }

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

  onStartChange(val: number) {
    this.startTime = Math.min(val, this.endTime - 0.5);
    if (this.endTime - this.startTime > MAX_TRIM)
      this.endTime = Math.min(this.startTime + MAX_TRIM, this.duration);
    this.seekTo(this.startTime);
  }

  onEndChange(val: number) {
    this.endTime = Math.max(val, this.startTime + 0.5);
    if (this.endTime - this.startTime > MAX_TRIM)
      this.startTime = Math.max(this.endTime - MAX_TRIM, 0);
    this.seekTo(this.startTime);
  }

  onSelectionPointerDown(event: PointerEvent) {
    event.preventDefault();
    this.isDraggingSelection = true;
    this.dragStartX     = event.clientX;
    this.dragStartStart = this.startTime;
    this.dragStartEnd   = this.endTime;

    const onMove = (e: PointerEvent) => this.onSelectionPointerMove(e);
    const onUp   = () => {
      this.isDraggingSelection = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
  }

  private onSelectionPointerMove(event: PointerEvent) {
    if (!this.isDraggingSelection || !this.timelineTrackRef) return;
    const trackWidth = this.timelineTrackRef.nativeElement.getBoundingClientRect().width;
    if (trackWidth === 0) return;

    const dTime       = ((event.clientX - this.dragStartX) / trackWidth) * this.duration;
    const selDuration = this.dragStartEnd - this.dragStartStart;
    let newStart = this.dragStartStart + dTime;
    let newEnd   = newStart + selDuration;

    if (newStart < 0)           { newStart = 0;             newEnd = selDuration; }
    if (newEnd > this.duration) { newEnd = this.duration;   newStart = this.duration - selDuration; }

    this.zone.run(() => { this.startTime = newStart; this.endTime = newEnd; });
    this.seekTo(newStart);
  }

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

  get trimDuration():     number  { return Math.round((this.endTime - this.startTime) * 10) / 10; }
  get selectionTooLong(): boolean { return this.trimDuration > MAX_TRIM; }
  get selectionLeftPct(): number  { return this.duration > 0 ? (this.startTime / this.duration) * 100 : 0; }
  get selectionWidthPct():number  { return this.duration > 0 ? ((this.endTime - this.startTime) / this.duration) * 100 : 0; }
  get dimLeftWidthPct():  number  { return this.duration > 0 ? (this.startTime / this.duration) * 100 : 0; }
  get dimRightWidthPct(): number  { return this.duration > 0 ? ((this.duration - this.endTime) / this.duration) * 100 : 0; }

  // Blob slice — radi na svim uređajima, bez FFmpeg, bez MediaRecorder
  async trimAndReturn() {
    this.isProcessing     = true;
    this.processingMsg    = 'Trimming...';
    this.recordingProgress = 0;

    try {
      const mimeType  = this.file.type || 'video/mp4';
      const startByte = Math.floor((this.startTime / this.duration) * this.file.size);
      const endByte   = Math.floor((this.endTime   / this.duration) * this.file.size);

      this.recordingProgress = 60;
      const sliced      = this.file.slice(startByte, endByte, mimeType);
      const ext         = mimeType.split('/')[1] || 'mp4';
      const trimmedFile = new File([sliced], `trimmed.${ext}`, { type: mimeType });

      this.recordingProgress = 100;
      this.processingMsg     = 'Done!';
      await new Promise(r => setTimeout(r, 300));
      this.modalCtrl.dismiss(trimmedFile);

    } catch (e) {
      console.error('Trim error:', e);
      this.isProcessing  = false;
      this.processingMsg = '';
    }
  }

  skipTrim() { this.modalCtrl.dismiss(this.file); }
  cancel()   { this.modalCtrl.dismiss(null); }

  formatTime(s: number): string {
    const m   = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}