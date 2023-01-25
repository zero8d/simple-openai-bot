import { Bot, InputFile } from 'grammy'

import dotenv from 'dotenv'
dotenv.config()
const bot = new Bot(process.env.BOTTOKEN || '')

import { Configuration, OpenAIApi } from 'openai'

const configuration = new Configuration({
  apiKey: process.env.OPENAIAPIKEY,
})
const openai = new OpenAIApi(configuration)

bot.command('start', ctx => {
  ctx.reply(
    "Hello! I'm here to help you with any questions or information you need. How can I assist you?"
  )
})
bot.command('image', async ctx => {
  const text = ctx.msg.text.split('/image')[1]
  try {
    const imgresp: any = await openai.createImage({
      prompt: text,
      n: 3,
      size: '512x512',
    })
    console.log(imgresp.data)
    if (imgresp.data.data.length > 0) {
      imgresp.data.data.forEach((element: any) => {
        ctx.replyWithPhoto(element.url)
      })
    } else {
      ctx.reply('Please retry')
    }
  } catch (error) {
    console.log(error)
  }
})
bot.on(':text', async ctx => {
  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: ctx.msg.text,
  })
  // console.log(completion.data.choices[0].text)
  console.log(completion.data.choices)

  ctx.reply(completion.data.choices[0].text || 'Please retry')
})

bot.start()
bot.catch(err => console.log('err'))
console.log('Bot started')
