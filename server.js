const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// =============================
// ✅ Multer Storage Configuration
// =============================
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
  limits: { fileSize: 20 * 1024 * 1024 } // Max file size = 20MB
});

// =============================
// ✅ Middleware Configuration
// =============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Serve static files (CSS, JS, Images)
app.use(express.static('public'));

app.use((req, res, next) => {
  console.log('Request for:', req.url); // Log every incoming request
  next();
});

// =============================
// ✅ Serve Sitemap.xml
// =============================
app.get('/sitemap.xml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sitemap.xml'));
});

// =============================
// ✅ Home Page
// =============================
app.get('/', (req, res) => {
  res.render('index', { title: 'Home' });
});

// =============================
// ✅ Recruitment Page
// =============================
app.get('/recruitment', (req, res) => {
  res.render('recruitment', { title: 'Recruitment', pageStyles: 'recruitment.css' });
});

// =============================
// ✅ Apply Page (GET)
// =============================
app.get('/apply', (req, res) => {
  res.render('apply', { title: 'Apply Now', pageStyles: 'apply.css' });
});

// =============================
// ✅ Apply Form Submission (POST)
// =============================
app.post('/apply', (req, res) => {
  upload.array('attachments', 5)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send('<script>alert("File size too large. Max allowed size is 10MB."); window.location="/apply";</script>');
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send('<script>alert("Unexpected file format."); window.location="/apply";</script>');
      }
    } else if (err) {
      return res.status(500).send('<script>alert("An error occurred while uploading files."); window.location="/apply";</script>');
    }

    const { name, email, phone, message } = req.body;
    const files = req.files;

    if (!name || !email || !phone || !message) {
      return res.status(400).send('<script>alert("All fields are required."); window.location="/apply";</script>');
    }

    try {
      let transporter = nodemailer.createTransport({
        host: 'smtp.ionos.co.uk',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      let attachments = files.map(file => ({
        filename: file.originalname,
        path: file.path
      }));

      let mailOptions = {
        from: `"Dorothy Care" <info@dorothycare.co.uk>`,
        to: 'info@dorothycare.co.uk',
        subject: `New Job Application from ${name}`,
        text: `
          Name: ${name}
          Email: ${email}
          Phone: ${phone}

          Message:
          ${message}
        `,
        attachments
      };

      await transporter.sendMail(mailOptions);

      // ✅ Clean up uploaded files after sending
      files.forEach(file => fs.unlinkSync(file.path));

      res.send('<script>alert("Application submitted successfully!"); window.location="/recruitment";</script>');
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).send('<script>alert("An error occurred while sending your application."); window.location="/apply";</script>');
    }
  });
});

// =============================
// ✅ Contact Page (GET)
// =============================
app.get('/contact', (req, res) => {
  res.render('contact', { submitted: false });
});

// ✅ Contact Form Submission (POST)
app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).send('All fields are required.');
  }

  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.ionos.co.uk',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    let mailOptions = {
      from: `"Dorothy Care" <info@dorothycare.co.uk>`,
      to: 'info@dorothycare.co.uk',
      replyTo: email,
      subject: 'New Contact Message from Dorothy Care',
      text: `You received a message from:\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await transporter.sendMail(mailOptions);

    res.render('contact', { submitted: true });
  } catch (error) {
    console.error('Error sending contact form:', error);
    res.status(500).send('An error occurred while sending your message.');
  }
});

// =============================
// ✅ Services Page (Main)
// =============================
app.get('/services', (req, res) => {
  res.render('services', { title: 'Our Services' });
});

// ✅ Dynamic Individual Service Pages
app.get('/services/:serviceName', (req, res) => {
  const serviceName = req.params.serviceName.replace(/-/g, ' ').toLowerCase();
  const fileName = req.params.serviceName.replace(/-/g, '-').toLowerCase();

  const filePath = path.join(__dirname, 'views', 'services', `${fileName}.ejs`);

  if (fs.existsSync(filePath)) {
    res.render(`services/${fileName}`, {
      title: serviceName.charAt(0).toUpperCase() + serviceName.slice(1),
      pageStyles: `${fileName}.css`
    });
  } else {
    res.status(404).send('Service not found');
  }
});

// =============================
// ✅ Start Server
// =============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
