import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-fee-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 1.5rem;">
      <div class="neu-flat" style="width: 100%; max-width: 460px; padding: 2.25rem; position: relative;">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <div>
            <h3 style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">Fee Statement Export</h3>
            <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.2rem;">Billing meta for {{ student.name }}</p>
          </div>
          <button (click)="close.emit()" class="neu-button" style="width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: none; font-size: 1.2rem; color: #64748b;">
            ×
          </button>
        </div>

        <!-- Form Fields -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
          <div>
            <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Fee Per Session ($)</label>
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
            \${{ totalFee() }}
          </div>
        </div>

        <!-- Scan to Pay QR Code Module -->
        <div class="neu-button" style="padding: 1.25rem; margin-bottom: 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; background: #e0f2fe;">
          <p style="font-size: 0.85rem; font-weight: 700; color: #0369a1; margin-bottom: 0.75rem;">Scan to Pay via Banking App</p>
          <div style="background: white; padding: 0.75rem; border-radius: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
            <svg width="110" height="110" viewBox="0 0 100 100" fill="#1e293b">
              <rect x="0" y="0" width="30" height="30" fill="#0284c7" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" fill="#0284c7" />
              
              <rect x="70" y="0" width="30" height="30" fill="#0284c7" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" fill="#0284c7" />

              <rect x="0" y="70" width="30" height="30" fill="#0284c7" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" fill="#0284c7" />

              <rect x="40" y="10" width="10" height="10" />
              <rect x="50" y="20" width="10" height="10" />
              <rect x="30" y="40" width="20" height="20" fill="#0284c7" />
              <rect x="60" y="40" width="10" height="20" />
              <rect x="80" y="50" width="10" height="10" />
              <rect x="40" y="70" width="20" height="10" />
              <rect x="70" y="70" width="20" height="20" fill="#0284c7" />
            </svg>
          </div>
          <span style="font-size: 0.75rem; color: #0284c7; font-weight: 600; margin-top: 0.5rem;">Account: STUDENT-FEE-{{ student.student_id }}</span>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 1rem;">
          <button (click)="close.emit()" class="clay-btn" style="flex: 1; text-align: center; padding: 0.85rem;">
            Cancel
          </button>
          <button (click)="onExport()" class="neumorphic-button" style="flex: 2; text-align: center; padding: 0.85rem; font-size: 1rem; font-weight: 700;">
            Export to Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  `
})
export class FeeModalComponent {
  @Input({ required: true }) student!: Student;
  @Input({ required: true }) attendedDays: number = 0;
  @Output() close = new EventEmitter<void>();

  feePerSession = signal<number>(25);
  startDate = '2023-10-01';
  endDate = '2023-10-31';

  totalFee = computed(() => {
    return this.attendedDays * (this.feePerSession() || 0);
  });

  constructor(private billingService: BillingService) {}

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
      a.download = `Fee_Statement_${this.student.student_id}_${this.startDate}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      this.close.emit();
    });
  }
}
