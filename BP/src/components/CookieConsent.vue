<template>
  <div id="cookie-banner"></div>
</template>

<script>
// Import styles only initially
import 'vanilla-cookieconsent/dist/cookieconsent.css'

export default {
  name: 'CookieConsent',
  mounted() {
    // Import the library dynamically to ensure it loads after Vue is fully mounted
    import('vanilla-cookieconsent')
      .then((CookieConsent) => {
        console.log('CookieConsent loaded dynamically:', CookieConsent)

        try {
          // Create instance with minimal config first
          const cc = CookieConsent.init({
            current_lang: 'cs',
            autoclear_cookies: false, // Disable autoclear temporarily for testing
            page_scripts: false, // Disable page scripts temporarily for testing
            languages: {
              cs: {
                consent_modal: {
                  title: 'Používáme cookies',
                  description: 'Tento web používá cookies.',
                  primary_btn: {
                    text: 'OK',
                    role: 'accept_all'
                  }
                },
                settings_modal: {
                  title: 'Nastavení',
                  save_settings_btn: 'Uložit',
                  accept_all_btn: 'Přijmout vše',
                  reject_all_btn: 'Odmítnout',
                  close_btn_label: 'Zavřít',
                  cookie_table_headers: {
                    col1: 'Název',
                    col2: 'Doména',
                    col3: 'Expirace',
                    col4: 'Popis'
                  },
                  blocks: [
                    {
                      title: 'Nezbytné cookies',
                      description: 'Nezbytné cookies',
                      toggle: {
                        value: 'necessary',
                        enabled: true,
                        readonly: true
                      }
                    }
                  ]
                }
              }
            }
          })

          // Check if initialization was successful
          if (cc && typeof cc.run === 'function') {
            console.log('Initialized - about to run...')
            cc.run()
            console.log('Run completed successfully')
          } else {
            console.error('CookieConsent init did not return expected object:', cc)
          }
        } catch (error) {
          console.error('Error in cookie consent setup:', error)
        }
      })
      .catch((err) => {
        console.error('Failed to load CookieConsent module:', err)
      })
  },
  // Clean up on component destruction to prevent memory leaks
  beforeUnmount() {
    // If available, try to clean up
    if (window.CC && typeof window.CC.hide === 'function') {
      window.CC.hide()
    }
  }
}
</script>
