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
  newStatus: StudentStatus = 'enrolled';

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
    this.studentService.createStudent('', this.newName, this.newAlias, this.newPhone, this.newStatus).subscribe(() => {
      this.showNewModal.set(false);
      this.newName = '';
      this.newAlias = '';
      this.newPhone = '';
    });
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
