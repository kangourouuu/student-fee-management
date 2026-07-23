import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';
import { FeeModalComponent } from '../fee-modal/fee-modal.component';
import { Student, StudentStatus, AttendanceRecord } from '../../models/student.model';

export interface StudentStatItem {
  student: Student;
  attendedSessions: number;
  feePerSession: number;
  totalFee: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, FeeModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  activeTab = signal<'roster' | 'stats'>('roster');

  showNewModal = signal<boolean>(false);
  newName = '';
  newAlias = '';
  newPhone = '';
  newFee = 0;
  newStatus: StudentStatus = 'enrolled';

  // Edit Modal State
  showEditModal = signal<boolean>(false);
  editStudentData: Student = {
    id: '',
    student_id: '',
    name: '',
    alias: '',
    phone: '',
    fee_per_session: 0,
    status: 'enrolled'
  };

  // Fee Modal State in Stats Tab
  showFeeModal = signal<boolean>(false);
  selectedFeeStudent = signal<Student | null>(null);

  // Statistics Tab State
  private today = new Date();
  statsMonth = signal<number>(this.today.getMonth() + 1);
  statsYear = signal<number>(this.today.getFullYear());
  allAttendanceRecords = signal<AttendanceRecord[]>([]);

  studentStats = computed<StudentStatItem[]>(() => {
    const students = this.studentService.filteredStudents();
    const records = this.allAttendanceRecords();

    return students.map(student => {
      const studentRecs = records.filter(
        rec => rec.student_id === student.student_id || rec.student_id === student.id
      );
      const attendedSessions = studentRecs.length;
      const feePerSession = student.fee_per_session || 0;
      const totalFee = attendedSessions * feePerSession;

      return {
        student,
        attendedSessions,
        feePerSession,
        totalFee
      };
    });
  });

  totalStatsFee = computed<number>(() => {
    return this.studentStats().reduce((sum, item) => sum + item.totalFee, 0);
  });

  totalStatsSessions = computed<number>(() => {
    return this.studentStats().reduce((sum, item) => sum + item.attendedSessions, 0);
  });

  constructor(
    public studentService: StudentService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.studentService.fetchStudents().subscribe();
  }

  switchToStatsTab() {
    this.activeTab.set('stats');
    this.loadStatsData();
  }

  loadStatsData() {
    const m = Number(this.statsMonth());
    const y = Number(this.statsYear());
    const mStr = m < 10 ? `0${m}` : `${m}`;

    this.attendanceService.fetchAllAttendance(`${y}-${mStr}`).subscribe(records => {
      this.allAttendanceRecords.set(records);
    });
  }

  openFeeModalForStudent(student: Student) {
    this.selectedFeeStudent.set(student);
    this.showFeeModal.set(true);
  }

  saveStudent() {
    if (!this.newName) return;
    this.studentService.createStudent('', this.newName, this.newAlias, this.newPhone, this.newFee, this.newStatus).subscribe(() => {
      this.showNewModal.set(false);
      this.newName = '';
      this.newAlias = '';
      this.newPhone = '';
      this.newFee = 0;
      if (this.activeTab() === 'stats') {
        this.loadStatsData();
      }
    });
  }

  openEditModal(event: Event, student: Student) {
    event.stopPropagation();
    this.editStudentData = { ...student };
    this.showEditModal.set(true);
  }

  updateStudent() {
    if (!this.editStudentData.name) return;
    this.studentService.updateStudent(this.editStudentData).subscribe(() => {
      this.showEditModal.set(false);
      if (this.activeTab() === 'stats') {
        this.loadStatsData();
      }
    });
  }

  deleteStudent(event: Event, student: Student) {
    event.stopPropagation();
    const confirmMsg = `Bạn có chắc chắn muốn xóa học sinh "${student.name}" (Biệt danh: ${student.alias || student.student_id}) không? Dữ liệu của học sinh này sẽ bị xóa vĩnh viễn.`;
    if (confirm(confirmMsg)) {
      this.studentService.deleteStudent(student.student_id || student.id).subscribe(() => {
        if (this.activeTab() === 'stats') {
          this.loadStatsData();
        }
      });
    }
  }

  deleteStudentFromEditModal() {
    const st = this.editStudentData;
    if (!st.id && !st.student_id) return;
    const confirmMsg = `Bạn có chắc chắn muốn xóa học sinh "${st.name}" (Biệt danh: ${st.alias || st.student_id}) không? Dữ liệu của học sinh này sẽ bị xóa vĩnh viễn.`;
    if (confirm(confirmMsg)) {
      this.studentService.deleteStudent(st.student_id || st.id).subscribe(() => {
        this.showEditModal.set(false);
        if (this.activeTab() === 'stats') {
          this.loadStatsData();
        }
      });
    }
  }

  getStatusLabel(status: StudentStatus): string {
    switch (status) {
      case 'enrolled': return 'Đang học';
      case 'inactive': return 'Nghỉ học';
      case 'graduated': return 'Tốt nghiệp';
      case 'suspended': return 'Tạm dừng';
      default: return status;
    }
  }

  openStudentDetail(student: Student) {
    this.studentService.selectStudent(student);
    this.router.navigate(['/student', student.student_id]);
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}
