export interface User {
  id?: string | number;
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
  location: string;
  gender: string;
  technologies: string[];
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}
