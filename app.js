require('dotenv').config({ path: __dirname+'/.env' });
const moment = require("moment");
const axios = require("axios");
var mysql = require("mysql2");
const querystring = require('querystring');

let date = moment().format('YYYY-MM-DD HH:mm:ss');
console.log(date," start<br>");   // br -> for output to html
var con = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: process.env.DB_CHARSET
});
con.connect(async function (err, conn) {
  if (err) throw err;

  var sql = `select * from ${process.env.DB_TABLE} where isactive=1`;
  con.query(sql, async (err, result) => {
    if (err) {
      throw err;
    } else {
      for (let row of result){
        await testAPI(row);
      }
    }

    return process.exit(0);
  });
});

process.on("exit", function (code) {
  let date = moment().format('YYYY-MM-DD HH:mm:ss');
  return console.log(date, `exit code: ${code}`);
});

async function testAPI(api) {
  if (!api || !api.line_token || !api.url) {
    console.log(api.url, "Incorrect parameter");
    return false;
  }
  try {
    const result = await axios.get(api.url);
    let date = moment().format('DD/MM/YYYY HH:mm:ss');
    if (result.status == undefined) {
      let errorMsg = `Server ${api.url} unreachable`;
      console.log(api.url, errorMsg,"<br>");
      await lineAlert(api.line_token, `${date}\r\n${errorMsg}\r\n`);
    } else {
      console.log(api.url, ` status: ${result.status}`,"<br>");
    }
  } catch (error) {
    let date = moment().format('DD/MM/YYYY HH:mm:ss');
    console.log(api.url, "error:", error.message,"<br>");
    await lineAlert(api.line_token, `${date}\r\nServer ${api.url} unreachable: ${error.message}.\r\n`);
  }
}

async function lineAlert(lineToken, message) {
  const option = {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ` + lineToken,
    },
    data: querystring.stringify({ message }),
    url: "https://notify-api.line.me/api/notify"
  };
  await axios(option)
    .then((response) => { return response.data })
    .catch((error) => {
      console.error(" ===> Error", error.message,"<br>");
      return error;
    });
}