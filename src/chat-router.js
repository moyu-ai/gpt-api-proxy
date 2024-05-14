const OpenAI = require('openai')
const Router = require('koa-router')
require('dotenv').config()

const router = new Router()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

router.get('/api/gpt/chat', async (ctx, next) => {
  const query = ctx.query || {}

  // 简单的密钥
  const authToken = query['x-auth-token'] || ''
  if (!authToken.trim() || authToken !== process.env.AUTH_TOKEN) {
    ctx.body = 'invalid token'
    return
  }

  // option
  const optionStr = query['option'] || '{}'
  const decodeOptionStr = decodeURIComponent(optionStr)
  const option = JSON.parse(decodeOptionStr)

  if (!option.messages) {
    ctx.body = 'invalid option: messages required'
    return
  }

  // request GPT API
  const gptStream = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    // messages: [{ role: 'user', content: 'xxx' }],
    // max_tokens: 100,
    stream: true, // stream
    ...option,
  })

  ctx.status = 200
  ctx.set('Content-Type', 'text/event-stream') // 'text/event-stream' 标识 SSE 即 Server-Sent Events

  for await (const chunk of gptStream) {
    const content = chunk.choices[0].delta.content
    console.log('content: ', content)
    if (content == null) {
      ctx.res.write(`data: [DONE]\n\n`)
      break
    }
    ctx.res.write(`data: ${content}\n\n`) // 格式必须是 `data: xxx\n\n` ！！！
  }

  ctx.req.on('close', () => {
    console.log('req close...')
  })
})

module.exports = router