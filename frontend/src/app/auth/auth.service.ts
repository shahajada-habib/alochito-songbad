import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../environments/environment';

const SESSION_STORAGE_KEY = 'alochito_admin_session';
const TOKEN_STORAGE_KEY = 'token';
const USERNAME_STORAGE_KEY = 'username';
const ROLE_STORAGE_KEY = 'role';
const LOGIN_API_URL = `${environment.apiBaseUrl}/api/auth/login`;

export type UserRole = 'admin' | 'editor' | 'reporter';

type StoredSession = {
  token: string;
  username: string;
  role: UserRole;
};

type LoginResponse = {
  token: string;
  username: string;
  role: UserRole;
};

type JwtPayload = {
  exp?: number;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sessionSignal = signal<StoredSession | null>(this.loadSession());

  readonly token = computed(() => this.sessionSignal()?.token ?? null);
  readonly username = computed(() => this.sessionSignal()?.username ?? null);
  readonly role = computed(() => this.sessionSignal()?.role ?? null);

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<LoginResponse>(LOGIN_API_URL, {
      username: username.trim(),
      password
    }).pipe(
      map((response) => {
        const session: StoredSession = {
          token: response.token,
          username: response.username,
          role: response.role
        };

        this.sessionSignal.set(session);
        this.saveSession(session);
        return true;
      })
    );
  }

  logout(): void {
    this.sessionSignal.set(null);
    this.clearSession();
  }

  isAuthenticated(): boolean {
    const token = this.token();
    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  isTokenExpired(token = this.token()): boolean {
    if (!token) {
      return true;
    }

    const payload = this.decodeTokenPayload(token);
    if (!payload?.exp) {
      return true;
    }

    return payload.exp * 1000 <= Date.now();
  }

  isAdmin(): boolean {
    return this.role() === 'admin';
  }

  isEditor(): boolean {
    return this.role() === 'editor';
  }

  isReporter(): boolean {
    return this.role() === 'reporter';
  }

  canPublish(): boolean {
    return this.isAdmin() || this.isEditor();
  }

  canDelete(): boolean {
    return this.isAdmin();
  }

  hasRole(roles: UserRole[]): boolean {
    const currentRole = this.role();
    return !!currentRole && roles.includes(currentRole);
  }

  private loadSession(): StoredSession | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    try {
      const parsed = this.loadStoredSession(localStorage);

      if (!parsed.token || !parsed.role) {
        return null;
      }

      if (this.isTokenExpired(parsed.token)) {
        this.clearSession();
        return null;
      }

      if (parsed.role !== 'admin' && parsed.role !== 'editor' && parsed.role !== 'reporter') {
        return null;
      }

      return {
        token: parsed.token,
        username: parsed.username || parsed.role,
        role: parsed.role
      };
    } catch {
      return null;
    }
  }

  private decodeTokenPayload(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }

      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
      return null;
    }
  }

  private saveSession(session: StoredSession): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
      localStorage.setItem(USERNAME_STORAGE_KEY, session.username);
      localStorage.setItem(ROLE_STORAGE_KEY, session.role);
    } catch {
      return;
    }
  }

  private clearSession(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USERNAME_STORAGE_KEY);
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch {
      return;
    }
  }

  private loadStoredSession(storage: Storage): Partial<StoredSession> {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<StoredSession> | string;
        if (typeof parsed !== 'string') {
          return parsed;
        }
      } catch {
        return {};
      }
    }

    const storedRole = storage.getItem(ROLE_STORAGE_KEY) as UserRole | null;

    return {
      token: storage.getItem(TOKEN_STORAGE_KEY) || '',
      username: storage.getItem(USERNAME_STORAGE_KEY) || '',
      role: storedRole || undefined
    };
  }
}
