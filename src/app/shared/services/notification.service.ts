import { Injectable } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  notifications: Notification[] = [];
  private idCounter = 0;

  private show(type: NotificationType, title: string, message?: string, duration: number = 5000) {
    const id = `notification-${++this.idCounter}`;
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration
    };

    this.notifications.push(notification);

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  success(title: string, message?: string, duration?: number) {
    return this.show('success', title, message, duration);
  }

  error(title: string, message?: string, duration?: number) {
    return this.show('error', title, message, duration);
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show('warning', title, message, duration);
  }

  info(title: string, message?: string, duration?: number) {
    return this.show('info', title, message, duration);
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  clear() {
    this.notifications = [];
  }
}