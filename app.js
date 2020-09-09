const express = require('express')
const app = express()
const moment = require('moment')

const db = require("./models/")
const Account = db.account
// db.sequelize.sync({ force: true })
db.sequelize.sync()

const proc = async (r, mode) => {

  let temp = r.text.split(' ')
  let stat, acc = 'INCOME', amount = parseFloat(temp[1]).toFixed(2)
  let status = `Please use the following syntax:
- to record income   : in &lt;value&gt;
- to record expense : out &lt;value&gt;
- to view report        : report`

  switch (temp[0].toUpperCase()) {
    case 'OUT':
      acc = 'EXPENSE'
    case 'IN':
      if (temp.length < 2) break
      if (mode == 'new') {
        stat = await Account.create({
          user: r.from.id,
          verb: temp[0].toUpperCase(),
          amount: amount * 1,
          date: r.date,
          message_id: r.message_id,
          month: moment(r.date).format('MMM'),
          year: moment(r.date).format('YYYY'),
        })
        status = `RM ${amount} recorded in ${acc} account`
      } else {
        await Account.update({ verb: temp[0].toUpperCase(), amount: amount * 1 }, { where: { message_id: r.message_id } })
        status = `Record updated. New amount is RM ${amount}`
      }
      break
    case 'REPORT':
      let income = await Account.sum('amount', { where: { user: r.from.id, verb: 'IN' } })
      let expense = await Account.sum('amount', { where: { user: r.from.id, verb: 'OUT' } })
      status = `<u>Overall Status</u>
INCOME : RM ${income.toFixed(2)}
EXPENSE : RM ${expense.toFixed(2)}
BALANCE : RM ${(income - expense).toFixed(2)}`
      break
    case '/START':
      break
    default:
      status = `Invalid Syntax. ${status}`
      break
  }
  return status
}

const Slimbot = require('slimbot')
const slimbot = new Slimbot('1212732152:AAEi84X7ujHhi0vcYvTSXiZpzh-1hpWC3BI')
slimbot.setWebhook({ url: 'https://be8c5daec102.ngrok.io/bot' });

// Get webhook status
// slimbot.getWebhookInfo();

app.use(express.json())
app.post('/bot', async (req,res,err)=>{
  let message = req.body.message, verb = 'new', opt = {}
  if(!message) {
    message = req.body.edited_message
    verb = 'edit'
    opt = {reply_to_message_id: message.message_id}
  }
  slimbot.sendMessage(message.chat.id, await proc(message, verb), { parse_mode: 'html' , ...opt })
  res.sendStatus(200)
})

app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})
