import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from './services/user.service';
import { UserFormComponent } from './components/user-form/user-form';
import { UserListComponent } from './components/user-list/user-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, UserFormComponent, UserListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly userService = inject(UserService);

  // Settings Modal State
  isApiConfigOpen = signal<boolean>(false);
  customApiUrlInput = signal<string>(this.userService.apiUrl());

  openApiConfig(): void {
    this.customApiUrlInput.set(this.userService.apiUrl());
    this.isApiConfigOpen.set(true);
  }

  closeApiConfig(): void {
    this.isApiConfigOpen.set(false);
  }

  saveApiConfig(): void {
    this.userService.setApiUrl(this.customApiUrlInput());
    this.closeApiConfig();
    this.userService.showSuccess(`Target API URL updated to: ${this.userService.apiUrl()}`);
  }

  resetApiToDefault(url: string): void {
    this.customApiUrlInput.set(url);
  }
}
