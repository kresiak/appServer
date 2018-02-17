var nodemailer = require('nodemailer')
const logging= require('./logging')

var gmailAddress= 'krino.message@gmail.com'

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailAddress,
        pass: 'kmagmfe17'      // krino messages are good messages for everyone 17
    }
});

exports.ggMailTo = function(toAddresses, subject, html)  {
    var mailOptions = {
        from: gmailAddress,
        to: toAddresses,
        subject: subject,
        html: html
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            logging.getLoggerAndConsole().error('sendMail error', error);
        } else {
            logging.getLoggerAndConsole().info('Email sent: ' , info.response);
        }
    });
}



