const Router = require('koa-router')
const { getOpenAIInstance } = require('./lib/openai')
const { sendEmail } = require('./lib/mailer')

const router = new Router()

router.get('/api/gpt/chat', async (ctx, next) => {
  ctx.status = 200
  ctx.set('Content-Type', 'text/event-stream') // 'text/event-stream' 标识 SSE 即 Server-Sent Events

  let gptStream

  ctx.req.on('close', () => {
    console.log('req close...')

    // 取消请求
    console.log('try abort...')
    if (!ctx.gptStreamDone) {
      console.log('abort request...')
      if (gptStream) gptStream.controller.abort()
      console.log('abort ok~ ')
    }
  })

  const query = ctx.query || {}

  // 简单的密钥
  const authToken = query['x-auth-token'] || ''
  if (!authToken.trim() || authToken !== process.env.AUTH_TOKEN) {
    const errMsg = 'invalid token'
    console.log('error: ', errMsg)
    ctx.res.write(`data: [ERROR]${errMsg}\n\n`) // 格式必须是 `data: xxx\n\n` ！！！
    return
  }

  // option
  const optionStr = query['option'] || '{}'
  const decodeOptionStr = decodeURIComponent(optionStr)
  const option = JSON.parse(decodeOptionStr)

  if (!option.messages) {
    const errMsg = 'invalid option: messages required'
    console.log('error: ', errMsg)
    ctx.res.write(`data: [ERROR]${errMsg}\n\n`)
    return
  }

  // get openai instance
  const instance = getOpenAIInstance()
  if (instance == null) {
    const errMsg = 'openai instance is null'
    console.log('error: ', errMsg)
    ctx.res.write(`data: [ERROR]${errMsg}\n\n`)
    return
  }
  const formatKey = instance.key.slice(0, 20) + '***'
  console.log('cur openai key: ', formatKey)

  try {
    // get openai instance
    const { openai, key } = getOpenAIInstance()
    console.log('cur openai key: ', `${key.slice(0, 15)}***}`)

    // request GPT API
    gptStream = await instance.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      // messages: [{ role: 'user', content: 'xxx' }],
      max_tokens: 600, // 默认
      stream: true, // stream
      stream_options: { include_usage: true },
      ...option,
    })
  } catch (err) {
    const errMsg = err.message || 'request openai API error'
    console.log('error: ', errMsg)
    ctx.res.write(`data: [ERROR]${errMsg}\n\n`)
    return
  }

  if (gptStream == null) {
    const errMsg = 'gptStream is not defined'
    console.log('error: ', errMsg)
    ctx.res.write(`data: [ERROR]${errMsg}\n\n`)

    // 记录 error 并发送邮件
    instance.isError = true
    sendEmail({
      subject: `OpenAI API request error, key ${formatKey}`,
      text: errMsg,
    })

    return
  }

  for await (const chunk of gptStream) {
    // console.log('chunk ', JSON.stringify(chunk))
    const { choices = [], usage } = chunk

    if (choices.length === 0) {
      // console.log('usage ', usage) // 格式如 {"prompt_tokens":81,"completion_tokens":23,"total_tokens":104}
      ctx.res.write(`data: ${JSON.stringify({ usage })}\n\n`)

      // 结束
      ctx.gptStreamDone = true
      ctx.res.write(`data: [DONE]\n\n`) // 格式必须是 `data: xxx\n\n`
    }

    if (choices.length > 0) {
      const content = chunk.choices[0].delta.content
      console.log('content: ', content)
      if (content != null) {
        const data = { c: content }
        ctx.res.write(`data: ${JSON.stringify(data)}\n\n`)
      }
    }
  }
})

module.exports = router