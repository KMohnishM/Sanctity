import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  parentId: string | null;

  @ManyToOne(() => Comment, comment => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Comment;

  @OneToMany(() => Comment, comment => comment.parent)
  replies: Comment[];

  @Column()
  userId: string;

  @ManyToOne(() => User, user => user.comments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  deletedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if comment can be edited (within 15 minutes)
  canEdit(): boolean {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.createdAt > fifteenMinutesAgo;
  }

  // Helper method to check if deleted comment can be restored (within 15 minutes)
  canRestore(): boolean {
    if (!this.isDeleted || !this.deletedAt) return false;
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.deletedAt > fifteenMinutesAgo;
  }
} 