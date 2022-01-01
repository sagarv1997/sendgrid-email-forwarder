const express = require("express");
const multer = require("multer");
const simpleParser = require("mailparser").simpleParser;
const sgMail = require("@sendgrid/mail");

const app = express();

const upload = multer();
const port = process.env.PORT || "8000";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

const emailMapper = {
  "xyz@domain.com": "xyz@gmail.com",
};

app.post("/forward", upload.any(), (req, res) => {
  sgMail.setApiKey(SENDGRID_API_KEY);

  simpleParser(req.body.email).then((parsedEmail) => {
    const toEmail = [];

    parsedEmail.to.value.forEach((value) => {
      if (emailMapper[value.address] !== undefined) {
        toEmail.push(emailMapper[value.address]);
      }
    });

    if (toEmail.length > 0) {
      let attachments = [];

      if (parsedEmail.attachments.length > 0) {
        parsedEmail.attachments.forEach((file) => {
          attachment = {
            content: file.content.toString("base64"),
            filename: file.filename,
            type: file.type,
            disposition: file.contentDisposition,
            content_id: file.contentId,
          };

          attachments.push(attachment);
        });
      }

      const msg = {
        to: toEmail,
        from: "no-reply@domain.com",
        subject: parsedEmail.subject,
        text: parsedEmail.text,
        html: parsedEmail.html,
        attachments: attachments,
      };

      sgMail.send(msg).then(
        () => {},
        (error) => {
          console.error(error);

          if (error.response) {
            console.error(error.response.body);
          }
        }
      );
    }
  });
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});
