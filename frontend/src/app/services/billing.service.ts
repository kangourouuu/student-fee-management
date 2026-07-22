import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BillingExportPayload {
  student_id: string;
  billing_start_date: string;
  billing_end_date: string;
  fee_per_session: number;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private get apiUrl() {
    return `${environment.apiUrl}/api/billing/export`;
  }

  constructor(private http: HttpClient) {}

  exportExcel(payload: BillingExportPayload): Observable<Blob> {
    return this.http.post(this.apiUrl, payload, {
      responseType: 'blob',
      withCredentials: true
    });
  }
}
