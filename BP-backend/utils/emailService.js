const nodemailer = require('nodemailer');
require('dotenv').config();

// Vytvoření Nodemailer transportu
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true pro port 465, false pro ostatní porty
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const emailService = {
  // Odeslání verifikačního e-mailu
  async sendVerificationEmail(to, name, verificationUrl) {
    try {
      const mailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_FROM}>`,
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

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Chyba při odesílání e-mailu:', error);
      throw error;
    }
  },

  // Odeslání e-mailu pro reset hesla
  async sendPasswordResetEmail(to, name, resetUrl) {
    try {
      const mailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_FROM}>`,
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

      return await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Chyba při odesílání e-mailu:', error);
      throw error;
    }
  },
// Mail na dotaz nebo poptávku
async sendContactFormEmail(formData, formType = 'contact') {
  try {
    // Determine if it's a contact form or inquiry form
    const isInquiry = formType === 'inquiry' || formData.formType === 'inquiry' || !!formData.phone;
    
    // Set the appropriate title and subject based on form type
    const formTitle = isInquiry ? 'POPTÁVKA' : 'DOTAZ';
    const emailSubject = isInquiry ? 'Nová poptávka' : 'Nový dotaz';
    
    // Build HTML based on available fields
    let fieldsHtml = `
      <p><strong>Jméno:</strong> ${formData.name}</p>
      <p><strong>E-mail:</strong> ${formData.email}</p>
    `;
    
    // Add phone if present
    if (formData.phone) {
      fieldsHtml += `<p><strong>Telefon:</strong> ${formData.phone}</p>`;
    }
    
    // Add address if present
    if (formData.address) {
      fieldsHtml += `<p><strong>Adresa:</strong> ${formData.address}</p>`;
    }
    
    // Add subject and message
    fieldsHtml += `
      <p><strong>Předmět:</strong> ${formData.subject}</p>
      <p><strong>Zpráva:</strong></p>
      <p>${formData.message}</p>
    `;
    
    const mailOptions = {
      from: `"Stavebniny Baroch" <${process.env.EMAIL_FROM}>`,
      to: 'michalik123456789@seznam.cz',
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
    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Chyba při odesílání formuláře:', error);
    throw error;
  }
}
};



module.exports = emailService;