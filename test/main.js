var express = require('express');
var fs = require('fs');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded

app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", req.headers.origin);
    res.header("Access-Control-Allow-Credentials", true);
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    if(req.method=="OPTIONS") res.sendStatus(200);/*让options请求快速返回*/
    else  next();
});
app.post('/sendError', function (req, res) {
    // node接收错误信息，并将信息写进log.txt文件里面，模拟将错误信息上报到服务器
    var body = req.body;
    try {
        var fd = fs.openSync('test/log.txt', 'a+');
        fs.appendFileSync(fd, JSON.stringify(body) + '\r\n=======\r\n');
        res.send({message: '成功'});
      } catch (err) {
        /* Handle the error */
        res.send({message: '失败', error: err});
      }
});

app.use(express.static(__dirname + '/public'));

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});