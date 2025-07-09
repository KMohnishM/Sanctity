import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  content: string;
}

export class CommentResponseDto {
  id: string;
  content: string;
  parentId?: string | null;
  userId: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  canEdit: boolean;
  replies?: CommentResponseDto[];
}

export class CommentTreeResponseDto {
  comments: CommentResponseDto[];
  total: number;
} 