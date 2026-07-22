import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Student, StudentStatus } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = '/api/students';

  students = signal<Student[]>([]);
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  selectedStudent = signal<Student | null>(null);

  filteredStudents = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.statusFilter();
    
    return this.students().filter((student) => {
      const matchesSearch = 
        student.name.toLowerCase().includes(query) ||
        student.student_id.toLowerCase().includes(query) ||
        (student.phone && student.phone.includes(query));

      const matchesStatus = filter === 'all' || student.status === filter;

      return matchesSearch && matchesStatus;
    });
  });

  constructor(private http: HttpClient) {}

  fetchStudents(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(
      tap((res) => {
        if (res.status === 'success' && Array.isArray(res.response?.students)) {
          this.students.set(res.response.students);
        }
      })
    );
  }

  createStudent(student_id: string, name: string, phone: string, status: StudentStatus): Observable<any> {
    return this.http.post<any>(this.apiUrl, { student_id, name, phone, status }).pipe(
      tap((res) => {
        if (res.status === 'success' && res.response?.student) {
          this.students.update((list) => [res.response.student, ...list]);
        }
      })
    );
  }

  selectStudent(student: Student | null) {
    this.selectedStudent.set(student);
  }
}
