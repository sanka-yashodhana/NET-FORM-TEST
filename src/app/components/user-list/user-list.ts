import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.html',
  styleUrl: './user-list.css'
})
export class UserListComponent {
  protected readonly userService = inject(UserService);

  // Search input signal
  searchQuery = signal<string>('');
  
  // View mode: 'table' or 'grid'
  viewMode = signal<'table' | 'grid'>('table');

  // Deletion modal state
  userToDelete = signal<User | null>(null);

  // Filtered users computed signal (matches First Name, Last Name, or Email)
  filteredUsers = computed(() => {
    const list = this.userService.users();
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return list;
    }

    return list.filter(user => {
      const first = (user.firstName || '').toLowerCase();
      const last = (user.lastName || '').toLowerCase();
      const fullName = `${first} ${last}`;
      const email = (user.email || '').toLowerCase();

      return first.includes(query) ||
             last.includes(query) ||
             fullName.includes(query) ||
             email.includes(query);
    });
  });

  clearSearch(): void {
    this.searchQuery.set('');
  }

  refreshList(): void {
    this.userService.refreshUsers();
  }

  onEdit(user: User): void {
    this.userService.setSelectedUserForEdit(user);
  }

  promptDelete(user: User): void {
    this.userToDelete.set(user);
  }

  cancelDelete(): void {
    this.userToDelete.set(null);
  }

  confirmDelete(): void {
    const user = this.userToDelete();
    if (user && user.id !== undefined) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.userToDelete.set(null);
        },
        error: () => {
          this.userToDelete.set(null);
        }
      });
    }
  }

  getInitials(firstName: string, lastName: string): string {
    const f = firstName ? firstName[0].toUpperCase() : '';
    const l = lastName ? lastName[0].toUpperCase() : '';
    return `${f}${l}` || 'U';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  }

  calculateAge(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const birth = new Date(dateStr);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? `(${age} yrs)` : '';
    } catch {
      return '';
    }
  }

  getGenderClass(gender: string): string {
    const g = (gender || '').toLowerCase();
    if (g === 'male') return 'gender-male';
    if (g === 'female') return 'gender-female';
    return 'gender-other';
  }

  getAvatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #3b82f6, #06b6d4)',
      'linear-gradient(135deg, #ec4899, #f43f5e)',
      'linear-gradient(135deg, #10b981, #059669)',
      'linear-gradient(135deg, #f59e0b, #d97706)'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  }
}
