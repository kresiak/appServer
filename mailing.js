var nodemailer = require('nodemailer')
const logging = require('./logging')

var gmailAddress = 'krino.message@gmail.com'

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailAddress,
        pass: 'kmagmfe17'      // krino messages are good messages for everyone 17
    }
});

var transporter2 = nodemailer.createTransport({
    host: 'smtp.ulg.ac.be',
    port: 587,
    secure: false,
    auth: {
        user: 'admin.giga@uliege.be',
        pass: 'Patz2745'
    }
});

exports.ggMailTo = function (toAddresses, subject, html) {
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
            logging.getLoggerAndConsole().info('Email sent: ', info.response);
        }
    });
}

exports.mailLaboDir = (toAddresses, firstName, id, test, isProduction, response) => {
    var url= isProduction ?  `http://139.165.57.34/krino/taskslabd/${id}`  : `http://localhost:4200/taskslabd/${id}`
    
    var html = `
    <p>Dear ${firstName},</p>
    <p>May we hereby ask you for a few minutes of your time.</p>
    <p>We are in the process of updating the database of GIGA members.  You are being contacted as laboratory head (as defined by the director of your thematic unit). We would like you to list the names of the PIs (team leaders) in your laboratory.  Following this, your PIs will each receive a similar request to fill in the members of their respective teams.</p>
    <p>The accompanying link will guide you to a self-explanatory on-line form to be used for that purpose. If you have any questions or encounter problems, please download, install and use the “chrome” browser first.  If still having problems contact Alex Kvasz by email (kvasza@gmail.com).</p>
    <p>As a reminder, the following figure illustrates the organizational “ontology” of GIGA, while the table provides an example for the Medical Genomics Unit.  As lab head, you may – in addition to being lab head -  be or not be a team-leading PI.</p>
    <p><b>Please add all PIs of your laboratory, whether core or associate, including yourself (if appropriate). <u>If your laboratory has only one team</u> (i.e. headed by yourself as PI), please re-enter your name as PI.</b><br/> You will then receive a new email that will allow you to enter the members of your team.</p> 
    <p>We thank you for your prompt assistance.</p>    
    <p><a href="${url}">Click here to start with Teambuilder</a> or open your browser with ${url} </p>
    <p><img style="width:600px" src="cid:ak1@mailing.krino.giga.com"/></p>
    <p><img style="width:600px" src="cid:ak2@mailing.krino.giga.com"/></p>
    <p><img style="width:600px" src="cid:ak3@mailing.krino.giga.com"/></p>
    `
    // 'benoit.ernst@uliege.be'

    var mailOptions = {
        from: '"Michel Georges (Teambuilder)" <admin.giga@uliege.be>',
        to: toAddresses,
        bcc: 'admin.giga@uliege.be',
        subject: 'Teambuilder link for you as a laboratory head',
        html: html,
        attachments: [
            {
                path: './mailing/organzation-ontology-giga.png',
                cid: 'ak1@mailing.krino.giga.com'
            },
            {
                path: './mailing/table-exemple1.png',
                cid: 'ak2@mailing.krino.giga.com'
            },
            {
                path: './mailing/table-exemple2.png',
                cid: 'ak3@mailing.krino.giga.com'
            }
        ]

    };
   
    if (test) {
        logging.getLoggerAndConsole().info(toAddresses, `${url}`)
        response.status(201).json('ok')
    }
    else {
        transporter2.sendMail(mailOptions, function (error, info) {
            if (error) {
                logging.getLoggerAndConsole().error('sendMail error', error);
                response.status(500).json('bad')
            } else {
                logging.getLoggerAndConsole().info('Email sent: ', info.response);
                response.status(201).json('ok')
            }
        });    
    }    
}

