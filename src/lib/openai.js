const OpenAI = require('openai')
require('dotenv').config() // 从 .env 文件中读取环境变量

const apiKey1 = process.env.OPENAI_API_KEY1
const instance1 = {
  openai: new OpenAI({ apiKey: apiKey1 }),
  key: apiKey1,
}

const apiKey2 = process.env.OPENAI_API_KEY2
const instance2 = {
  openai: new OpenAI({ apiKey: apiKey2 }),
  key: apiKey2,
}

const instanceList = [instance1, instance2] // 还可以扩展多个
let index = 0

function getOpenAIInstance() {
  const instance = instanceList[index]
  index = (index + 1) % instanceList.length // 轮流使用
  return instance
}

module.exports = { getOpenAIInstance }