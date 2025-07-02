const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Mock the server
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const JWT_SECRET = 'test-secret';

// Test data file paths
const TEST_BOOKS_FILE = path.join(__dirname, 'test-data', 'books.json');
const TEST_USERS_FILE = path.join(__dirname, 'test-data', 'users.json');

app.use(express.json());

// Helper functions for test file operations k liyee
async function readTestBooks() {
  try {
    const data = await fs.readFile(TEST_BOOKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeTestBooks(books) {
  await fs.writeFile(TEST_BOOKS_FILE, JSON.stringify(books, null, 2));
}

async function readTestUsers() {
  try {
    const data = await fs.readFile(TEST_USERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeTestUsers(users) {
  await fs.writeFile(TEST_USERS_FILE, JSON.stringify(users, null, 2));
}

// Test authentication middleware
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const users = await readTestUsers();
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = await readTestUsers();
    
    if (users.find(user => user.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    await writeTestUsers(users);
    
    const { password: _, ...userResponse } = newUser;
    res.status(201).json({ message: 'User registered successfully', user: userResponse });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const users = await readTestUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Book Routes
app.get('/books', authenticateToken, async (req, res) => {
  try {
    const books = await readTestBooks();
    res.json({ books });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/books/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const books = await readTestBooks();
    const book = books.find(b => b.id === id);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ book });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/books', authenticateToken, async (req, res) => {
  try {
    const { title, author, genre, publishedYear } = req.body;
    
    if (!title || !author || !genre || !publishedYear) {
      return res.status(400).json({ 
        error: 'All fields are required: title, author, genre, publishedYear' 
      });
    }
    
    const books = await readTestBooks();
    
    const newBook = {
      id: uuidv4(),
      title,
      author,
      genre,
      publishedYear,
      userId: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    books.push(newBook);
    await writeTestBooks(books);
    
    res.status(201).json({ message: 'Book created successfully', book: newBook });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/books/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, genre, publishedYear } = req.body;
    
    const books = await readTestBooks();
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (books[bookIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only update books you created' });
    }
    
    const updatedBook = {
      ...books[bookIndex],
      ...(title && { title }),
      ...(author && { author }),
      ...(genre && { genre }),
      ...(publishedYear && { publishedYear }),
      updatedAt: new Date().toISOString()
    };
    
    books[bookIndex] = updatedBook;
    await writeTestBooks(books);
    
    res.json({ message: 'Book updated successfully', book: updatedBook });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/books/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const books = await readTestBooks();
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    if (books[bookIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete books you created' });
    }
    
    const deletedBook = books.splice(bookIndex, 1)[0];
    await writeTestBooks(books);
    
    res.json({ message: 'Book deleted successfully', book: deletedBook });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test Suite
describe('Bookstore API', () => {
  let testUser;
  let authToken;
  let testBook;

  beforeAll(async () => {
    // test data directory
    await fs.mkdir(path.join(__dirname, 'test-data'), { recursive: true });
  });

  beforeEach(async () => {
    // Clear test data 
    await writeTestBooks([]);
    await writeTestUsers([]);
  });

  afterAll(async () => {
    try {
      await fs.rmdir(path.join(__dirname, 'test-data'), { recursive: true });
    } catch (error) {
      
    }
  });

  describe('Authentication', () => {
    describe('POST /register', () => {
      it('should register a new user successfully', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const response = await request(app)
          .post('/register')
          .send(userData)
          .expect(201);

        expect(response.body.message).toBe('User registered successfully');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.id).toBeDefined();
        expect(response.body.user.password).toBeUndefined();
      });

      it('should return error for missing email or password', async () => {
        const response = await request(app)
          .post('/register')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body.error).toBe('Email and password are required');
      });

      it('should return error for duplicate email', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123'
        };

        // Register first user
        await request(app)
          .post('/register')
          .send(userData)
          .expect(201);

        // Try to register with same email
        const response = await request(app)
          .post('/register')
          .send(userData)
          .expect(400);

        expect(response.body.error).toBe('User already exists');
      });
    });

    describe('POST /login', () => {
      beforeEach(async () => {
        // Create a test user
        await request(app)
          .post('/register')
          .send({
            email: 'test@example.com',
            password: 'password123'
          });
      });

      it('should login successfully with valid credentials', async () => {
        const response = await request(app)
          .post('/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body.message).toBe('Login successful');
        expect(response.body.token).toBeDefined();
        expect(response.body.user.email).toBe('test@example.com');
        
        authToken = response.body.token;
      });

      it('should return error for invalid credentials', async () => {
        const response = await request(app)
          .post('/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.error).toBe('Invalid email or password');
      });

      it('should return error for missing email or password', async () => {
        const response = await request(app)
          .post('/login')
          .send({ email: 'test@example.com' })
          .expect(400);

        expect(response.body.error).toBe('Email and password are required');
      });
    });
  });

  describe('Book Management', () => {
    beforeEach(async () => {
      // Register and login user
      await request(app)
        .post('/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const loginResponse = await request(app)
        .post('/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      authToken = loginResponse.body.token;
      testUser = loginResponse.body.user;
    });

    describe('GET /books', () => {
      it('should return empty array when no books exist', async () => {
        const response = await request(app)
          .get('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.books).toEqual([]);
      });

      it('should return 401 without auth token', async () => {
        const response = await request(app)
          .get('/books')
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      });

      it('should return books when they exist', async () => {
        // Create a test book first
        const bookData = {
          title: 'Test Book',
          author: 'Test Author',
          genre: 'Fiction',
          publishedYear: 2023
        };

        await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookData);

        const response = await request(app)
          .get('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.books).toHaveLength(1);
        expect(response.body.books[0].title).toBe(bookData.title);
      });
    });

    describe('POST /books', () => {
      it('should create a new book successfully', async () => {
        const bookData = {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          genre: 'Fiction',
          publishedYear: 1925
        };

        const response = await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookData)
          .expect(201);

        expect(response.body.message).toBe('Book created successfully');
        expect(response.body.book.title).toBe(bookData.title);
        expect(response.body.book.id).toBeDefined();
        expect(response.body.book.userId).toBe(testUser.id);
        
        testBook = response.body.book;
      });

      it('should return error for missing required fields', async () => {
        const response = await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Test Book' })
          .expect(400);

        expect(response.body.error).toBe('All fields are required: title, author, genre, publishedYear');
      });

      it('should return 401 without auth token', async () => {
        const bookData = {
          title: 'Test Book',
          author: 'Test Author',
          genre: 'Fiction',
          publishedYear: 2023
        };

        const response = await request(app)
          .post('/books')
          .send(bookData)
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      });
    });

    describe('GET /books/:id', () => {
      beforeEach(async () => {
        // Create a test book
        const bookData = {
          title: 'Test Book',
          author: 'Test Author',
          genre: 'Fiction',
          publishedYear: 2023
        };

        const response = await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookData);

        testBook = response.body.book;
      });

      it('should return book by ID', async () => {
        const response = await request(app)
          .get(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.book.id).toBe(testBook.id);
        expect(response.body.book.title).toBe(testBook.title);
      });

      it('should return 404 for non-existent book', async () => {
        const response = await request(app)
          .get('/books/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBe('Book not found');
      });
    });

    describe('PUT /books/:id', () => {
      beforeEach(async () => {
        // Create a test book
        const bookData = {
          title: 'Original Title',
          author: 'Original Author',
          genre: 'Fiction',
          publishedYear: 2023
        };

        const response = await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookData);

        testBook = response.body.book;
      });

      it('should update book successfully', async () => {
        const updateData = {
          title: 'Updated Title',
          author: 'Updated Author'
        };

        const response = await request(app)
          .put(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.message).toBe('Book updated successfully');
        expect(response.body.book.title).toBe(updateData.title);
        expect(response.body.book.author).toBe(updateData.author);
        expect(response.body.book.genre).toBe(testBook.genre); // Should remain unchanged
      });

      it('should return 404 for non-existent book', async () => {
        const response = await request(app)
          .put('/books/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated Title' })
          .expect(404);

        expect(response.body.error).toBe('Book not found');
      });

      it('should return 403 when trying to update another user\'s book', async () => {
        // Create another user
        await request(app)
          .post('/register')
          .send({
            email: 'other@example.com',
            password: 'password123'
          });

        const otherLoginResponse = await request(app)
          .post('/login')
          .send({
            email: 'other@example.com',
            password: 'password123'
          });

        const otherToken = otherLoginResponse.body.token;

        const response = await request(app)
          .put(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send({ title: 'Hacked Title' })
          .expect(403);

        expect(response.body.error).toBe('You can only update books you created');
      });
    });

    describe('DELETE /books/:id', () => {
      beforeEach(async () => {
        // Create a test book
        const bookData = {
          title: 'Book to Delete',
          author: 'Test Author',
          genre: 'Fiction',
          publishedYear: 2023
        };

        const response = await request(app)
          .post('/books')
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookData);

        testBook = response.body.book;
      });

      it('should delete book successfully', async () => {
        const response = await request(app)
          .delete(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.message).toBe('Book deleted successfully');
        expect(response.body.book.id).toBe(testBook.id);

        // Verify book is actually deleted
        await request(app)
          .get(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });

      it('should return 404 for non-existent book', async () => {
        const response = await request(app)
          .delete('/books/non-existent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);

        expect(response.body.error).toBe('Book not found');
      });

      it('should return 403 when trying to delete another user\'s book', async () => {
        // Create another user
        await request(app)
          .post('/register')
          .send({
            email: 'other@example.com',
            password: 'password123'
          });

        const otherLoginResponse = await request(app)
          .post('/login')
          .send({
            email: 'other@example.com',
            password: 'password123'
          });

        const otherToken = otherLoginResponse.body.token;

        const response = await request(app)
          .delete(`/books/${testBook.id}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .expect(403);

        expect(response.body.error).toBe('You can only delete books you created');
      });
    });
  });
});