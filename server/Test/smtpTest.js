const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'casimer.prosacco@ethereal.email',
        pass: 'wCRnwWP754aFWzfWDP'
    }
});
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ SMTP test failed:", err.message);
  } else {
    console.log("✅ SMTP connection successful");
  }
});
