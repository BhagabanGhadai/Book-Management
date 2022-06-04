const express=require('express')
const router=express.Router()
const userController = require("../controllers/userController")
const bookController = require("../controllers/bookController")
const reviewController=require("../controllers/reviewController")
const {authentication,authorization}=require("../middleWare/authentication")

router.post('/register', userController.createUser)
router.post('/login', userController.loginUser)

router.post('/books', authentication,authorization,bookController.createBook)
router.get('/books',authentication,bookController.getBook)
router.get('/books/:bookId',authentication,bookController.getBookById)
router.put('/books/:bookId',authentication,authorization,bookController.updateBook)
router.delete('/books/:bookId',authentication,authorization,bookController.deleteBook)

router.post('/books/:bookId/review', reviewController.addReview)
router.put('/books/:bookId/review/:reviewId', reviewController.updateReview)
router.delete('/books/:bookId/review/:reviewId', reviewController.deleteReview)


module.exports=router