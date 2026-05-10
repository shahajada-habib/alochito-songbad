import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth.service';

const API_URL = `${environment.apiBaseUrl}/api/admin/users`;

type UserResponse = {
  id: number;
  username: string;
  displayName?: string;
  designation?: string;
  bio?: string;
  profileImageUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  emailPublic?: string;
  isPublic?: boolean;
  role: 'admin' | 'editor' | 'reporter';
  status: 'active' | 'inactive';
  createdAt: string;
};

export type ReporterOption = {
  id: number;
  username: string;
  displayName: string;
};

export interface TeamMember {
  id: number;
  name: string;
  role: 'Editor' | 'Reporter' | 'Admin';
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
  displayName: string;
  designation: string;
  bio: string;
  profileImageUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  emailPublic: string;
  isPublic: boolean;
}

export type TeamMemberFormValue = Pick<TeamMember, 'name' | 'role' | 'email' | 'status'> & {
  password?: string;
};

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);
  private readonly membersSignal = signal<TeamMember[]>([]);
  private readonly reportersSignal = signal<ReporterOption[]>([]);

  readonly members = this.membersSignal.asReadonly();
  readonly reporters = this.reportersSignal.asReadonly();

  constructor() {
    effect(() => {
      const token = this.auth.token();
      if (token && !this.auth.isTokenExpired(token) && this.auth.isAdmin()) {
        this.loadUsers();
      } else {
        this.membersSignal.set([]);
      }
    });
  }

  getAll(): TeamMember[] {
    return this.membersSignal();
  }

  getById(id: number): TeamMember | undefined {
    return this.membersSignal().find((item) => item.id === id);
  }

  create(member: TeamMemberFormValue): Observable<TeamMember> {
    this.ensureAdmin('create team member');

    return this.http.post<UserResponse>(API_URL, {
      username: member.name,
      password: member.password,
      role: this.toApiRole(member.role),
      status: member.status
    }).pipe(
      map((created) => this.toTeamMember(created)),
      tap((created) => this.membersSignal.update((items) => [created, ...items]))
    );
  }

  update(id: number, member: TeamMemberFormValue): Observable<TeamMember> {
    this.ensureAdmin('update team member');

    return this.http.patch<UserResponse>(`${API_URL}/${id}/role`, { role: this.toApiRole(member.role) }).pipe(
      switchMap(() => this.http.patch<UserResponse>(`${API_URL}/${id}/status`, { status: member.status })),
      map((updated) => this.toTeamMember(updated)),
      tap((updated) => this.membersSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  updateProfile(id: number, profile: Partial<TeamMember>): Observable<TeamMember> {
    this.ensureAdmin('update team profile');
    return this.http.patch<UserResponse>(`${API_URL}/${id}/profile`, this.toProfilePayload(profile)).pipe(
      map((updated) => this.toTeamMember(updated)),
      tap((updated) => this.membersSignal.update((items) =>
        items.map((item) => (item.id === id ? updated : item))
      ))
    );
  }

  updateMyProfile(profile: Partial<TeamMember>): Observable<TeamMember> {
    return this.http.patch<UserResponse>(`${environment.apiBaseUrl}/api/admin/profile/me`, this.toProfilePayload(profile)).pipe(
      map((updated) => this.toTeamMember(updated))
    );
  }

  delete(id: number): void {
    this.ensureAdmin('delete team member');
    this.http.patch<UserResponse>(`${API_URL}/${id}/status`, { status: 'inactive' }).subscribe({
      next: (updated) => this.membersSignal.update((items) =>
        items.map((item) => (item.id === id ? this.toTeamMember(updated) : item))
      )
    });
  }

  private loadUsers(): void {
    this.http.get<UserResponse[]>(API_URL).subscribe({
      next: (users) => this.membersSignal.set(users.map((user) => this.toTeamMember(user))),
      error: () => this.membersSignal.set([])
    });
  }

  loadReporters(): void {
    this.http.get<ReporterOption[]>(`${API_URL}/reporters`).subscribe({
      next: (reporters) => this.reportersSignal.set(reporters),
      error: () => this.reportersSignal.set([])
    });
  }

  private toTeamMember(user: UserResponse): TeamMember {
    return {
      id: user.id,
      name: user.username,
      role: this.toUiRole(user.role),
      email: '',
      status: user.status,
      createdAt: user.createdAt || '',
      displayName: user.displayName || user.username,
      designation: user.designation || '',
      bio: user.bio || '',
      profileImageUrl: user.profileImageUrl || '',
      facebookUrl: user.facebookUrl || '',
      twitterUrl: user.twitterUrl || '',
      emailPublic: user.emailPublic || '',
      isPublic: user.isPublic ?? true
    };
  }

  private toProfilePayload(profile: Partial<TeamMember>): Partial<UserResponse> {
    return {
      displayName: profile.displayName || '',
      designation: profile.designation || '',
      bio: profile.bio || '',
      profileImageUrl: profile.profileImageUrl || '',
      facebookUrl: profile.facebookUrl || '',
      twitterUrl: profile.twitterUrl || '',
      emailPublic: profile.emailPublic || '',
      isPublic: profile.isPublic ?? true
    };
  }

  private toUiRole(role: UserResponse['role']): TeamMember['role'] {
    if (role === 'admin') {
      return 'Admin';
    }

    return role === 'editor' ? 'Editor' : 'Reporter';
  }

  private toApiRole(role: TeamMember['role']): UserResponse['role'] {
    return role.toLowerCase() as UserResponse['role'];
  }

  private ensureAdmin(action: string): void {
    if (!this.auth.isAdmin()) {
      this.deny(`non-admin cannot ${action}`);
    }
  }

  private deny(message: string): never {
    console.warn(`Permission denied: ${message}`);
    throw new Error(`Permission denied: ${message}`);
  }
}
