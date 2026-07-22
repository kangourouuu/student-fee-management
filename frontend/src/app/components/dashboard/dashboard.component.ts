import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AuthService } from '../../services/auth.service';
import { Student, StudentStatus } from '../../models/student.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
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

  constructor(
    public studentService: StudentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.studentService.fetchStudents().subscribe();
  }

  saveStudent() {
    if (!this.newName) return;
    this.studentService.createStudent('', this.newName, this.newAlias, this.newPhone, this.newFee, this.newStatus).subscribe(() => {
      this.showNewModal.set(false);
      this.newName = '';
      this.newAlias = '';
      this.newPhone = '';
      this.newFee = 0;
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
    });
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
