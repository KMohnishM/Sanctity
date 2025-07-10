const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Comment {
  id: string;
  content: string;
  parentId?: string | null;
  userId: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  canEdit: boolean;
  replies?: Comment[];
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

export interface UpdateCommentRequest {
  content: string;
}

export interface Notification {
  id: string;
  type: 'reply' | 'mention';
  isRead: boolean;
  createdAt: string;
  comment: {
    id: string;
    content: string;
    username: string;
  };
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API: Making request to:', url, 'with method:', options.method || 'GET');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      console.error('Network error:', error);
      throw new Error('Network error: Unable to connect to server');
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      throw new Error(errorMessage);
    }

    try {
      return await response.json();
    } catch (e) {
      console.error('Failed to parse response:', e);
      throw new Error('Invalid response from server');
    }
  }

  // Auth endpoints
  async register(data: { email: string; username: string; password: string }): Promise<AuthResponse> {
    console.log('API: Making POST request to /auth/register with data:', data);
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Comments endpoints
  async getComments(): Promise<{ comments: Comment[]; total: number }> {
    return this.request<{ comments: Comment[]; total: number }>('/comments');
  }

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    return this.request<Comment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComment(id: string, data: UpdateCommentRequest): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreComment(id: string): Promise<Comment> {
    return this.request<Comment>(`/comments/${id}/restore`, {
      method: 'POST',
    });
  }

  async cleanupExpiredComments(): Promise<{ deletedCount: number }> {
    return this.request<{ deletedCount: number }>('/comments/cleanup/expired', {
      method: 'POST',
    });
  }

  // Notifications endpoints
  async getNotifications(): Promise<Notification[]> {
    return this.request<Notification[]>('/notifications');
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return this.request<void>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsAsRead(): Promise<void> {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.request<{ count: number }>('/notifications/unread-count');
  }
}

// Helper function to check if a deleted comment can be restored (within 15 minutes)
export function canRestoreComment(comment: Comment): boolean {
  if (!comment.isDeleted || !comment.deletedAt) return false;
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const deletedAt = new Date(comment.deletedAt);
  
  // Debug logging
  console.log('Restore check:', {
    deletedAt: deletedAt.toISOString(),
    fifteenMinutesAgo: fifteenMinutesAgo.toISOString(),
    currentTime: new Date().toISOString(),
    canRestore: deletedAt > fifteenMinutesAgo,
    timeDiff: (deletedAt.getTime() - fifteenMinutesAgo.getTime()) / (1000 * 60), // minutes
    hoursSinceDeletion: (Date.now() - deletedAt.getTime()) / (1000 * 60 * 60) // hours
  });
  
  return deletedAt > fifteenMinutesAgo;
}

export const api = new ApiService(); 