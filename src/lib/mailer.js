const nodemailer = require('nodemailer')
require('dotenv').config()

// const config = {
//   host: process.env.EMAIL_HOST,
//   port:  parseInt(process.env.EMAIL_PORT, 10),
//   auth: {
//     user: process.env.EMAIL_USER_163,
//     pass: process.env.EMAIL_PASSWORD_163,
//   },
// }

const config = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
}

const transporter = nodemailer.createTransport(config)

function sendEmail(opt = {}) {
  const { subject = '', text = '' } = opt
  if (!subject) {
    console.error('subject required')
    return
  }

  const mailConfig = {
    from: `摸鱼AI<${process.env.EMAIL_USER}>`, // '昵称<发件人邮箱>'
    subject,
    to: process.env.EMAIL_TO,
    text,
  }

  transporter.sendMail(mailConfig, function (error, info) {
    if (error) {
      console.error('error ', error)
    }
    console.log('mail sent:', info.response)
    transporter.close()
  })
}

// sendEmail({
//   subject: 'test title',
//   text: 'test content',
// })

module.exports = { sendEmail }