import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Student, StudentStatus } from '../models/student.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private get apiUrl() {
    return `${environment.apiUrl}/api/students`;
  }

  students = signal<Student[]>([]);
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  selectedStudent = signal<Student | null>(null);

  filteredStudents = computed(() => {
    const list = this.students();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return list.filter((st) => {
      const matchesSearch =
        !query ||
        st.name.toLowerCase().includes(query) ||
        st.student_id.toLowerCase().includes(query) ||
        (st.alias && st.alias.toLowerCase().includes(query)) ||
        (st.phone && st.phone.toLowerCase().includes(query));

      const matchesStatus = status === 'all' || st.status === status;

      return matchesSearch && matchesStatus;
    });
  });

  constructor(private http: HttpClient) {}

  fetchStudents(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.status === 'success' && Array.isArray(res.response?.students)) {
          this.students.set(res.response.students);
        }
      })
    );
  }

  createStudent(student_id: string, name: string, alias: string, phone: string, fee_per_session: number, status: StudentStatus): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      student_id,
      name,
      alias,
      phone,
      fee_per_session,
      status
    }, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.status === 'success' && res.response?.student) {
          this.students.update((list) => [res.response.student, ...list]);
        }
      })
    );
  }

  updateStudent(student: Student): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${student.student_id}`, student, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.status === 'success' && res.response?.student) {
          const updated = res.response.student;
          this.students.update((list) => list.map(s => (s.id === updated.id || s.student_id === updated.student_id) ? updated : s));
          if (this.selectedStudent()?.id === updated.id || this.selectedStudent()?.student_id === updated.student_id) {
            this.selectedStudent.set(updated);
          }
        }
      })
    );
  }

  selectStudent(student: Student) {
    this.selectedStudent.set(student);
  }
}
