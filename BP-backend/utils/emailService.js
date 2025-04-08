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
        to: process.env.CONTACT_EMAIL || 'stavebninybaroch@seznam.cz' || 'michalik123456789@seznam.cz',
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
  },

  // Send order confirmation email to customer and notification to company
  async sendOrderConfirmationEmail(to, customerName, orderId, items, shipping, totalPrice) {
    console.log(`Sending order confirmation email to: ${to} for order #${orderId}`);

    try {
      // Format items for the email
      let itemsHtml = '';
      let subtotal = 0;
      
      items.forEach(item => {
        const itemPrice = typeof item.price === 'string' 
          ? parseFloat(item.price.replace(',', '.')) 
          : item.price;
          
        const itemTotal = itemPrice * item.quantity;
        subtotal += itemTotal;
        
        itemsHtml += `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${itemPrice.toLocaleString('cs-CZ')} Kč</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${itemTotal.toLocaleString('cs-CZ')} Kč</td>
          </tr>
        `;
      });
      
      // Format shipping info
      const shippingMethod = shipping.method === 'pickup' ? 'Osobní odběr' : 'Doručení na adresu';
      const shippingCost = shipping.cost || 0;
      
      let shippingAddressHtml = '';
      if (shipping.method === 'delivery' && shipping.address) {
        shippingAddressHtml = `
          <p style="margin: 5px 0;"><strong>Adresa doručení:</strong></p>
          <p style="margin: 5px 0;">${shipping.address.street}<br>
          ${shipping.address.city}, ${shipping.address.zip}</p>
        `;
      }
      
      // Customer email
      const customerMailOptions = {
        from: `"Stavebniny Baroch" <${process.env.EMAIL_USER}>`,
        to,
        subject: `Potvrzení objednávky #${orderId} - Stavebniny Baroch`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f5852a; text-align: center; padding: 10px; background-color: #fff0e6; border-radius: 5px;">
              POTVRZENÍ OBJEDNÁVKY #${orderId}
            </h2>
            
            <p>Dobrý den, ${customerName},</p>
            <p>děkujeme za Vaši objednávku. Níže najdete shrnutí Vaší objednávky:</p>
            
            <h3 style="color: #f5852a; margin-top: 25px;">Položky objednávky</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background-color: #f9f9f9;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Položka</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Množství</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Cena/ks</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Celkem</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; border-top: 1px solid #eee;"><strong>Mezisoučet:</strong></td>
                  <td style="padding: 10px; text-align: right; border-top: 1px solid #eee;">${subtotal.toLocaleString('cs-CZ')} Kč</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right;"><strong>Doprava (${shippingMethod}):</strong></td>
                  <td style="padding: 10px; text-align: right;">${shippingCost.toLocaleString('cs-CZ')} Kč</td>
                </tr>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Celková cena:</strong></td>
                  <td style="padding: 10px; text-align: right; border-top: 2px solid #eee; font-weight: bold; color: #f5852a; font-size: 16px;">${totalPrice.toLocaleString('cs-CZ')} Kč</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
              <h3 style="color: #f5852a; margin-top: 0;">Informace o doručení</h3>
              <p style="margin: 5px 0;"><strong>Způsob dopravy:</strong> ${shippingMethod}</p>
              <p style="margin: 5px 0;"><strong>Datum vyzvednutí/doručení:</strong> ${shipping.pickupDate}</p>
              ${shippingAddressHtml}
              ${shipping.method === 'delivery' ? `<p style="margin: 5px 0;"><strong>Cena dopravy:</strong> ${shippingCost.toLocaleString('cs-CZ')} Kč</p>` : ''}
            </div>
            
            <p><strong>Důležité upozornění:</strong> Objednávky na webové aplikaci slouží pouze k vytvoření objednávek a nejsou automaticky zpracovány. Budeme Vás kontaktovat ohledně dalších kroků a platebních pokynů.</p>
            
            <p>V případě dotazů se na nás neváhejte obrátit. Děkujeme za Váš nákup.</p>
            
            <p style="margin-top: 25px;">S pozdravem,<br>Tým Stavebniny Baroch</p>
          </div>
        `
      };

      // Company notification email
      const companyMailOptions = {
        from: `"Stavebniny Baroch Web" <${process.env.EMAIL_USER}>`,
        to: process.env.CONTACT_EMAIL || 'michalik123456789@seznam.cz',
        subject: `Nová objednávka #${orderId} - Stavebniny Baroch`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f5852a; text-align: center; padding: 10px; background-color: #e6f7ff; border-radius: 5px;">
              NOVÁ OBJEDNÁVKA Z WEBU #${orderId}
            </h2>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 25px;">
              <h3 style="color: #f5852a; margin-top: 0;">Informace o zákazníkovi</h3>
              <p style="margin: 5px 0;"><strong>Jméno:</strong> ${customerName}</p>
              <p style="margin: 5px 0;"><strong>E-mail:</strong> ${to}</p>
            </div>
            
            <h3 style="color: #f5852a; margin-top: 25px;">Položky objednávky</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
              <thead>
                <tr style="background-color: #f9f9f9;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Položka</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Množství</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Cena/ks</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Celkem</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 10px; text-align: right; border-top: 2px solid #eee;"><strong>Celková cena:</strong></td>
                  <td style="padding: 10px; text-align: right; border-top: 2px solid #eee; font-weight: bold; color: #f5852a; font-size: 16px;">${totalPrice.toLocaleString('cs-CZ')} Kč</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">
              <h3 style="color: #f5852a; margin-top: 0;">Informace o doručení</h3>
              <p style="margin: 5px 0;"><strong>Způsob dopravy:</strong> ${shippingMethod}</p>
              <p style="margin: 5px 0;"><strong>Datum vyzvednutí/doručení:</strong> ${shipping.pickupDate}</p>
              ${shippingAddressHtml}
              ${shipping.method === 'delivery' ? `<p style="margin: 5px 0;"><strong>Cena dopravy:</strong> ${shippingCost.toLocaleString('cs-CZ')} Kč</p>` : ''}
            </div>
          </div>
        `
      };

      // Send email to customer
      const customerInfo = await transporter.sendMail(customerMailOptions);
      console.log(`Order confirmation email sent to customer: ${customerInfo.messageId}`);

      // Send notification to company
      const companyInfo = await transporter.sendMail(companyMailOptions);
      console.log(`Order notification email sent to company: ${companyInfo.messageId}`);

      return { customerInfo, companyInfo };
    } catch (error) {
      console.error('Chyba při odesílání potvrzení objednávky:', error);
      throw error;
    }
  }
};

module.exports = emailService;
