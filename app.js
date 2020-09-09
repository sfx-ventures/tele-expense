const express = require('express')
const app = express()
const port = 3000
const moment = require('moment')

const Slimbot = require('slimbot')
const slimbot = new Slimbot('1212732152:AAEi84X7ujHhi0vcYvTSXiZpzh-1hpWC3BI')

const db = require("./models/")
const Account = db.account
db.sequelize.sync({ force: true })

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

slimbot.on('message', async message => {
  // console.log(message)
  slimbot.sendMessage(message.chat.id, await proc(message, 'new'), { parse_mode: 'html' })
})

slimbot.on('edited_message', async message => {
  // console.log(message)
  slimbot.sendMessage(message.chat.id, await proc(message, 'edit'), { parse_mode: 'html', reply_to_message_id: message.message_id })
})

// Call API

slimbot.startPolling()

app.get('/', (req, res, err) => {
  res.send('yes it is')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
