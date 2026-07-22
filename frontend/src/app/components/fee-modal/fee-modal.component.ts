import { Component, Input, Output, EventEmitter, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { Student } from '../../models/student.model';
import { QR_CODE_BASE64 } from '../../constants/qr-code.constant';

@Component({
  selector: 'app-fee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem;">
      <div class="neu-flat" style="width: 100%; max-width: 480px; padding: 2.25rem; position: relative; max-height: 92vh; overflow-y: auto;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">Fee Statement Export</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.2rem;">Billing for {{ student.name }} (Nickname: {{ student.alias || 'N/A' }})</p>
          </div>
          <button (click)="close.emit()" class="neu-button" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; font-size: 1.2rem; color: #64748b;">
            ×
          </button>
        </div>

        <!-- Form Fields -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Fee Per Session</label>
            <input 
              type="number" 
              class="neu-inset" 
              style="width: 100%; padding: 0.85rem 1rem; border: none; outline: none; font-size: 1.1rem; font-weight: 700; color: #0284c7;"
              [ngModel]="feePerSession()"
              (ngModelChange)="feePerSession.set($event)"
              min="0"
            />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.85rem;">Start Date</label>
              <input type="date" class="neu-inset" style="width: 100%; padding: 0.65rem 0.85rem; border: none; outline: none; font-size: 0.9rem;" [(ngModel)]="startDate" />
            </div>

            <div>
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.85rem;">End Date</label>
              <input type="date" class="neu-inset" style="width: 100%; padding: 0.65rem 0.85rem; border: none; outline: none; font-size: 0.9rem;" [(ngModel)]="endDate" />
            </div>
          </div>
        </div>

        <!-- Calculation Panel -->
        <div class="neu-inset" style="padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Attended Days: <span style="color: #1e293b; font-weight: 700;">{{ attendedDays }} days</span></p>
            <p style="font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-top: 0.25rem;">Total Calculated Fee</p>
          </div>
          <div style="font-size: 1.75rem; font-weight: 800; color: #0284c7;">
            {{ totalFee() }}
          </div>
        </div>

        <!-- Scan to Pay Custom QR Code Module -->
        <div class="neu-button" style="padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; background: #e0f2fe;">
          <p style="font-size: 0.95rem; font-weight: 700; color: #0369a1; margin-bottom: 0.75rem;">Scan to Pay</p>
          <div style="width: 180px; height: 248px; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.12); display: flex; align-items: center; justify-content: center; background: #ffffff;">
            <img [src]="qrCodeImage" alt="Scan to Pay QR Code" style="width: 100%; height: 100%; object-fit: fill; display: block;" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button (click)="close.emit()" class="clay-btn" style="flex: 1; min-width: 90px; text-align: center; padding: 0.85rem;">
            Cancel
          </button>
          <button (click)="onExportPNG()" class="clay-btn" style="flex: 1.5; min-width: 130px; background: #e0f2fe; color: #0284c7; font-weight: 700; text-align: center; padding: 0.85rem;">
            Save as PNG
          </button>
          <button (click)="onExport()" class="neumorphic-button" style="flex: 2; min-width: 150px; text-align: center; padding: 0.85rem; font-size: 0.95rem; font-weight: 700;">
            Export Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  `
})
export class FeeModalComponent implements OnInit {
  @Input({ required: true }) student!: Student;
  @Input({ required: true }) attendedDays: number = 0;
  @Output() close = new EventEmitter<void>();

  qrCodeImage = QR_CODE_BASE64;
  feePerSession = signal<number>(25);
  startDate = '';
  endDate = '';

  totalFee = computed(() => {
    return this.attendedDays * (this.feePerSession() || 0);
  });

  constructor(private billingService: BillingService) {}

  ngOnInit() {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const monthStr = m < 10 ? `0${m}` : `${m}`;
    const dayStr = today.getDate() < 10 ? `0${today.getDate()}` : `${today.getDate()}`;

    this.startDate = `${y}-${monthStr}-01`;
    this.endDate = `${y}-${monthStr}-${dayStr}`;
  }

  onExport() {
    this.billingService.exportExcel({
      student_id: this.student.student_id,
      billing_start_date: this.startDate,
      billing_end_date: this.endDate,
      fee_per_session: this.feePerSession()
    }).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fee_Statement_${this.student.alias || this.student.student_id}_${this.startDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.close.emit();
    });
  }

  onExportPNG() {
    // High DPI 2x Scale Canvas for crisp vector-quality PNG output
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 600 * scale;
    canvas.height = 760 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Disable image smoothing for sharp, crisp pixel lines
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    // Outer Background
    ctx.fillStyle = '#eef2f5';
    ctx.fillRect(0, 0, 600, 760);

    // Card Surface
    ctx.fillStyle = '#ffffff';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(30, 30, 540, 700, 20);
      ctx.fill();
    } else {
      ctx.fillRect(30, 30, 540, 700);
    }

    // Title
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('STUDENT FEE STATEMENT', 60, 80);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 100);
    ctx.lineTo(540, 100);
    ctx.stroke();

    // Fields
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Student Name:', 60, 140);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(this.student.name, 230, 140);

    ctx.fillStyle = '#475569';
    ctx.fillText('Nickname:', 60, 175);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(this.student.alias || 'N/A', 230, 175);

    ctx.fillStyle = '#475569';
    ctx.fillText('Billing Period:', 60, 210);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(`${this.startDate} to ${this.endDate}`, 230, 210);

    // Summary Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(60, 240, 480, 150);

    ctx.fillStyle = '#475569';
    ctx.font = '16px sans-serif';
    ctx.fillText('Attended Days:', 80, 275);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${this.attendedDays} days`, 360, 275);

    ctx.fillStyle = '#475569';
    ctx.font = '16px sans-serif';
    ctx.fillText('Fee Per Session:', 80, 315);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${this.feePerSession()}`, 360, 315);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('Total Calculated Fee:', 80, 360);
    ctx.fillText(`${this.totalFee()}`, 360, 360);

    // Scan to Pay label
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Pay', 300, 420);

    // High-resolution Crisp QR Image Draw matching 942x1296 aspect ratio
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 210, 435, 180, 248);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Fee_Statement_${this.student.alias || this.student.student_id}_${this.startDate}.png`;
      a.click();
    };

    img.onerror = () => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Fee_Statement_${this.student.alias || this.student.student_id}_${this.startDate}.png`;
      a.click();
    };

    img.src = this.qrCodeImage;
  }
}
