const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel')
const mongoose = require('mongoose');
const { is } = require('express/lib/request');
const aws= require("aws-sdk")
const validator=require('../validator/validator')


aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile= async ( file) =>{
   return new Promise( function(resolve, reject) {
    let s3= new aws.S3({apiVersion: '2006-03-01'}); 

    var uploadParams= {
        ACL: "public-read",
        Bucket: "classroom-training-bucket",  
        Key: "abc/" + file.originalname,  
        Body: file.buffer
    }

    s3.upload( uploadParams, function (err, data ){
        if(err) {
            return reject({"error": err})
        }
        return resolve(data.Location)
    })
})
}





/************************************************Create Book API**************************************************/

const createBook = async function (req, res) {
         try {

        let data = req.body

        let { title, excerpt, userId, ISBN, category, subcategory, releasedAt } = data

        if (!validator.isValidBody(data)) return res.status(400).send("Please enter the Book Details")

        if (!validator.isValid(title)) return res.status(400).send({ status: false, message: "Title Is Required" })
        
        let checkTitile = await bookModel.findOne({ title: title })

        if (checkTitile) return res.status(400).send({ status: false, message: "Title Already Exists" })

        if (!validator.isValid(excerpt)) return res.status(400).send({ status: false, message: "Excerpt Is Required" })

        if (!validator.isValid(userId)) return res.status(400).send({ status: false, message: "UserId is Required" })

        if (!validator.isValid(ISBN)) return res.status(400).send({ status: false, message: "ISBN is Required" })

        if(!/^\+?([1-9]{3})\)?[-. ]?([0-9]{10})$/.test(ISBN)){
        return res.status(400).send({ status: false, message: 'Please provide a valid ISBN(ISBN should be 13 digit)' })}

        let checkISBN = await bookModel.findOne({ ISBN: ISBN })

        if (checkISBN) return res.status(400).send({ status: false, message: "ISBN Already Exists" })

        if (!validator.isValid(category)) return res.status(400).send({ status: false, message: "Category is Required" })

        if (!validator.isValid(subcategory)) return res.status(400).send({ status: false, message: "Subcategory is Required" })

        let subCategory=subcategory.split(',').map((x)=>(x.trim()))
        data.subcategory=subCategory
    
        if (!validator.isValid(releasedAt)) return res.status(400).send({ status: false, message: "ReleasedAt must be Present" })

        if(!/((\d{4}[\/-])(\d{2}[\/-])(\d{2}))/.test(releasedAt)){
        return res.status(400).send({ status: false, message: 'Please provide a valid Date(YYYY-MM-DD)' })} 

        if (data.isDeleted == true) data.deletedAt = Date.now()

        let files=req.files

        if (!(files&&files.length)) {
            return res.status(400).send({ status: false, message: " Please Provide The Profile Image" });}

        const uploadedBookImage = await uploadFile(files[0])

        data.bookImage=uploadedBookImage
        
        const newBook = await bookModel.create(data);

        res.status(201).send({ status: true, message: "Book created successfully", data: newBook })

     } catch (err) {
        return res.status(500).send({ status: false, error: err.message })
    }
}

/************************************************Get Book Details API**********************************************/

