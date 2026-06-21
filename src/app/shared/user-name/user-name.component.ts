import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NameService } from './name.service';

/** Prikazuje display ime (fullName) za dati username; fallback je sam username. */
@Component({
  selector: 'app-user-name',
  standalone: true,
  imports: [CommonModule],
  template: `{{ display }}`
})
export class UserNameComponent implements OnChanges {
  @Input() username?: string;
  display = '';

  constructor(private names: NameService) {}

  ngOnChanges(): void {
    this.display = this.username || '';
    if (this.username) {
      this.names.getName(this.username).subscribe(n => {
        this.display = n || this.username || '';
      });
    }
  }
}
