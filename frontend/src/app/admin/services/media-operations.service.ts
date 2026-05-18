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
export type ExpenseCategory = 'REPORTING' | 'TRANSPORT' | 'EQUIPMENT' | 'OFFICE' | 'INTERNET' | 'FOOD' | 'OTHER';
export type ExpensePaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'BANK' | 'CARD' | 'OTHER';
export type ExpenseStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';
export type InvoicePaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type AttendanceShift = 'MORNING' | 'EVENING' | 'NIGHT' | 'FULL_DAY' | 'OFF_DAY';
export type AttendanceStatus = 'SCHEDULED' | 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'CANCELLED';
export type AssetType = 'CAMERA' | 'LAPTOP' | 'MICROPHONE' | 'MOBILE' | 'TRIPOD' | 'LIGHTING' | 'VEHICLE' | 'OFFICE_EQUIPMENT' | 'OTHER';
export type AssetConditionStatus = 'NEW' | 'GOOD' | 'NEEDS_REPAIR' | 'DAMAGED' | 'RETIRED';
export type AssetAvailabilityStatus = 'AVAILABLE' | 'ASSIGNED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED';
export type MediaOperationsEndpointKey = 'staff' | 'assignments' | 'adClients' | 'adBookings' | 'expenses' | 'invoices' | 'attendance' | 'assets';

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

export interface MediaOperationsExpense {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expenseDate: string;
  paidBy: string;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaOperationsInvoice {
  id: number;
  adClientId: number;
  adBookingId: number | null;
  invoiceNumber: string;
  title: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paymentStatus: InvoicePaymentStatus;
  paidAmount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaOperationsAttendance {
  id: number;
  staffId: number;
  dutyDate: string;
  shift: AttendanceShift;
  checkInTime: string;
  checkOutTime: string;
  status: AttendanceStatus;
  dutyNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface MediaOperationsAsset {
  id: number;
  assetName: string;
  assetType: AssetType;
  serialNumber: string;
  assignedStaffId: number | null;
  purchaseDate: string;
  purchasePrice: number | null;
  conditionStatus: AssetConditionStatus;
  availabilityStatus: AssetAvailabilityStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type StaffFormValue = Omit<MediaOperationsStaff, 'id' | 'createdAt' | 'updatedAt'>;
export type AssignmentFormValue = Omit<MediaOperationsAssignment, 'id' | 'createdAt' | 'updatedAt'>;
export type AdClientFormValue = Omit<MediaOperationsAdClient, 'id' | 'createdAt' | 'updatedAt'>;
export type AdBookingFormValue = Omit<MediaOperationsAdBooking, 'id' | 'createdAt' | 'updatedAt'>;
export type ExpenseFormValue = Omit<MediaOperationsExpense, 'id' | 'createdAt' | 'updatedAt'>;
export type InvoiceFormValue = Omit<MediaOperationsInvoice, 'id' | 'createdAt' | 'updatedAt'>;
export type AttendanceFormValue = Omit<MediaOperationsAttendance, 'id' | 'createdAt' | 'updatedAt'>;
export type AssetFormValue = Omit<MediaOperationsAsset, 'id' | 'createdAt' | 'updatedAt'>;

const OPERATIONS_API_URL = `${environment.apiBaseUrl}/api/admin/operations`;

@Injectable({ providedIn: 'root' })
export class MediaOperationsService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly staffSignal = signal<MediaOperationsStaff[]>([]);
  private readonly assignmentsSignal = signal<MediaOperationsAssignment[]>([]);
  private readonly adClientsSignal = signal<MediaOperationsAdClient[]>([]);
  private readonly adBookingsSignal = signal<MediaOperationsAdBooking[]>([]);
  private readonly expensesSignal = signal<MediaOperationsExpense[]>([]);
  private readonly invoicesSignal = signal<MediaOperationsInvoice[]>([]);
  private readonly attendanceSignal = signal<MediaOperationsAttendance[]>([]);
  private readonly assetsSignal = signal<MediaOperationsAsset[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal('');
  private readonly endpointErrorsSignal = signal<Partial<Record<MediaOperationsEndpointKey, string>>>({});

  readonly staff = this.staffSignal.asReadonly();
  readonly assignments = this.assignmentsSignal.asReadonly();
  readonly adClients = this.adClientsSignal.asReadonly();
  readonly adBookings = this.adBookingsSignal.asReadonly();
  readonly expenses = this.expensesSignal.asReadonly();
  readonly invoices = this.invoicesSignal.asReadonly();
  readonly attendance = this.attendanceSignal.asReadonly();
  readonly assets = this.assetsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly endpointErrors = this.endpointErrorsSignal.asReadonly();

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
        this.expensesSignal.set([]);
        this.invoicesSignal.set([]);
        this.attendanceSignal.set([]);
        this.assetsSignal.set([]);
        this.endpointErrorsSignal.set({});
      }
    });
  }

