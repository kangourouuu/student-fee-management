import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { AttendanceRecord } from '../models/student.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private get apiUrl() {
    return `${environment.apiUrl}/api/attendance`;
  }

  attendanceMap = signal<Record<string, boolean>>({});

  private getTodayMonthStr(): string {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    return `${y}-${m < 10 ? '0' + m : m}`;
  }

  currentMonth = signal<string>(this.getTodayMonthStr());

  totalAttendedDays = computed(() => {
    return Object.values(this.attendanceMap()).filter(Boolean).length;
  });

  constructor(private http: HttpClient) {}

  fetchAttendance(studentId: string, month: string): Observable<any> {
    this.currentMonth.set(month);
    return this.http.get<any>(`${this.apiUrl}?student_id=${studentId}&month=${month}`, { withCredentials: true }).pipe(
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

  fetchAllAttendance(month: string): Observable<AttendanceRecord[]> {
    return this.http.get<any>(`${this.apiUrl}?student_id=all&month=${month}`, { withCredentials: true }).pipe(
      map((res) => {
        if (res.status === 'success' && Array.isArray(res.response?.records)) {
          return res.response.records as AttendanceRecord[];
        }
        return [];
      })
    );
  }

  toggleAttendance(studentId: string, recordDate: string, isPresent: boolean): Observable<any> {
    return this.http.post<any>(this.apiUrl, {
      student_id: studentId,
      record_date: recordDate,
      is_present: isPresent
    }, { withCredentials: true }).pipe(
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
