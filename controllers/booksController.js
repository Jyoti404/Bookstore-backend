const { readBooks, writeBooks } = require('../utils/fileHandler');
const { v4: uuidv4 } = require('uuid');

// GET /books
async function getBooks(req, res) {
  try {
    let books = await readBooks();
    const { genre, page, limit } = req.query;

    if (genre) {
      books = books.filter(book => 
        book.genre.toLowerCase().includes(genre.toLowerCase())
      );
    }

    if (page && limit) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedBooks = books.slice(startIndex, endIndex);
      return res.json({
        books: paginatedBooks,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(books.length / limitNum),
          totalBooks: books.length,
          hasNext: endIndex < books.length,
          hasPrev: pageNum > 1
        }
      });
    }

    res.json({ books });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /books/:id
async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const books = await readBooks();
    const book = books.find(b => b.id === id);
    if (!book)
      return res.status(404).json({ error: 'Book not found' });
    res.json({ book });
  } catch (error) {
    console.error('Get book by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /books
async function createBook(req, res) {
  try {
    const { title, author, genre, publishedYear } = req.body;

    if (!title || !author || !genre || typeof publishedYear !== 'number')
      return res.status(400).json({ error: 'Invalid book data' });

    const books = await readBooks();
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
    await writeBooks(books);
    res.status(201).json({ message: 'Book created', book: newBook });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /books/:id
async function updateBook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, genre, publishedYear } = req.body;
    const books = await readBooks();
    const index = books.findIndex(b => b.id === id);

    if (index === -1)
      return res.status(404).json({ error: 'Book not found' });

    if (books[index].userId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    books[index] = {
      ...books[index],
      ...(title && { title }),
      ...(author && { author }),
      ...(genre && { genre }),
      ...(publishedYear && { publishedYear }),
      updatedAt: new Date().toISOString()
    };

    await writeBooks(books);
    res.json({ message: 'Book updated', book: books[index] });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /books/:id
async function deleteBook(req, res) {
  try {
    const { id } = req.params;
    const books = await readBooks();
    const index = books.findIndex(b => b.id === id);

    if (index === -1)
      return res.status(404).json({ error: 'Book not found' });

    if (books[index].userId !== req.user.id)
      return res.status(403).json({ error: 'Unauthorized' });

    const deleted = books.splice(index, 1)[0];
    await writeBooks(books);
    res.json({ message: 'Book deleted', book: deleted });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /books/search
async function searchBooks(req, res) {
  try {
    const { genre } = req.query;
    if (!genre)
      return res.status(400).json({ error: 'Genre is required' });

    const books = await readBooks();
    const result = books.filter(b =>
      b.genre.toLowerCase().includes(genre.toLowerCase())
    );
    res.json({ books: result });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  searchBooks
};