  loadAll(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set('');
    this.endpointErrorsSignal.set({});
    const endpointErrors: Partial<Record<MediaOperationsEndpointKey, string>> = {};
    const recover = <T>(key: MediaOperationsEndpointKey) => {
      endpointErrors[key] = 'Unable to load this Media Operations section.';
      return of([] as T[]);
    };

    forkJoin({
      staff: this.http.get<MediaOperationsStaff[]>(`${OPERATIONS_API_URL}/staff`).pipe(catchError(() => recover<MediaOperationsStaff>('staff'))),
      assignments: this.http.get<MediaOperationsAssignment[]>(`${OPERATIONS_API_URL}/assignments`).pipe(catchError(() => recover<MediaOperationsAssignment>('assignments'))),
      adClients: this.http.get<MediaOperationsAdClient[]>(`${OPERATIONS_API_URL}/ad-clients`).pipe(catchError(() => recover<MediaOperationsAdClient>('adClients'))),
      adBookings: this.http.get<MediaOperationsAdBooking[]>(`${OPERATIONS_API_URL}/ad-bookings`).pipe(catchError(() => recover<MediaOperationsAdBooking>('adBookings'))),
      expenses: this.http.get<MediaOperationsExpense[]>(`${OPERATIONS_API_URL}/expenses`).pipe(catchError(() => recover<MediaOperationsExpense>('expenses'))),
      invoices: this.http.get<MediaOperationsInvoice[]>(`${OPERATIONS_API_URL}/invoices`).pipe(catchError(() => recover<MediaOperationsInvoice>('invoices'))),
      attendance: this.http.get<MediaOperationsAttendance[]>(`${OPERATIONS_API_URL}/attendance`).pipe(catchError(() => recover<MediaOperationsAttendance>('attendance'))),
      assets: this.http.get<MediaOperationsAsset[]>(`${OPERATIONS_API_URL}/assets`).pipe(catchError(() => recover<MediaOperationsAsset>('assets')))
    }).pipe(
      map(({ staff, assignments, adClients, adBookings, expenses, invoices, attendance, assets }) => ({
        staff: staff.map((item) => this.normalizeStaff(item)),
        assignments: assignments.map((item) => this.normalizeAssignment(item)),
        adClients: adClients.map((item) => this.normalizeAdClient(item)),
        adBookings: adBookings.map((item) => this.normalizeAdBooking(item)),
        expenses: expenses.map((item) => this.normalizeExpense(item)),
        invoices: invoices.map((item) => this.normalizeInvoice(item)),
        attendance: attendance.map((item) => this.normalizeAttendance(item)),
        assets: assets.map((item) => this.normalizeAsset(item))
      }))
    ).subscribe({
      next: ({ staff, assignments, adClients, adBookings, expenses, invoices, attendance, assets }) => {
        this.staffSignal.set(staff);
        this.assignmentsSignal.set(assignments);
        this.adClientsSignal.set(adClients);
        this.adBookingsSignal.set(adBookings);
        this.expensesSignal.set(expenses);
        this.invoicesSignal.set(invoices);
        this.attendanceSignal.set(attendance);
        this.assetsSignal.set(assets);
        this.endpointErrorsSignal.set(endpointErrors);
        this.errorSignal.set('');
        this.loadingSignal.set(false);
      },
      error: () => {
        this.errorSignal.set('Unable to load Media Operations data.');
        this.loadingSignal.set(false);
      }
    });
  }

