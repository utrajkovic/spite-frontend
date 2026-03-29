import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { IonButton, IonSpinner, IonRange } from '@ionic/angular/standalone';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

@Component({
  standalone: true,
  selector: 'video-trim-modal',
  templateUrl: './video-trim.modal.html',
  styleUrls: ['./video-trim.modal.scss'],
  imports: [CommonModule, FormsModule, IonButton, IonSpinner, IonRange]
})
export class VideoTrimModal implements AfterViewInit, OnDestroy {

  @Input() file!: File;
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('timelineTrack') timelineTrackRef!: ElementRef<HTMLDivElement>;

  videoUrl = '';
  duration = 0;
  startTime = 0;
  endTime = 10;

  isProcessing = false;
  isLoaded = false;
  processingMsg = '';

  // Drag state za selection bar
  private isDraggingSelection = false;
  private dragStartX = 0;
  private dragStartStart = 0;
  private dragStartEnd = 0;

  // Seek debounce
  private seekTimeout: any = null;

  private ffmpeg = new FFmpeg();

  constructor(private modalCtrl: ModalController, private zone: NgZone) {}

  ngAfterViewInit() {
    this.videoUrl = URL.createObjectURL(this.file);
    const video = this.videoRef.nativeElement;

    // preload=metadata je ključno za screen recordings
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      this.zone.run(() => {
        this.duration = video.duration; // ne floor-ujemo, čuvamo preciznost
        this.endTime = Math.min(10, this.duration);
      });
    };

    // Pokušaj da učita i podatke (za bolji seeking)
    video.load();
  }

  ngOnDestroy() {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
    if (this.seekTimeout) clearTimeout(this.seekTimeout);
  }

  // ========================
  // SEEKING
  // ========================

  private seekTo(t: number) {
    const video = this.videoRef?.nativeElement;
    if (!video || this.duration === 0) return;

    const clamped = Math.max(0, Math.min(t, this.duration));

    // Pauziraj pre seek-a
    video.pause();

    // Debounce za glatko seekovanje
    if (this.seekTimeout) clearTimeout(this.seekTimeout);
    this.seekTimeout = setTimeout(() => {
      // fastSeek za screen recordings (manje precizno ali brže)
      if ((video as any).fastSeek) {
        (video as any).fastSeek(clamped);
      } else {
        video.currentTime = clamped;
      }
    }, 50);
  }

  // ========================
  // START / END SLIDERS
  // ========================

  onStartChange(val: number) {
    this.startTime = Math.min(val, this.endTime - 0.5);
    this.seekTo(this.startTime);
  }

  onEndChange(val: number) {
    this.endTime = Math.max(val, this.startTime + 0.5);
    this.seekTo(this.endTime);
  }

  // ========================
  // DRAGGABLE SELECTION BAR
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

    // Clamp unutar granica
    if (newStart < 0) { newStart = 0; newEnd = selDuration; }
    if (newEnd > this.duration) { newEnd = this.duration; newStart = this.duration - selDuration; }

    this.zone.run(() => {
      this.startTime = newStart;
      this.endTime = newEnd;
    });

    // Seek na startTime dok se vuče
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

  // ========================
  // TRIM
  // ========================

  async trimAndReturn() {
    this.isProcessing = true;
    this.processingMsg = 'Loading FFmpeg...';

    try {
      if (!this.ffmpeg.loaded) {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        await this.ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
      }

      this.processingMsg = 'Trimming video...';

      const inputName = 'input.' + this.file.name.split('.').pop();
      const outputName = 'output.mp4';

      await this.ffmpeg.writeFile(inputName, await fetchFile(this.file));

      await this.ffmpeg.exec([
        '-i', inputName,
        '-ss', String(this.startTime),
        '-to', String(this.endTime),
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-an',
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
      // @ts-ignore
      const blob = new Blob([data], { type: 'video/mp4' });
      const trimmedFile = new File([blob], 'trimmed.mp4', { type: 'video/mp4' });

      this.modalCtrl.dismiss(trimmedFile);

    } catch (e) {
      console.error('FFmpeg error:', e);
      this.processingMsg = 'Error processing video.';
      setTimeout(() => { this.isProcessing = false; this.processingMsg = ''; }, 2000);
    }
  }

  skipTrim() {
    this.modalCtrl.dismiss(this.file);
  }

  cancel() {
    this.modalCtrl.dismiss(null);
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }
}