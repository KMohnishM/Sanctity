# Comment App - Scalable Backend-Focused System

A minimalistic and highly scalable comment application built with NestJS (backend) and Next.js (frontend), emphasizing backend performance, clean architecture, and Docker-based containerization.

## Features

### Core Features
- ✅ **Secure User Authentication** - JWT-based authentication required to access and interact with the app
- ✅ **Nested Comments** - Support for replies within replies with multiple levels of nesting
- ✅ **Edit Window** - Comments can be edited only within 15 minutes of posting
- ✅ **Soft Delete with Restore** - Users can delete comments and restore them within a 15-minute grace period
- ✅ **Notification System** - Alerts users when they receive replies with read/unread toggle

### Technical Features
- ✅ **TypeScript** - Full TypeScript implementation
- ✅ **NestJS Backend** - Modular, scalable backend architecture
- ✅ **PostgreSQL Database** - Robust relational database
- ✅ **Docker Containerization** - Fully containerized application
- ✅ **Clean Architecture** - Domain-driven design with separation of concerns

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT + Passport
- **Validation**: class-validator + class-transformer
- **Language**: TypeScript

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Language**: TypeScript

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15

## Project Structure

```
Sanctity/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── entities/        # Database entities
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── auth/           # Authentication module
│   │   ├── comments/       # Comments module
│   │   ├── notifications/  # Notifications module
│   │   └── app.module.ts   # Main application module
│   ├── Dockerfile          # Backend container
│   └── package.json
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # API utilities
│   ├── Dockerfile         # Frontend container
│   └── package.json
├── docker-compose.yml      # Multi-service orchestration
└── README.md
```

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Node.js 18+ (for local development)

### Running with Docker (Recommended)

1. **Clone and navigate to the project**
   ```bash
   cd Sanctity
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Local Development

#### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Database Setup
```bash
# Using Docker for PostgreSQL
docker run --name sanctity-db -e POSTGRES_USER=sanctity -e POSTGRES_PASSWORD=sanctity -e POSTGRES_DB=sanctity -p 5432:5432 -d postgres:15
```

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Comments
- `GET /comments` - Get all comments (tree structure)
- `POST /comments` - Create a new comment
- `PUT /comments/:id` - Update a comment (within 15 minutes)
- `DELETE /comments/:id` - Soft delete a comment
- `POST /comments/:id/restore` - Restore a deleted comment (within 15 minutes)

### Notifications
- `GET /notifications` - Get user notifications
- `POST /notifications/:id/read` - Mark notification as read
- `POST /notifications/mark-all-read` - Mark all notifications as read
- `GET /notifications/unread-count` - Get unread notification count

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (Unique)
- `username`
- `password` (Hashed)
- `createdAt`, `updatedAt`

### Comments
- `id` (UUID, Primary Key)
- `content` (Text)
- `parentId` (Nullable, for nested comments)
- `userId` (Foreign Key to Users)
- `isDeleted` (Boolean)
- `deletedAt` (Nullable, for soft delete)
- `createdAt`, `updatedAt`

### Notifications
- `id` (UUID, Primary Key)
- `userId` (Foreign Key to Users)
- `commentId` (Foreign Key to Comments)
- `type` (Enum: 'reply', 'mention')
- `isRead` (Boolean)
- `createdAt`

## Key Features Implementation

### Nested Comments
- Uses recursive structure with `parentId` foreign key
- Efficient tree building with TypeORM relations
- Unlimited nesting levels supported

### Edit/Delete Restrictions
- **Edit Window**: 15-minute timer from comment creation
- **Restore Window**: 15-minute timer from deletion
- Server-side validation with helper methods

### Notification System
- Automatic notification creation on replies
- Read/unread status tracking
- Real-time notification count

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Input validation with class-validator
- CORS configuration for frontend integration

## Performance & Scalability

### Backend Optimizations
- Efficient database queries with TypeORM
- Modular architecture for easy scaling
- Stateless API design
- Connection pooling for database

### Frontend Optimizations
- Client-side state management
- Efficient re-rendering with React
- Minimal API calls with proper caching

### Docker Benefits
- Consistent environment across development/production
- Easy horizontal scaling
- Isolated services
- Simple deployment

## Development Notes

### Environment Variables
```env
# Backend
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sanctity
DB_PASSWORD=sanctity
DB_NAME=sanctity
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Database Migrations
For production, replace `synchronize: true` with proper migrations:
```typescript
// In app.module.ts
TypeOrmModule.forRoot({
  // ... other config
  synchronize: false, // Use migrations in production
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
})
```

## Testing the Application

1. **Register a new user** at http://localhost:3001/register
2. **Login** and start creating comments
3. **Test nested replies** by clicking "Reply" on comments
4. **Test edit/delete restrictions** by trying to edit after 15 minutes
5. **Check notifications** when receiving replies

## Production Deployment

### Security Considerations
- Change default JWT secret
- Use environment variables for sensitive data
- Enable HTTPS
- Implement rate limiting
- Add input sanitization

### Performance Considerations
- Use database connection pooling
- Implement caching (Redis)
- Add database indexes
- Use CDN for static assets
- Enable compression

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes. Feel free to use and modify as needed. 