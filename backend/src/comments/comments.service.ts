import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Comment } from '../entities/comment.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, CommentTreeResponseDto } from '../dto/comment.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private notificationsGateway: NotificationsGateway
  ) {}

  // Scheduled cleanup - runs every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduledCleanup() {
    try {
      const result = await this.cleanupExpiredDeletedComments();
      if (result.deletedCount > 0) {
        console.log(`Scheduled cleanup: Permanently deleted ${result.deletedCount} expired comments`);
      }
    } catch (error) {
      console.error('Scheduled cleanup failed:', error);
    }
  }

  async createComment(createCommentDto: CreateCommentDto, userId: string): Promise<CommentResponseDto> {
    const { content, parentId } = createCommentDto;

    // If parentId is provided, verify it exists
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId, isDeleted: false },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comment = this.commentRepository.create({
      content,
      parentId,
      userId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Emit real-time comment event to all users
    this.notificationsGateway.broadcastNewComment({
      id: savedComment.id,
      content: savedComment.content,
      parentId: savedComment.parentId,
      userId: savedComment.userId,
      createdAt: savedComment.createdAt,
      updatedAt: savedComment.updatedAt,
    });

    // Create notification for parent comment author if this is a reply
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        relations: ['user'],
      });

      if (parentComment && parentComment.userId !== userId) {
        const notification = await this.notificationRepository.save({
          userId: parentComment.userId,
          commentId: savedComment.id,
          type: 'reply',
        });
        // Emit real-time notification
        this.notificationsGateway.notifyUser(parentComment.userId, {
          id: notification.id,
          type: notification.type,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          comment: {
            id: savedComment.id,
            content: savedComment.content,
            username: user.username,
          }
        });
      }
    }

    return this.mapToResponseDto(savedComment, user.username);
  }

  async getComments(): Promise<CommentTreeResponseDto> {
    const comments = await this.commentRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    // Filter for top-level comments (no parent)
    const topLevelComments = comments.filter(comment => !comment.parentId);

    const commentDtos = await Promise.all(
      topLevelComments.map(comment => this.mapToResponseDto(comment, comment.user.username))
    );

    return {
      comments: commentDtos,
      total: commentDtos.length,
    };
  }

  async updateComment(commentId: string, updateCommentDto: UpdateCommentDto, userId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (!comment.canEdit()) {
      throw new BadRequestException('Comments can only be edited within 15 minutes of posting');
    }

    comment.content = updateCommentDto.content;
    const updatedComment = await this.commentRepository.save(comment);

    return this.mapToResponseDto(updatedComment, comment.user.username);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: false },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.deletedAt = new Date();
    await this.commentRepository.save(comment);
  }

  async restoreComment(commentId: string, userId: string): Promise<CommentResponseDto> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId, isDeleted: true },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only restore your own comments');
    }

    if (!comment.canRestore()) {
      throw new BadRequestException('Comments can only be restored within 15 minutes of deletion');
    }

    comment.isDeleted = false;
    comment.deletedAt = null;
    const restoredComment = await this.commentRepository.save(comment);

    return this.mapToResponseDto(restoredComment, comment.user.username);
  }

  // Cleanup method to permanently delete comments that weren't restored within 15 minutes
  async cleanupExpiredDeletedComments(): Promise<{ deletedCount: number }> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    
    // Find all soft-deleted comments older than 15 minutes
    const expiredComments = await this.commentRepository
      .createQueryBuilder('comment')
      .where('comment.isDeleted = :isDeleted', { isDeleted: true })
      .andWhere('comment.deletedAt < :fifteenMinutesAgo', { fifteenMinutesAgo })
      .getMany();

    if (expiredComments.length === 0) {
      return { deletedCount: 0 };
    }

    // Permanently delete these comments
    const commentIds = expiredComments.map(comment => comment.id);
    await this.commentRepository.delete(commentIds);

    console.log(`Permanently deleted ${expiredComments.length} expired comments`);

    return { deletedCount: expiredComments.length };
  }

  private async mapToResponseDto(comment: Comment, username: string): Promise<CommentResponseDto> {
    const replies = await this.commentRepository.find({
      where: { parentId: comment.id },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    const replyDtos = await Promise.all(
      replies.map(reply => this.mapToResponseDto(reply, reply.user.username))
    );

    return {
      id: comment.id,
      content: comment.content,
      parentId: comment.parentId,
      userId: comment.userId,
      username,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      isDeleted: comment.isDeleted,
      deletedAt: comment.deletedAt,
      canEdit: comment.canEdit(),
      replies: replyDtos,
    };
  }
} 