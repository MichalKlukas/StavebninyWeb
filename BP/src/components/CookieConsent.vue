<template>
  <div id="cookie-banner"></div>
</template>

<script>
export default {
  name: 'CookieConsent',
  mounted() {
    // Wait for the global CC object to be available
    if (window.CC && typeof window.CC.run === 'function') {
      try {
        window.CC.run({
          current_lang: 'cs',
          autoclear_cookies: true,
          page_scripts: true,
          languages: {
            cs: {
              // Your existing configuration...
              consent_modal: {
                title: 'Používáme cookies',
                description:
                  'Tento web používá cookies pro zlepšení vašeho zážitku a analýzu návštěvnosti.',
                primary_btn: {
                  text: 'Přijmout vše',
                  role: 'accept_all'
                },
                secondary_btn: {
                  text: 'Pouze nezbytné',
                  role: 'accept_necessary'
                }
              }
              // Rest of config...
            }
          }
        })
      } catch (error) {
        console.error('Error initializing cookie consent:', error)
      }
    } else {
      console.warn('Cookie consent library not found. Make sure it is loaded in index.html')
    }
  }
}
</script>
