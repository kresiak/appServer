var log4js = require('log4js')

exports.configure= () => {
    log4js.configure({
        appenders: {
          console: { type: 'console' },
          fileWebServer: { type: 'file', filename: 'all-web-server.log', maxLogSize: 10485760, backups: 10, keepFileExt: true },
          fileApplication: { type: 'file', filename: 'all-application.log', maxLogSize: 10485760, backups: 10, keepFileExt: true },
          emergencies: { type: 'file', filename: 'emergencies.log', maxLogSize: 10485760, backups: 10, keepFileExt: true },
          justErrors: { type: 'logLevelFilter', appender: 'emergencies', level: 'error' }
        },
        categories: {
          webServer: { appenders: ['fileWebServer', 'justErrors'], level: 'info' },
          application: { appenders: ['fileApplication', 'justErrors'], level: 'info' },
          applicationIncludingConsole: { appenders: ['console', 'fileApplication', 'justErrors'], level: 'info' },
          default: { appenders: ['console'], level: 'info' }
        }
       });    
}

exports.getExpressLogger= () => {
    var logger = log4js.getLogger('webServer');  
    return log4js.connectLogger(logger, { level: 'info' }) 
}

exports.getLogger= () => {
    return log4js.getLogger('application')
}

exports.getLoggerAndConsole= () => {
    return log4js.getLogger('applicationIncludingConsole')
}

exports.shutdown= () => {
    log4js.shutdown()
}