import { Injectable, signal } from '@angular/core';

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
}

export type StaffFormValue = Omit<MediaOperationsStaff, 'id'>;
export type AssignmentFormValue = Omit<MediaOperationsAssignment, 'id'>;

@Injectable({ providedIn: 'root' })
export class MediaOperationsService {
  private readonly staffSignal = signal<MediaOperationsStaff[]>([
    {
      id: 1,
      name: 'Nusrat Jahan',
      designation: 'Senior Reporter',
      department: 'National Desk',
      phone: '+8801700000001',
      email: 'nusrat@example.com',
      joiningDate: '2025-01-15',
      status: 'ACTIVE'
    },
    {
      id: 2,
      name: 'Arif Hasan',
      designation: 'Photo Journalist',
      department: 'Visual Desk',
      phone: '+8801700000002',
      email: 'arif@example.com',
      joiningDate: '2024-08-10',
      status: 'ACTIVE'
    },
    {
      id: 3,
      name: 'Mehedi Rahman',
      designation: 'Assignment Editor',
      department: 'News Desk',
      phone: '+8801700000003',
      email: 'mehedi@example.com',
      joiningDate: '2023-11-05',
      status: 'INACTIVE'
    }
  ]);

  private readonly assignmentsSignal = signal<MediaOperationsAssignment[]>([
    {
      id: 1,
      title: 'City market price follow-up',
      description: 'Collect trader and consumer comments for the evening update.',
      assignedStaffId: 1,
      category: 'Economy',
      location: 'Karwan Bazar',
      deadline: '2026-05-18T17:00',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      notes: 'Coordinate with photo desk before filing.'
    },
    {
      id: 2,
      title: 'Flood preparation visuals',
      description: 'Capture preparedness activity and shelter conditions.',
      assignedStaffId: 2,
      category: 'National',
      location: 'Sylhet',
      deadline: '2026-05-19T13:00',
      priority: 'URGENT',
      status: 'ASSIGNED',
      notes: 'Need at least six usable photos.'
    },
    {
      id: 3,
      title: 'Interview scheduling',
      description: 'Prepare slots and contact list for the weekend feature.',
      assignedStaffId: 3,
      category: 'Feature',
      location: 'Dhaka',
      deadline: '2026-05-21T11:00',
      priority: 'MEDIUM',
      status: 'DRAFT',
      notes: 'Awaiting editor confirmation.'
    }
  ]);

  readonly staff = this.staffSignal.asReadonly();
  readonly assignments = this.assignmentsSignal.asReadonly();

  createStaff(value: StaffFormValue): MediaOperationsStaff {
    const created = { ...value, id: this.nextId(this.staffSignal()) };
    this.staffSignal.update((items) => [created, ...items]);
    return created;
  }

  updateStaff(id: number, value: StaffFormValue): MediaOperationsStaff | undefined {
    let updated: MediaOperationsStaff | undefined;
    this.staffSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updated = { ...value, id };
        return updated;
      })
    );
    return updated;
  }

  createAssignment(value: AssignmentFormValue): MediaOperationsAssignment {
    const created = { ...value, id: this.nextId(this.assignmentsSignal()) };
    this.assignmentsSignal.update((items) => [created, ...items]);
    return created;
  }

  updateAssignment(id: number, value: AssignmentFormValue): MediaOperationsAssignment | undefined {
    let updated: MediaOperationsAssignment | undefined;
    this.assignmentsSignal.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updated = { ...value, id };
        return updated;
      })
    );
    return updated;
  }

  staffName(id: number): string {
    return this.staffSignal().find((item) => item.id === id)?.name || 'Unassigned';
  }

  private nextId(items: Array<{ id: number }>): number {
    return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}
