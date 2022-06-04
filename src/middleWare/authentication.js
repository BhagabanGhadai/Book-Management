const bookModel = require("../models/bookModel")
const userModel=require('../models/userModel')
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')


/************************************************Authentication MiddleWare**************************************************/

const authentication = async function (req, res, next) {

    try {

        let token = req.headers["x-api-key"]

        if (!token) return res.status(400).send({ status: false, msg: "No Token Found" })

        let decodedToken = jwt.verify(token, "NONOINWW2Q9NAQO2OQ0#jn$@ono@")

        if (!decodedToken) return res.status(401).send({ status: false, msg: "invalid token" })

        next()

    } catch (err) {

        res.status(500).send({ status: false, Error: err.message })
    }
}


/************************************************Authorization MiddleWare**************************************************/

const authorization = async function (req, res, next) {

    try {

        let token = req.headers["x-api-key"]

        if (!token) return res.status(400).send({ status: false, msg: "No Token Found" })

        let decodedToken = jwt.verify(token, "NONOINWW2Q9NAQO2OQ0#jn$@ono@")

        if (!decodedToken) return res.status(401).send({ status: false, msg: "invalid token" })

        let usersId = decodedToken.userId
        let bodyData = req.body.userId
        let booksId = req.params.bookId

        if (bodyData) {
            if (!mongoose.isValidObjectId(bodyData)) return res.status(400).send({ status: false, message: "The userId is Invalid" })
            let checkUser = await userModel.findById(bodyData)
            if (!checkUser) return res.status(400).send({ status: false, message: "UserId Not Found" })
            if (usersId != bodyData) {
                return res.status(403).send
                    ({ status: false, message: "UnAuthorized Access!!" })
            }
        }



        if (booksId) {
            if (!mongoose.isValidObjectId(booksId)) return res.status(400).send({ status: false, message: "The BookId is Invalid." })
            let checkBookData = await bookModel.findOne({ _id: booksId, isDeleted: false })
            if (!checkBookData) return res.status(400).send({ status: false, message: "BookId Not Found" })
            let checkBook = await bookModel.findOne({ _id: booksId, userId: usersId })
            if (!checkBook) {
                return res.status(403).send
                    ({ status: false, message: "UnAuthorized Access!!" })
            }
        }

        next()

    } catch (err) {
        res.status(500).send({ status: false, Error: err.message })
    }
}



module.exports = { authentication, authorization }