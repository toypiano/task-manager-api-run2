const express = require('express')
const mongoose = require('mongoose')
const { HttpError } = require('./models')

const { usersRouter, tasksRouter } = require('./routers')

mongoose.connect(
  process.env.MONGO_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log('Connected to db...')
  }
)

const app = express()

app.use(express.json())
app.use('/users', usersRouter)
app.use('/tasks', tasksRouter)

// Handles error thrown before sending response
app.use((err, req, res, next) => {
  // If already sent the response, don't send it again
  if (req.headerSent) {
    return next(err)
  }
  // if ValidationError is thrown by taskSchema
  if (/validation/i.test(err.toString())) {
    return next(new HttpError('Invalid inputs were passed', 422))
  }
  return res.status(err.status || 500).json({
    message: err.message || 'An unknown error occurred!',
  })
})

module.exports = app
