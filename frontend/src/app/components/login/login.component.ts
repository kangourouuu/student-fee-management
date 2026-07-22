import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="display: flex; min-height: 100vh; align-items: center; justify-content: center; background: #eef2f5; padding: 2rem;">
      <div class="neu-flat" style="width: 100%; max-width: 420px; padding: 2.5rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <div style="width: 70px; height: 70px; margin: 0 auto 1.25rem; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; box-shadow: 6px 6px 12px #b0c2cc, -6px -6px 12px #ffffff;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2">
              <path d="M12 14l9-5-9-5-9 5 9 5z"/>
              <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
            </svg>
          </div>
          <h2 style="font-size: 1.75rem; font-weight: 700; color: #1e293b;">Fee System Sign In</h2>
          <p style="color: #64748b; font-size: 0.9rem; margin-top: 0.5rem;">Student Fee Management System</p>
        </div>

        <form (ngSubmit)="onSubmit()">
          <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem;">Username</label>
            <input 
              type="text" 
              class="neumorphic-inset" 
              style="width: 100%; outline: none; border: 1px solid rgba(255,255,255,0.6); font-size: 1rem;" 
              [(ngModel)]="username" 
              name="username"
              placeholder="e.g. admin"
              required
            />
          </div>

          <div style="margin-bottom: 2rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #475569; font-size: 0.9rem;">Password</label>
            <input 
              type="password" 
              class="neumorphic-inset" 
              style="width: 100%; outline: none; border: 1px solid rgba(255,255,255,0.6); font-size: 1rem;" 
              [(ngModel)]="password" 
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          @if (errorMessage()) {
            <div style="background: #fee2e2; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #b91c1c; font-size: 0.875rem; margin-bottom: 1.5rem; text-align: center;">
              {{ errorMessage() }}
            </div>
          }

          <button 
            type="submit" 
            class="neumorphic-button" 
            style="width: 100%; font-size: 1rem; font-weight: 700;"
            [disabled]="loading()"
          >
            {{ loading() ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  username = 'admin';
  password = 'admin123';
  errorMessage = signal<string>('');
  loading = signal<boolean>(false);

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.response?.message || 'Invalid username or password');
      }
    });
  }
}
