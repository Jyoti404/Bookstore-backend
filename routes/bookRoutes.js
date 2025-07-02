const express = require('express');
const router = express.Router();
const { 
  getBooks, 
  getBookById, 
  createBook, 
  updateBook, 
  deleteBook,
  searchBooks
} = require('../controllers/booksController');

const authenticateToken = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/:id', getBookById);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

module.exports = router;
