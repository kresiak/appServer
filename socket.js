var webSocket = require('ws');

var wss;

exports.init= (server) => {
    wss = new webSocket.Server({ server: server })

    wss.on('connection', function connection(ws) {
        
    });    
}

exports.broadcast= (data) => {
    wss.clients.forEach(function each(client) {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};
