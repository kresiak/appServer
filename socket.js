var webSocket = require('ws');
const logging = require('./logging')

var wss;

exports.init= (server) => {
    wss = new webSocket.Server({ server: server })

    wss.on('connection', function connection(ws, req) {
        const ip = req.connection.remoteAddress;
        ws.extensions['ip']= ip
        logging.getLogger().info('web socket connection', ip)
    });    
}

exports.broadcast= (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify(data));
            logging.getLogger().info('web socket update to', client.extensions.ip, JSON.stringify(data))
        }
    });
};
