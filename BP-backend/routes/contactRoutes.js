const express = require('express');
const router = express.Router();
const emailService = require('../utils/emailService');

// Contact form submission route
router.post('/contact', async (req, res) => {
  try {
    const formData = req.body;
    const referer = req.headers.referer || '';
    
    // Determine form type based on the URL path
    const formType = referer.includes('/poptavka') ? 'inquiry' : 'contact';
    
    // Log the received data
    console.log(`${formType === 'inquiry' ? 'Nová poptávka' : 'Nový dotaz'} form data received:`, formData);
    
    // Send email with form type
    await emailService.sendContactFormEmail(formData, formType);
    
    // Return success response
    res.status(200).json({ 
      message: formType === 'inquiry' ? 'Poptávka byla úspěšně odeslána' : 'Dotaz byl úspěšně odeslán' 
    });
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).json({ 
      error: 'Došlo k chybě při zpracování formuláře. Zkuste to prosím znovu později.' 
    });
  }
});

module.exports = router;