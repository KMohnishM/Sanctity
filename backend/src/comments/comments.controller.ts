import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, CommentResponseDto, CommentTreeResponseDto } from '../dto/comment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @Request() req,
  ): Promise<CommentResponseDto> {
    return this.commentsService.createComment(createCommentDto, req.user.id);
  }

  @Get()
  async getComments(): Promise<CommentTreeResponseDto> {
    return this.commentsService.getComments();
  }

  @Put(':id')
  async updateComment(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req,
  ): Promise<CommentResponseDto> {
    return this.commentsService.updateComment(id, updateCommentDto, req.user.id);
  }

  @Delete(':id')
  async deleteComment(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    await this.commentsService.deleteComment(id, req.user.id);
    return { message: 'Comment deleted successfully' };
  }

  @Post(':id/restore')
  async restoreComment(@Param('id') id: string, @Request() req): Promise<CommentResponseDto> {
    return this.commentsService.restoreComment(id, req.user.id);
  }

  @Post('cleanup/expired')
  async cleanupExpiredComments(): Promise<{ deletedCount: number }> {
    return this.commentsService.cleanupExpiredDeletedComments();
  }
} 