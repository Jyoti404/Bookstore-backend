# Bookstore REST API

A RESTful API for managing a bookstore with user authentication and file-based data persistence.

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Book Management**: Full CRUD operations for books
- **File-based Persistence**: Data stored in JSON files
- **User Authorization**: Users can only modify books they created
- **Search & Filtering**: Search books by genre
- **Pagination**: Support for paginated book listings
- **Request Logging**: All requests are logged with timestamp, method, and path
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes

## Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **JWT**: Token-based authentication
- **bcryptjs**: Password hashing
- **UUID**: Unique ID generation
- **File System**: JSON file-based data persistence
- **Jest Testing**

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd bookstore-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables (optional):
```bash
# Create a .env file in the root directory
echo "JWT_SECRET=your-super-secret-jwt-key" > .env
echo "PORT=3000" >> .env
```

4. Start the server:
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000` by default.

## API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication Endpoints

#### Register a new user
```http
POST /register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Login
```http
POST /login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Book Endpoints

**Note:** All book endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

#### Get all books
```http
GET /books
Authorization: Bearer <token>
```

**With pagination:**
```http
GET /books?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "books": [
    {
      "id": "uuid",
      "title": "Book Title",
      "author": "Author Name",
      "genre": "Fiction",
      "publishedYear": 2023,
      "userId": "user-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalBooks": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Get book by ID
```http
GET /books/:id
Authorization: Bearer <token>
```

#### Search books by genre
```http
GET /books/search?genre=fiction
Authorization: Bearer <token>
```

#### Add a new book
```http
POST /books
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New Book",
  "author": "Author Name",
  "genre": "Fiction",
  "publishedYear": 2023
}
```

#### Update a book
```http
PUT /books/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "author": "Updated Author",
  "genre": "Updated Genre",
  "publishedYear": 2024
}
```

#### Delete a book
```http
DELETE /books/:id
Authorization: Bearer <token>
```

### Health Check
```http
GET /health
```

## Testing with cURL

### 1. Register a user:
```bash
curl -X POST http://localhost:3000/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Login to get token:
```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Add a book (replace TOKEN with actual token):
```bash
curl -X POST http://localhost:3000/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"The Great Gatsby","author":"F. Scott Fitzgerald","genre":"Fiction","publishedYear":1925}'
```

### 4. Get all books:
```bash
curl -X GET http://localhost:3000/books \
  -H "Authorization: Bearer TOKEN"
```

### 5. Search books by genre:
```bash
curl -X GET "http://localhost:3000/books/search?genre=fiction" \
  -H "Authorization: Bearer TOKEN"
```

## Testing with Postman

1. **Import the collection** (you can create a Postman collection with the endpoints above)
2. **Set up environment variables:**
   - `baseUrl`: `http://localhost:3000`
   - `authToken`: `{{token}}` (will be set automatically after login)
3. **Authentication flow:**
   - Register a user
   - Login to get the token
   - Use the token for all book operations

## Data Storage

The application uses file-based storage:
- `data/users.json`: Stores user information
- `data/books.json`: Stores book information

These files are automatically created when the server starts.

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Security Features

- Password hashing using bcryptjs
- JWT token-based authentication
- User authorization (users can only modify their own books)
- Input validation
- Secure token verification

## Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch
```

## Development

```bash
# Start in development mode with auto-restart
npm run dev
```

## License

MIT License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request
