
var isProduction= false
var MYPORT= isProduction ? 80 : 1337
var MYHOST= isProduction ? '139.165.57.34': '127.0.0.1'


var express = require("express");
var bodyParser = require("body-parser");

const mailing = require('./mailing')
const upload = require('./upload')
const database= require('./database')
const socket= require('./socket')
const logging= require('./logging')
logging.configure()
logging.getLoggerAndConsole().info('Starting giga application server')

var app = express();

app.use(logging.getExpressLogger());

if (isProduction) {
    app.use("/jobs", express.static(__dirname + "/public2"));
    app.use("/krino", express.static(__dirname + "/public3"));
    app.use("/krino2", express.static(__dirname + "/public4"));
    app.use("/screens", express.static(__dirname + "/public5"));    
}
if (!isProduction) {
    app.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });    
}


app.use(bodyParser.json());

database.init(() => {
    // when database is ready, do this
    var server = app.listen(MYPORT, MYHOST, function () {
        var port = server.address().port;
        logging.getLoggerAndConsole().info("App now running on port", port);
    });

    socket.init(server)
})

var handleService= (req, res) => {
    var parameter = req.body;
    
    if (req.params.type === 'ggMailTo') {
        mailing.ggMailTo(parameter.data.to, parameter.data.subject, parameter.data.html)
        res.status(201).json('ok')
    }
    else if (req.params.type === 'ggMailTbLaboDirTo') {
        mailing.mailLaboDir(parameter.data.to, parameter.data.id, parameter.data.isTest || false, isProduction, res)
        //res.status(201).json('ok')
    }
    else {
        database.handleService(req, res)
    }
}


app.get("/data/:type", database.handleGet)
app.get("/data/:type/:id", database.handleGetSingle)
app.post("/data/:type", database.handlePost)
app.delete("/data/:type/:id", database.handleDelete)
app.put("/data/:type/:id", database.handlePut)
app.post('/upload', upload.handleUpload)
app.get('/pictures/:file', upload.handleDownload)
app.post("/service/:type", handleService)

app.all('*', function (req, res) {
    logging.getLogger().info("[TRACE] Server 404 request: $ {" + req.originalUrl + "}")
    if (req.originalUrl.toUpperCase().indexOf("/KRINO/") !== -1) res.status(200).sendFile(__dirname + "/public3/index.html")
    else if (req.originalUrl.toUpperCase().indexOf("/KRINO2/")!==-1) res.status(200).sendFile(__dirname + "/public4/index.html" )
    else res.status(204).end()
})


