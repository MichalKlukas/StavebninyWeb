const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using working Gmail service configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use the built-in Gmail service which we've confirmed works
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Log configuration on startup
console.log('Email service initialized');
console.log(`Using email address: ${process.env.EMAIL_USER}`);

const emailService = {
  // Send verification email
  async sendVerificationEmail(to, name, verificationUrl) {
    console.log(`Sending verification email to: ${to}`);
    
    try {
      const mailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Potvrzení registrace - Stavebniny Baroch',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f5852a;">Vítejte v Stavebninách Baroch!</h2>
            <p>Dobrý den, ${name},</p>
            <p>děkujeme za Vaši registraci. Pro dokončení registrace a aktivaci účtu prosím klikněte na tlačítko níže:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #f5852a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Potvrdit e-mail</a>
            </div>
            <p>Pokud tlačítko nefunguje, můžete také zkopírovat a vložit tento odkaz do svého prohlížeče:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>Tento odkaz je platný 24 hodin.</p>
            <p>Pokud jste si nevytvořili účet, můžete tento e-mail ignorovat.</p>
            <p>S pozdravem,<br>Tým Stavebniny Baroch</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Verification email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Chyba při odesílání e-mailu:', error);
      throw error;
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(to, name, resetUrl) {
    console.log(`Sending password reset email to: ${to}`);
    
    try {
      const mailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Reset hesla - Stavebniny Baroch',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f5852a;">Reset hesla</h2>
            <p>Dobrý den, ${name},</p>
            <p>obdrželi jsme žádost o reset hesla k Vašemu účtu. Pro nastavení nového hesla klikněte na tlačítko níže:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #f5852a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Resetovat heslo</a>
            </div>
            <p>Pokud tlačítko nefunguje, můžete také zkopírovat a vložit tento odkaz do svého prohlížeče:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>Tento odkaz je platný 1 hodinu.</p>
            <p>Pokud jste nežádali o reset hesla, můžete tento e-mail ignorovat. Vaše heslo nebude změněno.</p>
            <p>S pozdravem,<br>Tým Stavebniny Baroch</p>
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Chyba při odesílání e-mailu:', error);
      throw error;
    }
  },

  // Contact form email
  async sendContactFormEmail(formData, formType = 'contact') {
    try {
      // Determine if it's a contact form or inquiry form
      const isInquiry = formType === 'inquiry' || formData.formType === 'inquiry' || !!formData.phone;
      const formTitle = isInquiry ? 'POPTÁVKA' : 'DOTAZ';
      const emailSubject = isInquiry ? 'Nová poptávka' : 'Nový dotaz';

      // Build HTML based on available fields
      let fieldsHtml = `
        <p><strong>Jméno:</strong> ${formData.name}</p>
        <p><strong>E-mail:</strong> ${formData.email}</p>
      `;

      if (formData.phone) {
        fieldsHtml += `<p><strong>Telefon:</strong> ${formData.phone}</p>`;
      }

      if (formData.address) {
        fieldsHtml += `<p><strong>Adresa:</strong> ${formData.address}</p>`;
      }

      fieldsHtml += `
        <p><strong>Předmět:</strong> ${formData.subject}</p>
        <p><strong>Zpráva:</strong></p>
        <p>${formData.message}</p>
      `;

      const mailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_USER}>`,
        to: process.env.CONTACT_EMAIL || 'michalik123456789@seznam.cz',
        subject: `${emailSubject}: ${formData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f5852a; text-align: center; padding: 10px; background-color: ${isInquiry ? '#e6f7ff' : '#fff0e6'}; border-radius: 5px;">
              ${emailSubject.toUpperCase()} Z WEBU
            </h2>
            ${fieldsHtml}
          </div>
        `
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`Contact form email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error('Chyba při odesílání formuláře:', error);
      throw error;
    }
  }
};

module.exports = emailService;
