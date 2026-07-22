import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AttendanceRecord } from '../models/student.model';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = '/api/attendance';

  attendanceMap = signal<Record<string, boolean>>({});
  currentMonth = signal<string>('2023-10');

  totalAttendedDays = computed(() => {
    return Object.values(this.attendanceMap()).filter(Boolean).length;
  });

  constructor(private http: HttpClient) {}

  fetchAttendance(studentId: string, month: string): Observable<any> {
    this.currentMonth.set(month);
    return this.http.get<any>(`${this.apiUrl}?student_id=${studentId}&month=${month}`).pipe(
      tap((res) => {
        if (res.status === 'success' && Array.isArray(res.response?.records)) {
          const map: Record<string, boolean> = {};
          res.response.records.forEach((rec: AttendanceRecord) => {
            if (rec.is_present) {
              map[rec.record_date] = true;
            }
          });
          this.attendanceMap.set(map);
        }
      })
    );
  }

  toggleAttendance(studentId: string, recordDate: string, isPresent: boolean): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      student_id: studentId,
      record_date: recordDate,
      is_present: isPresent
    }).pipe(
      tap((res) => {
        if (res.status === 'success') {
          this.attendanceMap.update((map) => {
            const next = { ...map };
            if (isPresent) {
              next[recordDate] = true;
            } else {
              delete next[recordDate];
            }
            return next;
          });
        }
      })
    );
  }
}
