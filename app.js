require('dotenv').config({ path: __dirname+'/.env' });
const axios = require("axios");
var mysql = require("mysql2");
const querystring = require('querystring');

let date = new Date();
console.log(date,"<br>");
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

  var sql = "select * from admin.url_monitor where isactive=1";
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
  let date = new Date();
  return console.log(date, `exit code: ${code}`);
});

async function testAPI(api) {
  if (!api || !api.line_token || !api.url || !api.varname) {
    console.log(api.url, "Not found parameter");
    return false;
  }
  try {
    const result = await axios.get(api.url);
    if (result.data[api.varname] == undefined) {
      let errorMsg = `Server ${api.url} unreachable: '${api.varname}' not found.`;
      console.log(api.url, errorMsg,"<br>");
      await lineAlert(api.line_token, `\r\n${errorMsg}\r\n`);
    } else {
      console.log(api.url, api.varname, `=> "${result.data[api.varname]}"`,"<br>");
    }
  } catch (error) {
    console.log(api.url, "error:", error.message,"<br>");
    await lineAlert(api.line_token, `\r\nServer ${api.url} unreachable: ${error.message}.\r\n`);
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