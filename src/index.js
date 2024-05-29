const Koa = require('koa')
const cors = require('@koa/cors')
const chatRouter = require('./chat-router')
require('dotenv').config()

const app = new Koa()

// 配置跨域
app.use(
  cors({
    origin: (ctx) => {
      const origin = ctx.request.header.origin
      // console.log('ctx origin: ', origin)
      const configOrigin = process.env.CORS_ORIGIN
      if (configOrigin === '*') {
        return origin
      }
      if (configOrigin.split(',').includes(origin)) {
        return origin
      }
      return ''
    },
  })
)

// 注册路由
app.use(chatRouter.routes()).use(chatRouter.allowedMethods())

app.use(async ctx => {
  ctx.body = 'chat API proxy';
})

const port = parseInt(process.env.PORT, 10) || 3002
app.listen(port)