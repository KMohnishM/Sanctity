import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserNotifications(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { userId },
      relations: ['comment', 'comment.user'],
      order: { createdAt: 'DESC' },
    });

    return notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      comment: {
        id: notification.comment.id,
        content: notification.comment.content,
        username: notification.comment.user.username,
      },
    }));
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }
} 