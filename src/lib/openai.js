const OpenAI = require('openai')
const { sendEmail } = require('./mailer')
require('dotenv').config() // 从 .env 文件中读取环境变量

// instance1
const apiKey1 = process.env.OPENAI_API_KEY1
const instance1 = {
  openai: new OpenAI({ apiKey: apiKey1 }),
  key: apiKey1,
  isError: false,
}

// instance2
const apiKey2 = process.env.OPENAI_API_KEY2
const instance2 = {
  openai: new OpenAI({ apiKey: apiKey2 }),
  key: apiKey2,
  isError: false,
}

// instance list
let instanceList = [instance1, instance2] // 还可以扩展多个
let index = 0

function getOpenAIInstance() {
  if (instanceList.length === 0) {
    // 如果实例列表为空，则发送邮件通知
    console.error('instance list is empty, no instance available')
    sendEmail({
      subject: 'OpenAI instance list is empty',
      text: 'OpenAI instance list is empty',
    })
    return null
  }

  const instance = instanceList[index]
  if (!instance.isError) {
    // 当前实例没有错误，则增加 index 并返回
    index = (index + 1) % instanceList.length
    return instance
  }

  // 如果当前实例有错误，则剔出当前实例
  console.log('instance error and removed from list, key: ', instance.key)
  instanceList = instanceList.filter((item) => item.key !== instance.key)
  index = 0 // 重置 index
  return getOpenAIInstance() // 重新获取
}

module.exports = { getOpenAIInstance }