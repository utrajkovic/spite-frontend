import { Component, Input, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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

  videoUrl = '';
  duration = 0;
  startTime = 0;
  endTime = 10;

  isProcessing = false;
  isLoaded = false;
  processingMsg = '';

  private ffmpeg = new FFmpeg();

  constructor(private modalCtrl: ModalController) {}

  ngAfterViewInit() {
    this.videoUrl = URL.createObjectURL(this.file);
    const video = this.videoRef.nativeElement;

    video.onloadedmetadata = () => {
      this.duration = Math.floor(video.duration);
      this.endTime = Math.min(10, this.duration);
    };
  }

  ngOnDestroy() {
    if (this.videoUrl) URL.revokeObjectURL(this.videoUrl);
  }

  onStartChange(val: number) {
    this.startTime = val;
    if (this.startTime >= this.endTime) {
      this.endTime = Math.min(this.startTime + 1, this.duration);
    }
    this.seekTo(this.startTime);
  }

  onEndChange(val: number) {
    this.endTime = val;
    if (this.endTime <= this.startTime) {
      this.startTime = Math.max(this.endTime - 1, 0);
    }
    this.seekTo(this.startTime);
  }

  seekTo(t: number) {
    const video = this.videoRef?.nativeElement;
    if (video) video.currentTime = t;
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

  get trimDuration(): number {
    return Math.round((this.endTime - this.startTime) * 10) / 10;
  }

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
        '-an',           // bez audio
        outputName
      ]);

      const data = await this.ffmpeg.readFile(outputName);
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
