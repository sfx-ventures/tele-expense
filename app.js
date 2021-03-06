const express = require('express')
const app = express()
const moment = require('moment')
const path = require("path")

const db = require("./models/")
const Account = db.account
// db.sequelize.sync({ force: true })
db.sequelize.sync()

const url = 'https://9fb307402cc4.ngrok.io'

const proc = async (r, mode) => {

  let temp = r.text.split(' ')
  let stat, acc = 'INCOME', amount = parseFloat(temp[1]).toFixed(2)
  let status = `Please use the following syntax:
- to record income   : in &lt;value&gt;
- to record expense : out &lt;value&gt;
- to view report        : /report
- to view chart          : /chart`

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
          month: moment.unix(r.date).format('MMM'),
          year: moment.unix(r.date).format('YYYY'),
        })
        status = `RM ${amount} recorded in ${acc} account`
      } else {
        await Account.update({ verb: temp[0].toUpperCase(), amount: amount * 1 }, { where: { message_id: r.message_id } })
        status = `Record updated. New amount is RM ${amount}`
      }
      break
    case 'REPORT':
    case '/REPORT':
      let income = await Account.sum('amount', { where: { user: r.from.id, verb: 'IN' } })
      let expense = await Account.sum('amount', { where: { user: r.from.id, verb: 'OUT' } })
      status = `<u>Overall Status</u>
INCOME : RM ${income.toFixed(2)}
EXPENSE : RM ${expense.toFixed(2)}
BALANCE : RM ${(income - expense).toFixed(2)}`
      break
    case 'SYNTAX':
    case '/SYNTAX':
      break
    case 'CHART':
    case '/CHART':
      status = `<a href="${url}/chart/${r.from.id}">Show Chart</a>`
      // status = `${url}/chart/${r.from.id}`
      break
    default:
      status = `Invalid Syntax. ${status}`
      break
  }
  return status
}

const Slimbot = require('slimbot')
const slimbot = new Slimbot('1212732152:AAEi84X7ujHhi0vcYvTSXiZpzh-1hpWC3BI')
slimbot.setWebhook({ url: `${url}/api/v1/bot` });

// Get webhook status
// slimbot.getWebhookInfo();

app.use(express.json())

app.use(express.static(path.join(__dirname, 'client/build')));
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.post('/api/v1/bot', async (req,res,err)=>{
  let message = req.body.message, verb = 'new', opt = {}
  if(!message) {
    message = req.body.edited_message
    verb = 'edit'
    opt = {reply_to_message_id: message.message_id}
  }
  slimbot.sendMessage(message.chat.id, await proc(message, verb), { parse_mode: 'html', disable_web_page_preview: false , ...opt })
  res.sendStatus(200)
})

app.get('/api/v1/chart/:id', async (req,res,err)=>{

  let months = [], current, dateSplit, income, expense
  for (i = 0; i < 12; i++) {
    current = moment().subtract(i,'month').format('MMM YYYY')
    dateSplit = current.split(' ')
    income = await Account.sum('amount', { where: { user: req.params.id, verb: 'IN', month: dateSplit[0], year: dateSplit[1] } })
    expense = await Account.sum('amount', { where: { user: req.params.id, verb: 'OUT', month: dateSplit[0], year: dateSplit[1] } })
    months.push({
      xaxis: current,
      income: income,
      expense: expense,
      balance: income - expense
    })
  } 

  res.status(200).json({ result: months })
})

app.listen(3000, () => {
  console.log(`Example app listening at http://localhost:3000`)
})
