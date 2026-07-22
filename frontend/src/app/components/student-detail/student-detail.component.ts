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
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.scss']
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
