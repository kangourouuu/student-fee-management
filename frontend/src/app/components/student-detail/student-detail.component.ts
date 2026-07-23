import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';
import { FeeModalComponent } from '../fee-modal/fee-modal.component';
import { Student, StudentStatus } from '../../models/student.model';

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
    const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
    return `${months[this.month() - 1]} năm ${this.year()}`;
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

  getStatusLabel(status?: StudentStatus): string {
    if (!status) return '';
    switch (status) {
      case 'enrolled': return 'Đang học';
      case 'inactive': return 'Nghỉ học';
      case 'graduated': return 'Tốt nghiệp';
      case 'suspended': return 'Tạm dừng';
      default: return status;
    }
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

  deleteStudent() {
    const st = this.student();
    if (!st) return;
    const confirmMsg = `Bạn có chắc chắn muốn xóa học sinh "${st.name}" (Biệt danh: ${st.alias || st.student_id}) không? Tất cả dữ liệu của học sinh này sẽ bị xóa vĩnh viễn.`;
    if (confirm(confirmMsg)) {
      this.studentService.deleteStudent(st.student_id || st.id).subscribe(() => {
        this.router.navigate(['/dashboard']);
      });
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
