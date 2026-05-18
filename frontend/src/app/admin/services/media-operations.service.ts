import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';
export type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type AssignmentStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';
export type AdClientStatus = 'ACTIVE' | 'INACTIVE';
export type AdPlacement = 'HOME_TOP' | 'HOME_SIDEBAR' | 'ARTICLE_TOP' | 'ARTICLE_MIDDLE' | 'ARTICLE_BOTTOM' | 'CATEGORY_PAGE';
export type AdPaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type AdPublishStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';

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

export interface MediaOperationsAdClient {
  id: number;
  clientName: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  industry: string;
  status: AdClientStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaOperationsAdBooking {
  id: number;
  adClientId: number;
  title: string;
  placement: AdPlacement;
  startDate: string;
  endDate: string;
  price: number;
  paymentStatus: AdPaymentStatus;
  publishStatus: AdPublishStatus;
  salesOwner: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffFormValue = Omit<MediaOperationsStaff, 'id' | 'createdAt' | 'updatedAt'>;
export type AssignmentFormValue = Omit<MediaOperationsAssignment, 'id' | 'createdAt' | 'updatedAt'>;
export type AdClientFormValue = Omit<MediaOperationsAdClient, 'id' | 'createdAt' | 'updatedAt'>;
export type AdBookingFormValue = Omit<MediaOperationsAdBooking, 'id' | 'createdAt' | 'updatedAt'>;

const OPERATIONS_API_URL = `${environment.apiBaseUrl}/api/admin/operations`;

@Injectable({ providedIn: 'root' })
export class MediaOperationsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly staffSignal = signal<MediaOperationsStaff[]>([]);
  private readonly assignmentsSignal = signal<MediaOperationsAssignment[]>([]);
  private readonly adClientsSignal = signal<MediaOperationsAdClient[]>([]);
  private readonly adBookingsSignal = signal<MediaOperationsAdBooking[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal('');

  readonly staff = this.staffSignal.asReadonly();
  readonly assignments = this.assignmentsSignal.asReadonly();
  readonly adClients = this.adClientsSignal.asReadonly();
  readonly adBookings = this.adBookingsSignal.asReadonly();
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
        this.adClientsSignal.set([]);
        this.adBookingsSignal.set([]);
      }
    });
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    let hadLoadError = false;
    const recover = <T>() => {
      hadLoadError = true;
      return of([] as T[]);
    };

    forkJoin({
      staff: this.http.get<MediaOperationsStaff[]>(`${OPERATIONS_API_URL}/staff`).pipe(catchError(() => recover<MediaOperationsStaff>())),
      assignments: this.http.get<MediaOperationsAssignment[]>(`${OPERATIONS_API_URL}/assignments`).pipe(catchError(() => recover<MediaOperationsAssignment>())),
      adClients: this.http.get<MediaOperationsAdClient[]>(`${OPERATIONS_API_URL}/ad-clients`).pipe(catchError(() => recover<MediaOperationsAdClient>())),
      adBookings: this.http.get<MediaOperationsAdBooking[]>(`${OPERATIONS_API_URL}/ad-bookings`).pipe(catchError(() => recover<MediaOperationsAdBooking>()))
    }).pipe(
      map(({ staff, assignments, adClients, adBookings }) => ({
        staff: staff.map((item) => this.normalizeStaff(item)),
        assignments: assignments.map((item) => this.normalizeAssignment(item)),
        adClients: adClients.map((item) => this.normalizeAdClient(item)),
        adBookings: adBookings.map((item) => this.normalizeAdBooking(item))
      }))
    ).subscribe({
      next: ({ staff, assignments, adClients, adBookings }) => {
        this.staffSignal.set(staff);
        this.assignmentsSignal.set(assignments);
        this.adClientsSignal.set(adClients);
        this.adBookingsSignal.set(adBookings);
        this.errorSignal.set(hadLoadError ? 'Some Media Operations data could not be loaded.' : '');
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

  createAdClient(value: AdClientFormValue): Observable<MediaOperationsAdClient> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsAdClient>(`${OPERATIONS_API_URL}/ad-clients`, value).pipe(
      map((created) => this.normalizeAdClient(created)),
      tap((created) => this.adClientsSignal.update((items) => [created, ...items]))
    );
  }

  updateAdClient(id: number, value: AdClientFormValue): Observable<MediaOperationsAdClient> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsAdClient>(`${OPERATIONS_API_URL}/ad-clients/${id}`, value).pipe(
      map((updated) => this.normalizeAdClient(updated)),
      tap((updated) => this.adClientsSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createAdBooking(value: AdBookingFormValue): Observable<MediaOperationsAdBooking> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsAdBooking>(`${OPERATIONS_API_URL}/ad-bookings`, value).pipe(
      map((created) => this.normalizeAdBooking(created)),
      tap((created) => this.adBookingsSignal.update((items) => [created, ...items]))
    );
  }

  updateAdBooking(id: number, value: AdBookingFormValue): Observable<MediaOperationsAdBooking> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsAdBooking>(`${OPERATIONS_API_URL}/ad-bookings/${id}`, value).pipe(
      map((updated) => this.normalizeAdBooking(updated)),
      tap((updated) => this.adBookingsSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  staffName(id: number): string {
    return this.staffSignal().find((item) => item.id === id)?.name || 'Unassigned';
  }

  adClientName(id: number): string {
    return this.adClientsSignal().find((item) => item.id === id)?.clientName || 'Unassigned';
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

  private normalizeAdClient(adClient: MediaOperationsAdClient): MediaOperationsAdClient {
    return {
      ...adClient,
      clientName: adClient.clientName || '',
      companyName: adClient.companyName || '',
      contactPerson: adClient.contactPerson || '',
      phone: adClient.phone || '',
      email: adClient.email || '',
      address: adClient.address || '',
      industry: adClient.industry || '',
      status: adClient.status || 'ACTIVE',
      notes: adClient.notes || '',
      createdAt: adClient.createdAt || '',
      updatedAt: adClient.updatedAt || ''
    };
  }

  private normalizeAdBooking(adBooking: MediaOperationsAdBooking): MediaOperationsAdBooking {
    return {
      ...adBooking,
      adClientId: adBooking.adClientId || 0,
      title: adBooking.title || '',
      placement: adBooking.placement || 'HOME_TOP',
      startDate: adBooking.startDate || '',
      endDate: adBooking.endDate || '',
      price: Number(adBooking.price || 0),
      paymentStatus: adBooking.paymentStatus || 'UNPAID',
      publishStatus: adBooking.publishStatus || 'DRAFT',
      salesOwner: adBooking.salesOwner || '',
      notes: adBooking.notes || '',
      createdAt: adBooking.createdAt || '',
      updatedAt: adBooking.updatedAt || ''
    };
  }
}
