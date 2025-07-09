import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Comment } from './comment.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.notifications)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  commentId: string;

  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column()
  type: 'reply' | 'mention';

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
} 