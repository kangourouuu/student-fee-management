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
  template: `
    <div style="display: flex; min-height: 100vh; background: #eef2f5; position: relative; overflow: hidden;">
      
      <!-- Decorative Background Geometric Rings -->
      <div style="position: absolute; width: 400px; height: 400px; border-radius: 50%; border: 40px solid rgba(255, 255, 255, 0.3); top: -100px; right: -100px; pointer-events: none;"></div>
      <div style="position: absolute; width: 500px; height: 500px; border-radius: 50%; border: 60px solid rgba(255, 255, 255, 0.2); bottom: -150px; left: -150px; pointer-events: none;"></div>

      <!-- Sidebar -->
      <aside style="width: 280px; padding: 2rem 1.5rem; background: rgba(238, 242, 245, 0.5); backdrop-filter: blur(16px); border-right: 1px solid rgba(255, 255, 255, 0.6); display: flex; flex-direction: column; justify-content: space-between; z-index: 10;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem; padding-left: 0.5rem;">
            <div style="width: 42px; height: 42px; border-radius: 1rem; background: #b3e5fc; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #0284c7; box-shadow: 4px 4px 10px #d1d9e0, -4px -4px 10px #ffffff;">
              SF
            </div>
            <div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: #1e293b;">Fee Center</h3>
              <p style="font-size: 0.75rem; color: #64748b;">Management Portal</p>
            </div>
          </div>

          <nav style="display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="clay-nav-item-active" style="padding: 0.85rem 1.25rem; border-radius: 1.2rem; display: flex; align-items: center; gap: 0.85rem; font-weight: 600; color: #0284c7; cursor: pointer;">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
              Student Roster
            </div>
            <div style="padding: 0.85rem 1.25rem; border-radius: 1.2rem; display: flex; align-items: center; gap: 0.85rem; font-weight: 500; color: #64748b; cursor: pointer; transition: background 0.2s;" (click)="showNewModal.set(true)">
              <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
              New Registration
            </div>
          </nav>
        </div>

        <div>
          <button (click)="logout()" class="neumorphic-logout" style="width: 100%; padding: 0.85rem 1rem; border-radius: 1.2rem; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; background: rgba(238, 242, 245, 0.6); box-shadow: 4px 4px 10px #d1d9e0, -4px -4px 10px #ffffff; border: 1px solid rgba(255,255,255,0.8);">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Logout
          </button>
        </div>
      </aside>

      <!-- Main Content Container -->
      <main style="flex: 1; padding: 2.5rem; overflow-y: auto; z-index: 10;">
        
        <!-- Header Row -->
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
          <div>
            <h1 style="font-size: 2rem; font-weight: 700; color: #1e293b;">Student Roster</h1>
            <p style="color: #64748b; font-size: 0.95rem; margin-top: 0.25rem;">Manage active student enrollments and fee schedules</p>
          </div>

          <button (click)="showNewModal.set(true)" class="neumorphic-button" style="display: flex; align-items: center; gap: 0.5rem;">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg>
            Add New Student
          </button>
        </header>

        <!-- Controls / Search & Filters -->
        <div class="neumorphic" style="padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; gap: 1.5rem; flex-wrap: wrap; align-items: center; justify-content: space-between;">
          <div style="flex: 1; min-width: 280px; position: relative;">
            <input 
              type="text" 
              class="neumorphic-inset" 
              style="width: 100%; padding-left: 2.75rem; outline: none; border: 1px solid rgba(255,255,255,0.6);" 
              placeholder="Search by student name, alias or phone..."
              [ngModel]="studentService.searchQuery()"
              (ngModelChange)="studentService.searchQuery.set($event)"
            />
            <svg width="20" height="20" fill="none" stroke="#94a3b8" stroke-width="2" viewBox="0 0 24 24" style="position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%);">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <div style="display: flex; gap: 1rem; align-items: center;">
            <label style="font-weight: 600; color: #475569; font-size: 0.9rem;">Academic Status:</label>
            <select 
              class="neumorphic-inset" 
              style="outline: none; cursor: pointer; border: 1px solid rgba(255,255,255,0.6); font-weight: 500;"
              [ngModel]="studentService.statusFilter()"
              (ngModelChange)="studentService.statusFilter.set($event)"
            >
              <option value="all">All Statuses</option>
              <option value="enrolled">Enrolled</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        <!-- Roster Table / List -->
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          @if (studentService.filteredStudents().length === 0) {
            <div class="neumorphic" style="padding: 3rem; text-align: center; color: #64748b;">
              <p style="font-size: 1.1rem; font-weight: 600;">No student records registered yet</p>
              <p style="font-size: 0.9rem; margin-top: 0.5rem;">Click "Add New Student" above to register your first student.</p>
            </div>
          }

          @for (student of studentService.filteredStudents(); track student.id) {
            <div 
              class="neumorphic" 
              style="padding: 1.25rem 1.75rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;"
              (click)="openStudentDetail(student)"
            >
              <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #0369a1; box-shadow: inset 2px 2px 4px rgba(0,0,0,0.1);">
                  {{ student.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <h4 style="font-size: 1.1rem; font-weight: 700; color: #1e293b;">{{ student.name }}</h4>
                  <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">Alias: <span style="font-weight: 600; color: #475569;">{{ student.alias || student.student_id }}</span> | Phone: {{ student.phone || 'N/A' }}</p>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 1.5rem;">
                <span [class]="'badge-' + student.status">
                  {{ student.status | titlecase }}
                </span>

                <div style="width: 36px; height: 36px; border-radius: 50%; background: #eef2f5; display: flex; align-items: center; justify-content: center; box-shadow: 4px 4px 8px #d1d9e0, -4px -4px 8px #ffffff;">
                  <svg width="18" height="18" fill="none" stroke="#475569" stroke-width="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          }
        </div>
      </main>
    </div>

    <!-- Registration Modal -->
    @if (showNewModal()) {
      <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 100;">
        <div class="neu-flat" style="width: 100%; max-width: 480px; padding: 2rem; border-radius: 2rem;">
          <h3 style="font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 1.5rem;">Register New Student</h3>
          
          <form (ngSubmit)="saveStudent()">
            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Full Name</label>
              <input type="text" class="neumorphic-inset" style="width: 100%; outline: none;" [(ngModel)]="newName" name="name" placeholder="e.g. Alex Johnson" required />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Alias / Nickname</label>
              <input type="text" class="neumorphic-inset" style="width: 100%; outline: none;" [(ngModel)]="newAlias" name="alias" placeholder="e.g. Johnny" />
            </div>

            <div style="margin-bottom: 1.25rem;">
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Phone Number</label>
              <input type="text" class="neumorphic-inset" style="width: 100%; outline: none;" [(ngModel)]="newPhone" name="phone" placeholder="e.g. +1 555-0192" />
            </div>

            <div style="margin-bottom: 1.75rem;">
              <label style="display: block; font-weight: 600; color: #475569; margin-bottom: 0.4rem; font-size: 0.9rem;">Academic Status</label>
              <select class="neumorphic-inset" style="width: 100%; outline: none;" [(ngModel)]="newStatus" name="status">
                <option value="enrolled">Enrolled</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
              <button type="button" class="clay-btn" (click)="showNewModal.set(false)">Cancel</button>
              <button type="submit" class="neumorphic-button">Register Student</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
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
