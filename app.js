require('dotenv').config({ path: __dirname+'/.env' });
const moment = require("moment");
const axios = require("axios");
var mysql = require("mysql2");
const querystring = require('querystring');

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

  var sql = `select * from ${process.env.DB_TABLE} where isactive=1 order by server_group`;
  con.query(sql, async (err, rows) => {
    if (err) {
      throw err;
    } else {
      let results = [];
      for (let row of rows){
        const result = await testAPI(row);
        results.push({ 
          date: moment().format('YYYY-MM-DD HH:mm:ss'), 
          group: row.server_group,
          name: row.name, url: row.url, 
          status: result.status || null,
         });
         if (result.message){
          results[results.length-1].message = result.message;
         }
      }
      console.log(JSON.stringify(results));
    }

    return process.exit(0);
  });
});

async function testAPI(api) {
  if (!api || !api.line_token || !api.url) {
    return { status: 500, message: 'invalid config' };
  }
  try {
    const result = await axios.get(api.url);
    let date = moment().format('DD/MM/YYYY HH:mm:ss');
    if (result.status == undefined) {
      let errorMsg = `Server ${api.url} status unreachable`;
      await lineAlert(api.line_token, `${date}\r\n${errorMsg}\r\n`);
      return { status: 400, message: 'unreachable'};
    } else {
      return result;
    }
  } catch (error) {
    let date = moment().format('DD/MM/YYYY HH:mm:ss');
    await lineAlert(api.line_token, `${date}\r\nServer ${api.url} unreachable: ${error.message}.\r\n`);
    return error;
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
    .then(response => response )
    .catch((error) => {
      console.error(" ===> Error", error.message,"<br>");
      return error;
    });
}