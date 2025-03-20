const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files in 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname); // Rename files with timestamp
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Max file size = 5MB
});

// ✅ Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve sitemap.xml manually
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// Serve static files from the public directory
app.use(express.static('public'));

// ✅ Serve static files (CSS, JS, Images)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Parse URL-encoded bodies (for form submission)
app.use(bodyParser.urlencoded({ extended: true }));

// =========================
// ✅ Home Page
// =========================
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// =========================
// ✅ Recruitment
// =========================
app.get('/recruitment', (req, res) => {
  res.render('recruitment', { title: 'Recruitment', pageStyles: 'recruitment.css' });
});

// =========================
// ✅ Apply Page (GET)
// =========================
app.get('/apply', (req, res) => {
  res.render('apply', { title: 'Apply Now', pageStyles: 'apply.css' });
});

// =========================
// ✅ Apply Form Submission (POST)
// =========================
app.post('/apply', async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).send('All fields are required.');
  }

  try {
    // ✅ Create transporter for IONOS
    let transporter = nodemailer.createTransport({
      host: 'smtp.ionos.co.uk', // IONOS SMTP server
      port: 587, // TLS
      secure: false, // Use `false` for TLS
      auth: {
        user: process.env.EMAIL_USER, // Your IONOS email
        pass: process.env.EMAIL_PASS  // Your IONOS email password
      }
    });

    // ✅ Email content
    let mailOptions = {
      from: `"Dorothy Care" <info@dorothycare.co.uk>`,
      to: 'info@dorothycare.co.uk',
      replyTo: email,
      subject: `New Job Application from ${name}`,
      text: `
        Name: ${name}
        Email: ${email}
        Phone: ${phone}

        Message:
        ${message}
      `
    };

    // ✅ Send the email
    await transporter.sendMail(mailOptions);

    // ✅ Redirect back to the recruitment page with success message
    res.send('<script>alert("Application submitted successfully!"); window.location="/recruitment";</script>');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('An error occurred while submitting your application.');
  }
});

app.post('/apply', upload.array('attachments', 5), async (req, res) => {
  const { name, email, phone, message } = req.body;
  const files = req.files;

  if (!name || !email || !phone || !message) {
    return res.status(400).send("All fields are required.");
  }

  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.ionos.co.uk",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Attach uploaded files
    let attachments = files.map(file => {
      return {
        filename: file.originalname,
        path: file.path
      };
    });

    let mailOptions = {
      from: `"Dorothy Care" <info@dorothycare.co.uk>`,
      to: "info@dorothycare.co.uk",
      subject: "New Job Application - Dorothy Care",
      text: `
        You received a new job application:
        
        Name: ${name}
        Email: ${email}
        Phone: ${phone}
        
        Cover Letter:
        ${message}
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);
    
    // Clean up uploaded files after sending
    files.forEach(file => fs.unlinkSync(file.path));

    res.send("Application submitted successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("An error occurred while sending your application.");
  }
});

// =========================
// ✅ Contact Page
// =========================
app.get('/contact', (req, res) => {
  res.render('contact', { submitted: false });
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send("All fields are required.");
  }

  try {
    let transporter = nodemailer.createTransport({
      host: "smtp.ionos.co.uk", // IONOS SMTP server
      port: 587, // Use 587 for TLS or 465 for SSL
      secure: false, // `false` for TLS, `true` for SSL
      auth: {
        user: process.env.EMAIL_USER, // Your IONOS email
        pass: process.env.EMAIL_PASS  // Your IONOS email password
      }
    });    

    let mailOptions = {
      from: `"Dorothy Care" <info@dorothycare.co.uk>`, // Use your authorized domain email
      to: "info@dorothycare.co.uk", // Same domain email
      replyTo: email, // This will allow you to reply to the user directly
      subject: "New Contact Message from Dorothy Care",
      text: `You received a message from:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };    

    await transporter.sendMail(mailOptions);

    res.render('contact', { submitted: true });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).send("An error occurred while sending your message.");
  }
});

// =========================
// ✅ Services Page (Main)
// =========================
app.get('/services', (req, res) => {
  res.render('services', { title: 'Our Services' });
});

// =========================
// ✅ Dynamic Individual Service Pages
// =========================
app.get('/services/:serviceName', (req, res) => {
  const serviceName = req.params.serviceName.replace(/-/g, ' ').toLowerCase(); // Format to lowercase
  const fileName = req.params.serviceName.replace(/-/g, '-').toLowerCase();

  const filePath = path.join(__dirname, 'views', 'services', `${fileName}.ejs`);

  // ✅ Check if the service file exists before rendering
  if (fs.existsSync(filePath)) {
    res.render(`services/${fileName}`, {
      title: serviceName.charAt(0).toUpperCase() + serviceName.slice(1), // Capitalize first letter
      pageStyles: `${fileName}.css`
    });
  } else {
    res.status(404).send('Service not found');
  }
});

// =========================
// ✅ Start Server
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
