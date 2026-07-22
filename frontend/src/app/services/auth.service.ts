import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get apiUrl() {
    return `${environment.apiUrl}/api/auth`;
  }
  
  currentUser = signal<string | null>(localStorage.getItem('admin_user'));
  isLoggedIn = signal<boolean>(!!localStorage.getItem('admin_user'));

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, { username, password }, { withCredentials: true }).pipe(
      tap((res) => {
        if (res.status === 'success') {
          const user = res.response?.username || username;
          this.currentUser.set(user);
          this.isLoggedIn.set(true);
          localStorage.setItem('admin_user', user);
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/logout`, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.currentUser.set(null);
        this.isLoggedIn.set(false);
        localStorage.removeItem('admin_user');
      })
    );
  }
}
