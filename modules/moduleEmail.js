var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '****',
    pass: '****'
  }
});
var mailOptions  = {};
var sender=function (mailTo,mailSubject,mailText){
 mailOptions.from=mailTo;
 mailOptions.to=mailTo;
 mailOptions.subject=mailSubject;
 mailOptions.text=mailText;
 transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  }
  /* else {
    console.log('Email ' +mailSubject+' sent to '+mailTo);
  }*/
}); 
} 

module.exports = sender;