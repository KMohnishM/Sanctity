import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { User } from './entities/user.entity';
import { Comment } from './entities/comment.entity';
import { Notification } from './entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(String(process.env.DB_PORT), 10) || 5432,
      username: process.env.DB_USERNAME || 'sanctity',
      password: process.env.DB_PASSWORD || 'sanctity',
      database: process.env.DB_NAME || 'sanctity',
      entities: [User, Comment, Notification],
      synchronize: true, // Only for development; use migrations in production
      logging: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    CommentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
