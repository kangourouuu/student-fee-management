import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';
import { FeeModalComponent } from '../fee-modal/fee-modal.component';
import { Student } from '../../models/student.model';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FeeModalComponent],
  template: `
    <div style="display: flex; min-height: 100vh; background: #eef2f5; position: relative; overflow: hidden;">
      
      <!-- Clay Decorative Blobs -->
      <div style="position: absolute; width: 500px; height: 500px; top: -100px; left: -150px; border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; background: rgba(179, 229, 252, 0.4); filter: blur(40px); pointer-events: none;"></div>
      <div style="position: absolute; width: 600px; height: 400px; bottom: -50px; right: -100px; border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; background: rgba(224, 242, 254, 0.5); filter: blur(50px); pointer-events: none;"></div>

      <!-- Clay Sidebar (320px) -->
      <aside class="clay-card" style="width: 320px; margin: 1.5rem; padding: 2rem 1.5rem; display: flex; flex-direction: column; justify-content: space-between; z-index: 10; height: calc(100vh - 3rem);">
        <div>
          <button (click)="goBack()" class="clay-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg> Back to Roster
          </button>

          @if (student()) {
            <div style="text-align: center; margin-bottom: 2rem;">
              <div style="width: 80px; height: 80px; margin: 0 auto 1rem; border-radius: 50%; background: #b3e5fc; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; color: #0284c7; box-shadow: inset 3px 3px 6px rgba(0,0,0,0.15);">
                {{ student()?.name?.charAt(0) }}
              </div>
              <h2 style="font-size: 1.4rem; font-weight: 700; color: #1e293b;">{{ student()?.name }}</h2>
              <p style="color: #64748b; font-size: 0.9rem; font-weight: 600; margin-top: 0.25rem;">ID: #{{ student()?.student_id }}</p>
              <span [class]="'badge-' + student()?.status" style="display: inline-block; margin-top: 0.75rem;">
                {{ student()?.status | titlecase }}
              </span>
            </div>
          }

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="clay-nav-item-active" style="padding: 0.85rem 1.25rem; border-radius: 1.5rem; font-weight: 600; color: #0284c7; display: flex; align-items: center; gap: 0.75rem;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Attendance Tracker
            </div>
          </div>
        </div>

        <div>
          <button (click)="showFeeModal.set(true)" class="clay-btn" style="width: 100%; background: #b3e5fc; color: #0369a1; text-align: center; justify-content: center; padding: 1rem; font-size: 1rem;">
            Generate Fee Export
          </button>
        </div>
      </aside>

      <!-- Main Calendar Grid Area -->
      <main style="flex: 1; padding: 1.5rem 2rem 1.5rem 0; z-index: 10; display: flex; flex-direction: column; gap: 1.5rem; overflow-y: auto;">
        
        <!-- Header -->
        <div class="clay-card" style="padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: #1e293b;">Attendance Calendar</h2>
            <p style="color: #64748b; font-size: 0.9rem;">Click any tile to toggle attendance day status</p>
          </div>

          <div style="display: flex; align-items: center; gap: 1rem;">
            <button class="clay-btn" style="padding: 0.5rem 1rem;" (click)="changeMonth(-1)">‹</button>
            <span style="font-weight: 700; color: #1e293b; font-size: 1.1rem;">{{ currentMonthLabel() }}</span>
            <button class="clay-btn" style="padding: 0.5rem 1rem;" (click)="changeMonth(1)">›</button>
          </div>
        </div>

        <!-- 2-Column Summary Metrics -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
          <div class="clay-card" style="padding: 1.5rem; text-align: center;">
            <p style="font-size: 0.85rem; font-weight: 600; color: #64748b;">Attended Sessions</p>
            <h3 style="font-size: 2.2rem; font-weight: 700; color: #0284c7; margin-top: 0.4rem;">
              {{ attendanceService.totalAttendedDays() }} days
            </h3>
          </div>

          <div class="clay-card" style="padding: 1.5rem; text-align: center;">
            <p style="font-size: 0.85rem; font-weight: 600; color: #64748b;">Attendance Rate</p>
            <h3 style="font-size: 2.2rem; font-weight: 700; color: #16a34a; margin-top: 0.4rem;">
              {{ attendanceRate() }}%
            </h3>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="clay-card" style="padding: 2rem;">
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1rem; margin-bottom: 1rem; text-align: center; font-weight: 700; color: #475569;">
            <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
          </div>

          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1rem;">
            @for (day of calendarDays(); track day.dateStr) {
              <div 
                [class]="day.isAttended ? 'clay-cell-inset' : 'clay-cell'"
                style="height: 85px; padding: 0.75rem; display: flex; flex-direction: column; justify-content: space-between;"
                (click)="toggleDay(day.dateStr, !day.isAttended)"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span [style.font-weight]="day.isAttended ? '700' : '600'" [style.color]="day.isAttended ? '#0369a1' : '#64748b'">
                    {{ day.dayNum }}
                  </span>
                  @if (day.isAttended) {
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #0284c7; box-shadow: 0 0 6px #0284c7;"></div>
                  }
                </div>
                
                <div style="font-size: 0.75rem; font-weight: 600;">
                  @if (day.isAttended) {
                    <span style="color: #0284c7;">Attended</span>
                  } @else {
                    <span style="color: #94a3b8;">Off</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </main>
    </div>

    <!-- Fee Export Modal -->
    @if (showFeeModal() && student()) {
      <app-fee-modal 
        [student]="student()!"
        [attendedDays]="attendanceService.totalAttendedDays()"
        (close)="showFeeModal.set(false)"
      ></app-fee-modal>
    }
  `
})
export class StudentDetailComponent implements OnInit {
  student = signal<Student | null>(null);
  showFeeModal = signal<boolean>(false);

