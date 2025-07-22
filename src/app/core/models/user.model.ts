export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  role: UserRole;
  cargo?: string;
  status: UserStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ROLE_ADMIN = 'ROLE_ADMIN',
  ROLE_FIRMANTE = 'ROLE_FIRMANTE',
  ROLE_SERVICE = 'ROLE_SERVICE'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  LOCKED = 'LOCKED'
}

export interface JwtResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  userId: number;
  nombre: string;
  apellido: string;
  email: string;
  dni: string;
  role: UserRole;
  cargo?: string;
  status: string;
}

export interface LoginRequest {
  email?: string;
  password?: string;
  dni?: string;
  pin?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}