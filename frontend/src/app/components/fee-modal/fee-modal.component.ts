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
  templateUrl: './fee-modal.component.html',
  styleUrls: ['./fee-modal.component.scss']
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