  private today = new Date();
  year = signal<number>(this.today.getFullYear());
  month = signal<number>(this.today.getMonth() + 1);

  currentMonthLabel = computed(() => {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return `${months[this.month() - 1]} ${this.year()}`;
  });

  calendarDays = computed(() => {
    const daysInMonth = new Date(this.year(), this.month(), 0).getDate();
    const map = this.attendanceService.attendanceMap();
    const days = [];

    const monthStr = this.month() < 10 ? `0${this.month()}` : `${this.month()}`;

    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      const dateStr = `${this.year()}-${monthStr}-${dayStr}`;
      days.push({
        dayNum: i,
        dateStr,
        isAttended: !!map[dateStr]
      });
    }

    return days;
  });

  attendanceRate = computed(() => {
    const total = this.calendarDays().length;
    if (total === 0) return 0;
    return Math.round((this.attendanceService.totalAttendedDays() / total) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public studentService: StudentService,
    public attendanceService: AttendanceService
  ) {}

  ngOnInit() {
    const studentIdStr = this.route.snapshot.paramMap.get('id');
    if (studentIdStr) {
      const selected = this.studentService.selectedStudent();
      if (selected && selected.student_id === studentIdStr) {
        this.student.set(selected);
      } else {
        this.studentService.fetchStudents().subscribe(() => {
          const match = this.studentService.students().find(s => s.student_id === studentIdStr);
          if (match) this.student.set(match);
        });
      }

      const m = this.month();
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      this.attendanceService.fetchAttendance(studentIdStr, `${this.year()}-${monthStr}`).subscribe();
    }
  }

  toggleDay(dateStr: string, isPresent: boolean) {
    const st = this.student();
    if (!st) return;
    this.attendanceService.toggleAttendance(st.student_id, dateStr, isPresent).subscribe();
  }

  changeMonth(delta: number) {
    let m = this.month() + delta;
    let y = this.year();
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    this.month.set(m);
    this.year.set(y);

    const st = this.student();
    if (st) {
      const monthStr = m < 10 ? `0${m}` : `${m}`;
      this.attendanceService.fetchAttendance(st.student_id, `${y}-${monthStr}`).subscribe();
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
