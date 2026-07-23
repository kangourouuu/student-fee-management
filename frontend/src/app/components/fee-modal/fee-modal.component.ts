import { Component, Input, Output, EventEmitter, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { AttendanceService } from '../../services/attendance.service';
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
  @Input() initialMonth?: number;
  @Input() initialYear?: number;
  @Output() close = new EventEmitter<void>();

  qrCodeImage = QR_CODE_BASE64;
  
  selectedMonth = 7;
  selectedYear = 2026;
  teacherNote = '';

  private monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  get feePerSession(): number {
    return this.student.fee_per_session || 0;
  }

  attendedDayChips = computed(() => {
    const map = this.attendanceService.attendanceMap();
    const m = Number(this.selectedMonth);
    const y = Number(this.selectedYear);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const prefix = `${y}-${mStr}-`;

    const dates = Object.keys(map)
      .filter(k => k.startsWith(prefix) && map[k])
      .sort();

    return dates.map(d => {
      const parts = d.split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
    });
  });

  attendedDaysCount = computed(() => {
    return this.attendedDayChips().length;
  });

  totalFee = computed(() => {
    return this.attendedDaysCount() * this.feePerSession;
  });

  constructor(
    private billingService: BillingService,
    private attendanceService: AttendanceService
  ) {}

  ngOnInit() {
    const today = new Date();
    this.selectedMonth = this.initialMonth || (today.getMonth() + 1);
    this.selectedYear = this.initialYear || today.getFullYear();

    this.onMonthChange();
  }

  onMonthChange() {
    const m = Number(this.selectedMonth);
    const y = Number(this.selectedYear);
    const mStr = m < 10 ? `0${m}` : `${m}`;

    this.attendanceService.fetchAttendance(this.student.student_id, `${y}-${mStr}`).subscribe();
  }

  get startDate(): string {
    const m = Number(this.selectedMonth);
    const y = Number(this.selectedYear);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return `${y}-${mStr}-01`;
  }

  get endDate(): string {
    const m = Number(this.selectedMonth);
    const y = Number(this.selectedYear);
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const lastDay = new Date(y, m, 0).getDate();
    const lastDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`;
    return `${y}-${mStr}-${lastDayStr}`;
  }

  get monthYearLabel(): string {
    const m = Number(this.selectedMonth);
    return `${this.monthNames[m - 1]} năm ${this.selectedYear}`;
  }

  onExport() {
    this.billingService.exportExcel({
      student_id: this.student.student_id,
      billing_start_date: this.startDate,
      billing_end_date: this.endDate,
      fee_per_session: this.feePerSession
    }).subscribe((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Phieu_Hoc_Phi_${this.student.alias || this.student.student_id}_Thang_${this.selectedMonth}_${this.selectedYear}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.close.emit();
    });
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  onExportPNG() {
    const chips = this.attendedDayChips();
    const chipW = 55;
    const chipH = 26;
    const gap = 8;
    const numRows = chips.length === 0 ? 1 : Math.ceil(chips.length / 7);
    const chipsHeight = numRows * (chipH + gap);

    // Summary Box height includes Attended Days chips + Total Days line + Fee Per Session line + Total Fee line
    const summaryBoxHeight = 35 + chipsHeight + 105;
    const summaryBoxY = 225;

    // Dummy canvas to calculate note text wrapping lines
    const dummyCanvas = document.createElement('canvas');
    const dummyCtx = dummyCanvas.getContext('2d');
    const noteText = this.teacherNote.trim() || 'Chưa có ghi chú thêm.';
    let noteLines: string[] = [noteText];
    if (dummyCtx) {
      dummyCtx.font = '13px "Be Vietnam Pro", sans-serif';
      noteLines = this.wrapText(dummyCtx, noteText, 440);
    }

    const noteLineHeight = 18;
    const noteBoxHeight = Math.max(65, 32 + (noteLines.length * noteLineHeight));
    const noteBoxY = summaryBoxY + summaryBoxHeight + 20;

    const qrTitleY = noteBoxY + noteBoxHeight + 28;
    const qrImgY = qrTitleY + 15;
    const canvasHeight = Math.max(920, qrImgY + 248 + 50);

    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 600 * scale;
    canvas.height = canvasHeight * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.imageSmoothingEnabled = false;
    (ctx as any).webkitImageSmoothingEnabled = false;
    (ctx as any).mozImageSmoothingEnabled = false;
    (ctx as any).msImageSmoothingEnabled = false;

    // Outer Background
    ctx.fillStyle = '#eef2f5';
    ctx.fillRect(0, 0, 600, canvasHeight);

    // Card Surface
    ctx.fillStyle = '#ffffff';
    if (typeof (ctx as any).roundRect === 'function') {
      (ctx as any).roundRect(30, 30, 540, canvasHeight - 60, 20);
      ctx.fill();
    } else {
      ctx.fillRect(30, 30, 540, canvasHeight - 60);
    }

    // Title: PHIẾU HỌC PHÍ
    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText('PHIẾU HỌC PHÍ', 60, 80);

    // Divider Line
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 100);
    ctx.lineTo(540, 100);
    ctx.stroke();

    // Fields
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Họ và tên:', 60, 135);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(this.student.name, 220, 135);

    ctx.fillStyle = '#475569';
    ctx.fillText('Biệt danh:', 60, 168);
    ctx.fillStyle = '#1e293b';
    ctx.fillText(this.student.alias || 'N/A', 220, 168);

    ctx.fillStyle = '#475569';
    ctx.fillText('Tháng thanh toán:', 60, 201);
    ctx.fillStyle = '#0284c7';
    ctx.fillText(this.monthYearLabel, 220, 201);

    // Summary & Attended Day Chips Container Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(60, summaryBoxY, 480, summaryBoxHeight);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(60, summaryBoxY, 480, summaryBoxHeight);

    // Attended Days Title
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 14px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Các ngày đi học:', 75, summaryBoxY + 25);

    // Render DD/MM Border Chips
    let currentX = 75;
    let currentY = summaryBoxY + 35;
    const maxX = 520;

    ctx.font = 'bold 13px "Be Vietnam Pro", sans-serif';
    if (chips.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px "Be Vietnam Pro", sans-serif';
      ctx.fillText('Chưa có ngày nào', 75, currentY + 18);
    } else {
      for (let i = 0; i < chips.length; i++) {
        if (currentX + chipW > maxX) {
          currentX = 75;
          currentY += chipH + gap;
        }

        ctx.fillStyle = '#e0f2fe';
        if (typeof (ctx as any).roundRect === 'function') {
          ctx.beginPath();
          (ctx as any).roundRect(currentX, currentY, chipW, chipH, 6);
          ctx.fill();
          ctx.strokeStyle = '#bae6fd';
          ctx.stroke();
        } else {
          ctx.fillRect(currentX, currentY, chipW, chipH);
        }

        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        ctx.fillText(chips[i], currentX + chipW / 2, currentY + 18);
        currentX += chipW + gap;
      }
    }

    ctx.textAlign = 'left';

    // Summary Values (Positioned dynamically below chips)
    const summaryTextY = summaryBoxY + 35 + chipsHeight + 20;

    ctx.fillStyle = '#475569';
    ctx.font = '15px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Tổng số buổi học:', 75, summaryTextY);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`${this.attendedDaysCount()} buổi`, 360, summaryTextY);

    ctx.fillStyle = '#475569';
    ctx.font = '15px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Học phí 1 buổi:', 75, summaryTextY + 28);
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.fillText(`${this.feePerSession}`, 360, summaryTextY + 28);

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 16px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Tổng học phí thanh toán:', 75, summaryTextY + 58);
    ctx.fillText(`${this.totalFee()}`, 360, summaryTextY + 58);

    // Dynamic Teacher Feedback Note Box
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(60, noteBoxY, 480, noteBoxHeight);
    ctx.strokeStyle = '#fef3c7';
    ctx.strokeRect(60, noteBoxY, 480, noteBoxHeight);

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 13px "Be Vietnam Pro", sans-serif';
    ctx.fillText('Nhận xét của Giáo viên:', 75, noteBoxY + 20);

    ctx.fillStyle = '#78350f';
    ctx.font = '13px "Be Vietnam Pro", sans-serif';
    for (let i = 0; i < noteLines.length; i++) {
      ctx.fillText(noteLines[i], 75, noteBoxY + 20 + 20 + (i * noteLineHeight));
    }

    // Scan to Pay label (Positioned dynamically below teacher note box)
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 15px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Quét mã thanh toán', 300, qrTitleY);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 210, qrImgY, 180, 248);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Phieu_Hoc_Phi_${this.student.alias || this.student.student_id}_Thang_${this.selectedMonth}_${this.selectedYear}.png`;
      a.click();
    };

    img.onerror = () => {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Phieu_Hoc_Phi_${this.student.alias || this.student.student_id}_Thang_${this.selectedMonth}_${this.selectedYear}.png`;
      a.click();
    };

    img.src = this.qrCodeImage;
  }
}