const getBook = async function (req, res) {
    try {

        let data = req.query
        data.isDeleted = false
        
        if (!validator.isValidString(data.userId))return res.status(400).send({ status: false, message: "UserId Not Found" })
        
        if(data.userId){
        if (!validator.isValidObjectId(data.userId)) return res.status(400).send({ status: false, message: `Invalid userId.` })
        let checkUser = await userModel.findById(data.userId)
        if (!checkUser) return res.status(404).send({ status: false, message: "UserId Not Found" })
        }

        if (!validator.isValidString(data.category))return res.status(400).send({ status: false, message: "category Not Found" })
        
        if (!validator.isValidString(data.subcategory))return res.status(400).send({ status: false, message: "subcategory Not Found" })
        if(data.subcategory){
        let subCategory=data.subcategory.split(',').map((x)=>(x.trim()))
        data.subcategory=subCategory
        }
        const bookList= await bookModel.find(data)
        .select({ subcategory: 0, ISBN: 0, isDeleted: 0, updatedAt: 0, createdAt: 0, __v: 0 }).sort({ title: 1 });

        if (!bookList.length) return res.status(404).send({ status: false, message: "Book Not Found" })
        
        res.status(200).send({ status: true, message: "Book List", data: bookList })

    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}

/**********************************************Get Book Details By ID**********************************************/

const getBookById = async function (req, res) {
    try {

        let book_id = req.params.bookId

        if (!validator.isValidObjectId(book_id)) return res.status(400).send({ status: false, message: "Invalid userId." })

        let checkBook = await bookModel.findOne({ _id: book_id, isDeleted: false }).lean()

        if (!checkBook) return res.status(400).send({ status: false, message: "BookId Not Found" })

        const getReviewsData = await reviewModel.find({ bookId: checkBook._id, isDeleted: false })
            .select({ deletedAt: 0, isDeleted: 0, createdAt: 0, __v: 0, updatedAt: 0 })

        checkBook.reviewsData = getReviewsData

        res.status(200).send({ status: true, message: "Book List", data: checkBook })

    } catch (err) {
        res.status(500).send({ status: false, error: err.message })
    }
}


/****************************************************Update Book Details*********************************************/

const updateBook = async function (req, res) {
    try {

        const book_id = req.params.bookId
        const data = req.body

        if (!validator.isValidBody(data)) return res.status(400).send("To Update Please enter the Book Details")

        if (!validator.isValidString(data.title)) return res.status(400).send({ status: false, message: "Title Is Required" })
        if(data.title){
        const checkTitle = await bookModel.findOne({ title: data.title, isDeleted: false })
        if (checkTitle) return res.status(400).send({ status: false, message: `${data.title} is already exists.Please add a new title.` })
        }
        
        if (!validator.isValidString(data.excerpt)) return res.status(400).send({ status: false, message: "Excerpt Is Required" })
        
        if (!validator.isValidString(data.ISBN)) return res.status(400).send({ status: false, message: "ISBN Is Required" }) 
        if(data.ISBN){
        if(!/^\+?([1-9]{3})\)?[-. ]?([0-9]{10})$/.test(data.ISBN)){
        return res.status(400).send({ status: false, message: 'Please provide a valid ISBN(ISBN should be 13 digit)' })}
        const checkIsbn = await bookModel.findOne({ ISBN: data.ISBN, isDeleted: false })
        if (checkIsbn) return res.status(400).send({ status: false, message: `${data.ISBN} is already registered,Please add a New.` })
        }
        
        if(!validator.isValidString(data.releasedAt))return res.status(400).send({ status: false, message: "RealeasedAt Is Required" }) 
        if(data.releasedAt){
        if(!/((\d{4}[\/-])(\d{2}[\/-])(\d{2}))/.test(data.releasedAt)){
        return res.status(400).send({ status: false, message: 'Please provide a valid Date(YYYY-MM-DD)' })} 
        }

        const updateBookData = await bookModel.findOneAndUpdate(
            { _id: book_id ,isDeleted: false},
            { title: data.title, excerpt: data.excerpt, releasedAt: data.releasedAt, ISBN: data.ISBN },
            { new: true })

        res.status(200).send({ status: true, message: "Successfully updated book details.", data: updateBookData })

    } catch (err) {
        res.status(500).send({ status: false, Error: err.message })
    }
}


/******************************************************Delete Book Details API********************************************/


const deleteBook = async function (req, res) {
    try {
        const book_id = req.params.bookId

        const deleteBookData = await bookModel.findOneAndUpdate(
            { _id: book_id,isDeleted: false },
            { $set: { isDeleted: true, deletedAt: new Date() } },
            { new: true })

        res.status(200).send({ status: true, message: "Book deleted successfullly.", data: deleteBookData })


    } catch (err) {
        res.status(500).send({ status: false, Error: err.message })
    }
}



module.exports = { createBook, getBook, getBookById, updateBook, deleteBook }