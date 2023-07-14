// const nodemailer = require("nodemailer");
// const { google } = require("googleapis");

// const oAuth2Client = new google.auth.OAuth2(
//   process.env.CLIENT_ID,
//   process.env.CLIENT_SECRET,
//   process.env.REDIRECT_URI
// );
// oAuth2Client.setCredentials({refresh_token:process.env.REFRESH_TOKEN})
// const sendEmail = async (options) => {
//   try{
//     const accessToken = await oAuth2Client.getAccessToken()

//     const transport = nodemailer.createTransport({
//       service:"gmail",
//       auth: {
//         type:"OAUTH2",
//         user:"sworupkc08@gmail.com",
//         clientId:process.env.CLIENT_ID,
//         clientSecret:process.env.CLIENT_SECRET,
//         refreshToken:process.env.REFRESH_TOKEN,
//         accessToken:accessToken
//       },
//     })

//     const mailOptions = {
//       from: options.from,
//       to: options.to,
//       subject: options.subject,
//       text: options.text,
//       html: options.html,
//     };
//     const result = await transport.sendMail(mailOptions);
//     return result
//   }catch(err){
//     return err
//   }

// };
// module.exports = sendEmail;

const nodemailer = require("nodemailer");

const sendEmail = (options) => {
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    // attachments:[options.attachments]
  };

  if (JSON.stringify([options.attachments]) === JSON.stringify([undefined])) {
    return transport.sendMail(mailOptions);
  } else mailOptions.attachments = [options.attachments];

  transport.sendMail(mailOptions);
};

module.exports = sendEmail;
