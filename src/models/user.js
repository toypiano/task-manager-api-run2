const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      tasks: [
        {
          type: mongoose.Types.ObjectId,
          required: true,
          ref: Task,
        },
      ],
    },
    // Storing tokens in db is more trouble(extra security burden) than what it's worth.
    // You can still logout from one device and still be logged in on other devices
    // by storing tokens in the localStorage of each device.
    avatar: {
      type: Buffer,
    },
  },
  { timestamps: true }
)

/* Virtual field */
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'creator',
})

/* pre save middleware */

// - Hash modified (or new) password before saving it to the database.
userSchema.pre('save', async function () {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }
  // you don't need to call next() if your function returns a Promise
})

/* Document instance methods */

/**
 * generate token from doc._id
 * @returns {{id: string}}
 */
function generateToken() {
  const user = this

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })

  // not storing tokens to db
  // user.tokens = user.tokens.concat(token)
  // await user.save()
  return token
}
userSchema.methods.generateToken = generateToken

// Return value of toJSON() will be used when JSON.stringify(doc) is called
// i.e. when document is sent via response
userSchema.methods.toJSON = function () {
  const user = this
  const userObj = user.toObject({ getters: true })

  delete userObj.password
  delete userObj.tokens

  return userObj
}

/* Plugins */
userSchema.plugin(uniqueValidator)

module.exports = mongoose.model('User', userSchema)
