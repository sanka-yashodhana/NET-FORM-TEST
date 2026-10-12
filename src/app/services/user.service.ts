import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../models/user.model';

const STORAGE_KEY = 'net_form_users_cache';
const API_URL_KEY = 'net_form_api_url';
const DEFAULT_API_URL = 'http://localhost:5000/api/users';

const INITIAL_MOCK_USERS: User[] = [
  {
    id: 1,
    firstName: 'Alex',
    lastName: 'Rivers',
    email: 'alex.rivers@example.com',
    birthday: '1995-04-12',
    location: 'New York, USA',
    gender: 'Male',
    technologies: ['.NET / C#', 'Angular', 'SQL Server'],
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    firstName: 'Sophia',
    lastName: 'Chen',
    email: 'sophia.chen@techcore.io',
    birthday: '1998-09-24',
    location: 'San Francisco, USA',
    gender: 'Female',
    technologies: ['Angular', 'TypeScript', 'Docker', 'Azure'],
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    firstName: 'Liam',
    lastName: 'Perera',
    email: 'liam.perera@devhub.lk',
    birthday: '1992-11-05',
    location: 'Colombo, Sri Lanka',
    gender: 'Male',
    technologies: ['.NET / C#', 'TypeScript', 'Docker'],
    createdAt: new Date().toISOString()
  }
];

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);

  // Reactive State Signals
  readonly users = signal<User[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);
  readonly selectedUserForEdit = signal<User | null>(null);
  readonly activeTab = signal<'form' | 'list'>('form');
  readonly isApiConnected = signal<boolean>(false);
  readonly isUsingLocalFallback = signal<boolean>(false);
  readonly apiUrl = signal<string>(localStorage.getItem(API_URL_KEY) || DEFAULT_API_URL);

  constructor() {
    this.initializeLocalStore();
    this.refreshUsers();
  }

  setApiUrl(newUrl: string): void {
    const trimmed = newUrl.trim();
    if (trimmed) {
      localStorage.setItem(API_URL_KEY, trimmed);
      this.apiUrl.set(trimmed);
      this.refreshUsers();
    }
  }

  setActiveTab(tab: 'form' | 'list'): void {
    this.activeTab.set(tab);
  }

  setSelectedUserForEdit(user: User | null): void {
    this.selectedUserForEdit.set(user);
    if (user) {
      this.setActiveTab('form');
    }
  }

  clearNotifications(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  showSuccess(msg: string): void {
    this.successMessage.set(msg);
    setTimeout(() => {
      if (this.successMessage() === msg) {
        this.successMessage.set(null);
      }
    }, 4500);
  }

  showError(msg: string): void {
    this.errorMessage.set(msg);
    setTimeout(() => {
      if (this.errorMessage() === msg) {
        this.errorMessage.set(null);
      }
    }, 5500);
  }

  // --- Core CRUD Operations ---

  refreshUsers(): void {
    this.isLoading.set(true);
    this.http.get<User[]>(this.apiUrl()).pipe(
      tap((apiUsers) => {
        const list = Array.isArray(apiUsers) ? apiUsers : [];
        this.users.set(list);
        this.syncToLocalStorage(list);
        this.isApiConnected.set(true);
        this.isUsingLocalFallback.set(false);
        this.isLoading.set(false);
      }),
      catchError((error: HttpErrorResponse) => {
        // Fallback to local storage if API is offline
        const localData = this.getFromLocalStorage();
        this.users.set(localData);
        this.isApiConnected.set(false);
        this.isUsingLocalFallback.set(true);
        this.isLoading.set(false);
        return of(localData);
      })
    ).subscribe();
  }

  createUser(userData: Omit<User, 'id' | 'createdAt'>): Observable<User> {
    this.isLoading.set(true);
    const payload: User = {
      ...userData,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    return this.http.post<User>(this.apiUrl(), payload).pipe(
      tap((created) => {
        const item = created || payload;
        this.users.update(current => [item, ...current]);
        this.syncToLocalStorage(this.users());
        this.isApiConnected.set(true);
        this.isUsingLocalFallback.set(false);
        this.isLoading.set(false);
        this.showSuccess(`User "${item.firstName} ${item.lastName}" registered successfully via .NET API!`);
      }),
      catchError((err: HttpErrorResponse) => {
        // Handle in fallback mode
        this.users.update(current => [payload, ...current]);
        this.syncToLocalStorage(this.users());
        this.isApiConnected.set(false);
        this.isUsingLocalFallback.set(true);
        this.isLoading.set(false);
        this.showSuccess(`User "${payload.firstName} ${payload.lastName}" saved locally (Backend offline at ${this.apiUrl()}).`);
        return of(payload);
      })
    );
  }

  updateUser(id: string | number, updatedFields: Partial<User>): Observable<User> {
    this.isLoading.set(true);
    const updatePayload = { ...updatedFields, id };
    const url = `${this.apiUrl()}/${id}`;

    return this.http.put<User>(url, updatePayload).pipe(
      tap((resp) => {
        const updated = resp || (updatePayload as User);
        this.users.update(current =>
          current.map(u => (u.id === id ? { ...u, ...updated } : u))
        );
        this.syncToLocalStorage(this.users());
        this.isLoading.set(false);
        this.selectedUserForEdit.set(null);
        this.showSuccess(`User "${updated.firstName} ${updated.lastName}" updated successfully!`);
      }),
      catchError((err: HttpErrorResponse) => {
        // Fallback update
        this.users.update(current =>
          current.map(u => (u.id === id ? { ...u, ...updatePayload } : u))
        );
        this.syncToLocalStorage(this.users());
        this.isLoading.set(false);
        this.selectedUserForEdit.set(null);
        this.showSuccess(`User updated locally (Backend offline).`);
        return of(updatePayload as User);
      })
    );
  }

  deleteUser(id: string | number): Observable<boolean> {
    this.isLoading.set(true);
    const url = `${this.apiUrl()}/${id}`;

    return this.http.delete(url).pipe(
      map(() => true),
      tap(() => {
        this.users.update(current => current.filter(u => u.id !== id));
        this.syncToLocalStorage(this.users());
        this.isLoading.set(false);
        this.showSuccess('User deleted successfully.');
      }),
      catchError((err: HttpErrorResponse) => {
        // Fallback delete
        this.users.update(current => current.filter(u => u.id !== id));
        this.syncToLocalStorage(this.users());
        this.isLoading.set(false);
        this.showSuccess('User deleted from local cache.');
        return of(true);
      })
    );
  }

  // --- Local Storage Utilities ---

  private initializeLocalStore(): void {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_USERS));
    }
  }

  private getFromLocalStorage(): User[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : INITIAL_MOCK_USERS;
    } catch {
      return INITIAL_MOCK_USERS;
    }
  }

  private syncToLocalStorage(data: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to sync to localStorage', e);
    }
  }
}