  errorFor(key: MediaOperationsEndpointKey): string {
    return this.endpointErrorsSignal()[key] || '';
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

  archiveStaff(id: number): Observable<MediaOperationsStaff> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsStaff>(`${OPERATIONS_API_URL}/staff/${id}`).pipe(
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

  archiveAssignment(id: number): Observable<MediaOperationsAssignment> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsAssignment>(`${OPERATIONS_API_URL}/assignments/${id}`).pipe(
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

  archiveAdClient(id: number): Observable<MediaOperationsAdClient> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsAdClient>(`${OPERATIONS_API_URL}/ad-clients/${id}`).pipe(
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

  archiveAdBooking(id: number): Observable<MediaOperationsAdBooking> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsAdBooking>(`${OPERATIONS_API_URL}/ad-bookings/${id}`).pipe(
      map((updated) => this.normalizeAdBooking(updated)),
      tap((updated) => this.adBookingsSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createExpense(value: ExpenseFormValue): Observable<MediaOperationsExpense> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsExpense>(`${OPERATIONS_API_URL}/expenses`, value).pipe(
      map((created) => this.normalizeExpense(created)),
      tap((created) => this.expensesSignal.update((items) => [created, ...items]))
    );
  }

  updateExpense(id: number, value: ExpenseFormValue): Observable<MediaOperationsExpense> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsExpense>(`${OPERATIONS_API_URL}/expenses/${id}`, value).pipe(
      map((updated) => this.normalizeExpense(updated)),
      tap((updated) => this.expensesSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  archiveExpense(id: number): Observable<MediaOperationsExpense> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsExpense>(`${OPERATIONS_API_URL}/expenses/${id}`).pipe(
      map((updated) => this.normalizeExpense(updated)),
      tap((updated) => this.expensesSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createInvoice(value: InvoiceFormValue): Observable<MediaOperationsInvoice> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsInvoice>(`${OPERATIONS_API_URL}/invoices`, value).pipe(
      map((created) => this.normalizeInvoice(created)),
      tap((created) => this.invoicesSignal.update((items) => [created, ...items]))
    );
  }

  updateInvoice(id: number, value: InvoiceFormValue): Observable<MediaOperationsInvoice> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsInvoice>(`${OPERATIONS_API_URL}/invoices/${id}`, value).pipe(
      map((updated) => this.normalizeInvoice(updated)),
      tap((updated) => this.invoicesSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  archiveInvoice(id: number): Observable<MediaOperationsInvoice> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsInvoice>(`${OPERATIONS_API_URL}/invoices/${id}`).pipe(
      map((updated) => this.normalizeInvoice(updated)),
      tap((updated) => this.invoicesSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createAttendance(value: AttendanceFormValue): Observable<MediaOperationsAttendance> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsAttendance>(`${OPERATIONS_API_URL}/attendance`, value).pipe(
      map((created) => this.normalizeAttendance(created)),
      tap((created) => this.attendanceSignal.update((items) => [created, ...items]))
    );
  }

  updateAttendance(id: number, value: AttendanceFormValue): Observable<MediaOperationsAttendance> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsAttendance>(`${OPERATIONS_API_URL}/attendance/${id}`, value).pipe(
      map((updated) => this.normalizeAttendance(updated)),
      tap((updated) => this.attendanceSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  archiveAttendance(id: number): Observable<MediaOperationsAttendance> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsAttendance>(`${OPERATIONS_API_URL}/attendance/${id}`).pipe(
      map((updated) => this.normalizeAttendance(updated)),
      tap((updated) => this.attendanceSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  createAsset(value: AssetFormValue): Observable<MediaOperationsAsset> {
    this.errorSignal.set('');

    return this.http.post<MediaOperationsAsset>(`${OPERATIONS_API_URL}/assets`, value).pipe(
      map((created) => this.normalizeAsset(created)),
      tap((created) => this.assetsSignal.update((items) => [created, ...items]))
    );
  }

  updateAsset(id: number, value: AssetFormValue): Observable<MediaOperationsAsset> {
    this.errorSignal.set('');

    return this.http.put<MediaOperationsAsset>(`${OPERATIONS_API_URL}/assets/${id}`, value).pipe(
      map((updated) => this.normalizeAsset(updated)),
      tap((updated) => this.assetsSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  archiveAsset(id: number): Observable<MediaOperationsAsset> {
    this.errorSignal.set('');

    return this.http.delete<MediaOperationsAsset>(`${OPERATIONS_API_URL}/assets/${id}`).pipe(
      map((updated) => this.normalizeAsset(updated)),
      tap((updated) => this.assetsSignal.update((items) =>
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

  adBookingTitle(id: number | null): string {
    if (!id) {
      return '-';
    }
    return this.adBookingsSignal().find((item) => item.id === id)?.title || '-';
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

  private normalizeExpense(expense: MediaOperationsExpense): MediaOperationsExpense {
    return {
      ...expense,
      title: expense.title || '',
      category: expense.category || 'OTHER',
      amount: Number(expense.amount || 0),
      expenseDate: expense.expenseDate || '',
      paidBy: expense.paidBy || '',
      paymentMethod: expense.paymentMethod || 'CASH',
      status: expense.status || 'DRAFT',
      notes: expense.notes || '',
      createdAt: expense.createdAt || '',
      updatedAt: expense.updatedAt || ''
    };
  }

  private normalizeInvoice(invoice: MediaOperationsInvoice): MediaOperationsInvoice {
    return {
      ...invoice,
      adClientId: invoice.adClientId || 0,
      adBookingId: invoice.adBookingId || null,
      invoiceNumber: invoice.invoiceNumber || '',
      title: invoice.title || '',
      amount: Number(invoice.amount || 0),
      issueDate: invoice.issueDate || '',
      dueDate: invoice.dueDate || '',
      paymentStatus: invoice.paymentStatus || 'UNPAID',
      paidAmount: Number(invoice.paidAmount || 0),
      notes: invoice.notes || '',
      createdAt: invoice.createdAt || '',
      updatedAt: invoice.updatedAt || ''
    };
  }

  private normalizeAttendance(attendance: MediaOperationsAttendance): MediaOperationsAttendance {
    return {
      ...attendance,
      staffId: attendance.staffId || 0,
      dutyDate: attendance.dutyDate || '',
      shift: attendance.shift || 'MORNING',
      checkInTime: attendance.checkInTime || '',
      checkOutTime: attendance.checkOutTime || '',
      status: attendance.status || 'SCHEDULED',
      dutyNote: attendance.dutyNote || '',
      createdAt: attendance.createdAt || '',
      updatedAt: attendance.updatedAt || ''
    };
  }

  private normalizeAsset(asset: MediaOperationsAsset): MediaOperationsAsset {
    return {
      ...asset,
      assetName: asset.assetName || '',
      assetType: asset.assetType || 'OTHER',
      serialNumber: asset.serialNumber || '',
      assignedStaffId: asset.assignedStaffId || null,
      purchaseDate: asset.purchaseDate || '',
      purchasePrice: asset.purchasePrice == null ? null : Number(asset.purchasePrice),
      conditionStatus: asset.conditionStatus || 'GOOD',
      availabilityStatus: asset.availabilityStatus || 'AVAILABLE',
      notes: asset.notes || '',
      createdAt: asset.createdAt || '',
      updatedAt: asset.updatedAt || ''
    };
  }
}
