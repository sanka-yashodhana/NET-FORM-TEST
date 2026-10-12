import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

// Custom validator: Date cannot be in future
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const selectedDate = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (selectedDate > today) {
    return { futureDate: true };
  }
  return null;
}

// Custom validator: At least one technology selected
function minSelectedCheckboxes(min = 1) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control instanceof FormArray) {
      const totalSelected = control.controls
        .map(c => c.value)
        .reduce((prev, next) => (next ? prev + 1 : prev), 0);
      return totalSelected >= min ? null : { requireOneTechnology: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css'
})
export class UserFormComponent implements OnInit {
  protected readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  userForm!: FormGroup;
  isSubmitting = false;

  // Available technology options
  readonly technologyList: string[] = [
    '.NET / C#',
    'Angular',
    'TypeScript',
    'SQL Server',
    'Docker',
    'Azure',
    'Entity Framework',
    'Redis'
  ];

  // Location popup dropdown list
  readonly locationOptions: string[] = [
    'Colombo, Sri Lanka',
    'Kandy, Sri Lanka',
    'Galle, Sri Lanka',
    'New York, USA',
    'San Francisco, USA',
    'Seattle, USA',
    'London, UK',
    'Manchester, UK',
    'Berlin, Germany',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Melbourne, Australia',
    'Toronto, Canada',
    'Singapore',
    'Dubai, UAE'
  ];

  isLocationDropdownOpen = false;
  locationSearchQuery = '';
  customLocationInput = '';

  constructor() {
    // Listen to changes in selectedUserForEdit to populate form
    effect(() => {
      const editUser = this.userService.selectedUserForEdit();
      if (editUser && this.userForm) {
        this.populateFormForEdit(editUser);
      }
    });
  }

  ngOnInit(): void {
    this.initForm();
    const currentEdit = this.userService.selectedUserForEdit();
    if (currentEdit) {
      this.populateFormForEdit(currentEdit);
    }
  }

  private initForm(): void {
    this.userForm = this.fb.group({
      firstName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      lastName: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s'-]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      birthday: ['', [
        Validators.required,
        pastDateValidator
      ]],
      location: ['', [
        Validators.required
      ]],
      gender: ['', [
        Validators.required
      ]],
      technologies: this.fb.array(
        this.technologyList.map(() => new FormControl(false)),
        [minSelectedCheckboxes(1)]
      )
    });
  }

  get technologiesFormArray(): FormArray {
    return this.userForm.get('technologies') as FormArray;
  }

  get filteredLocations(): string[] {
    const q = this.locationSearchQuery.toLowerCase().trim();
    if (!q) return this.locationOptions;
    return this.locationOptions.filter(loc => loc.toLowerCase().includes(q));
  }

  toggleLocationDropdown(): void {
    this.isLocationDropdownOpen = !this.isLocationDropdownOpen;
    if (this.isLocationDropdownOpen) {
      this.locationSearchQuery = '';
    }
  }

  selectLocation(loc: string): void {
    this.userForm.get('location')?.setValue(loc);
    this.userForm.get('location')?.markAsTouched();
    this.isLocationDropdownOpen = false;
    this.locationSearchQuery = '';
  }

  applyCustomLocation(): void {
    const val = this.customLocationInput.trim();
    if (val) {
      this.selectLocation(val);
      this.customLocationInput = '';
    }
  }

  closeLocationDropdown(): void {
    this.isLocationDropdownOpen = false;
  }

  // Edit population
  private populateFormForEdit(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      birthday: user.birthday,
      location: user.location,
      gender: user.gender
    });

    // Populate technology checkboxes
    const techArray = this.technologiesFormArray;
    this.technologyList.forEach((tech, index) => {
      const isSelected = user.technologies && user.technologies.includes(tech);
      techArray.at(index).setValue(isSelected);
    });
    this.userForm.markAsDirty();
  }

  cancelEdit(): void {
    this.userService.setSelectedUserForEdit(null);
    this.resetForm();
  }

  resetForm(): void {
    this.userForm.reset();
    this.technologiesFormArray.controls.forEach(ctrl => ctrl.setValue(false));
    this.isLocationDropdownOpen = false;
  }

  // Form Submission
  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.userService.showError('Please correct all validation errors highlighted in the form.');
      return;
    }

    this.isSubmitting = true;

    // Collect checked technologies
    const selectedTechs = this.technologyList.filter(
      (_, index) => this.technologiesFormArray.at(index).value === true
    );

    const formValues = this.userForm.value;
    const userData: Omit<User, 'id' | 'createdAt'> = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: formValues.email.trim(),
      birthday: formValues.birthday,
      location: formValues.location,
      gender: formValues.gender,
      technologies: selectedTechs
    };

    const editingUser = this.userService.selectedUserForEdit();

    if (editingUser && editingUser.id !== undefined) {
      this.userService.updateUser(editingUser.id, userData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.resetForm();
          this.userService.setActiveTab('list');
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.resetForm();
          this.userService.setActiveTab('list');
        },
        error: () => {
          this.isSubmitting = false;
        }
      });
    }
  }

  // Field error helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'This field is required.';
    if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required.`;
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters allowed.`;
    if (field.errors['email'] || field.errors['pattern']) {
      if (fieldName === 'email') return 'Please enter a valid email address.';
      if (fieldName === 'firstName' || fieldName === 'lastName') return 'Only alphabetic characters allowed.';
    }
    if (field.errors['futureDate']) return 'Birthday cannot be in the future.';
    if (field.errors['requireOneTechnology']) return 'Please select at least one technology.';

    return 'Invalid field value.';
  }
}
