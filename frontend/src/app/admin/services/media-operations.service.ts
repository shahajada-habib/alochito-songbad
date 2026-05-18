import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AssignmentStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

export interface MediaOperationsStaff {
  id: number;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joiningDate: string;
  status: StaffStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MediaOperationsAssignment {
  id: number;
  title: string;
  description: string;
  assignedStaffId: number;
  category: string;
  location: string;
  deadline: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffFormValue = Omit<MediaOperationsStaff, 'id' | 'createdAt' | 'updatedAt'>;
export type AssignmentFormValue = Omit<MediaOperationsAssignment, 'id' | 'createdAt' | 'updatedAt'>;

const OPERATIONS_API_URL = `${environment.apiBaseUrl}/api/admin/operations`;

@Injectable({ providedIn: 'root' })
export class MediaOperationsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly staffSignal = signal<MediaOperationsStaff[]>([]);
  private readonly assignmentsSignal = signal<MediaOperationsAssignment[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal('');

  readonly staff = this.staffSignal.asReadonly();
  readonly assignments = this.assignmentsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token && !this.auth.isTokenExpired(token)) {
        this.loadAll();
      } else {
        this.staffSignal.set([]);
        this.assignmentsSignal.set([]);
      }
    });
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set('');

    forkJoin({
      staff: this.http.get<MediaOperationsStaff[]>(`${OPERATIONS_API_URL}/staff`),
      assignments: this.http.get<MediaOperationsAssignment[]>(`${OPERATIONS_API_URL}/assignments`)
    }).pipe(
      map(({ staff, assignments }) => ({
        staff: staff.map((item) => this.normalizeStaff(item)),
        assignments: assignments.map((item) => this.normalizeAssignment(item))
      }))
    ).subscribe({
      next: ({ staff, assignments }) => {
        this.staffSignal.set(staff);
        this.assignmentsSignal.set(assignments);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Unable to load Media Operations data.');
        this.loadingSignal.set(false);
      }
    });
  }

  createStaff(value: StaffFormValue): Observable<MediaOperationsStaff> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsStaff>(`${OPERATIONS_API_URL}/staff`, value).pipe(
      map((created) => this.normalizeStaff(created)),
      tap((created) => this.staffSignal.update((items) => [created, ...items]))
    );
  }

  updateStaff(id: number, value: StaffFormValue): Observable<MediaOperationsStaff> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsStaff>(`${OPERATIONS_API_URL}/staff/${id}`, value).pipe(
      map((updated) => this.normalizeStaff(updated)),
      tap((updated) => this.staffSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createAssignment(value: AssignmentFormValue): Observable<MediaOperationsAssignment> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsAssignment>(`${OPERATIONS_API_URL}/assignments`, value).pipe(
      map((created) => this.normalizeAssignment(created)),
      tap((created) => this.assignmentsSignal.update((items) => [created, ...items]))
    );
  }

  updateAssignment(id: number, value: AssignmentFormValue): Observable<MediaOperationsAssignment> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsAssignment>(`${OPERATIONS_API_URL}/assignments/${id}`, value).pipe(
      map((updated) => this.normalizeAssignment(updated)),
      tap((updated) => this.assignmentsSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  staffName(id: number): string {
    return this.staffSignal().find((item) => item.id === id)?.name || 'Unassigned';
  }

  private normalizeStaff(staff: MediaOperationsStaff): MediaOperationsStaff {
    return {
      ...staff,
      department: staff.department || '',
      phone: staff.phone || '',
      email: staff.email || '',
      joiningDate: staff.joiningDate || '',
      status: staff.status || 'ACTIVE',
      createdAt: staff.createdAt || '',
      updatedAt: staff.updatedAt || ''
    };
  }

  private normalizeAssignment(assignment: MediaOperationsAssignment): MediaOperationsAssignment {
    return {
      ...assignment,
      description: assignment.description || '',
      category: assignment.category || '',
      location: assignment.location || '',
      deadline: assignment.deadline || '',
      priority: assignment.priority || 'MEDIUM',
      status: assignment.status || 'DRAFT',
      notes: assignment.notes || '',
      createdAt: assignment.createdAt || '',
      updatedAt: assignment.updatedAt || ''
    };
  }
}
