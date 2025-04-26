<template>
  <div id="cookie-banner"></div>
</template>

<script>
// Import just the stylesheet
import 'vanilla-cookieconsent/dist/cookieconsent.css'

export default {
  name: 'CookieConsent',
  mounted() {
    // Dynamic import using a different approach
    import('vanilla-cookieconsent/dist/cookieconsent.js')
      .then((module) => {
        // Access the global window.CC object that the library creates
        if (window.CC && typeof window.CC.run === 'function') {
          console.log('Using window.CC global object')

          try {
            window.CC.run({
              current_lang: 'cs',
              autoclear_cookies: true,
              page_scripts: true,
              languages: {
                cs: {
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
                  },
                  settings_modal: {
                    title: 'Nastavení cookies',
                    save_settings_btn: 'Uložit nastavení',
                    accept_all_btn: 'Přijmout vše',
                    reject_all_btn: 'Odmítnout vše',
                    close_btn_label: 'Zavřít',
                    cookie_table_headers: {
                      col1: 'Název',
                      col2: 'Doména',
                      col3: 'Expirace',
                      col4: 'Popis'
                    },
                    blocks: [
                      {
                        title: 'Využití cookies',
                        description:
                          'Používáme cookies pro zajištění základních funkcí webu a pro analýzu návštěvnosti.'
                      },
                      {
                        title: 'Nezbytné cookies',
                        description: 'Tyto cookies jsou nezbytné pro fungování webu.',
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
            console.log('Cookie consent initialized successfully')
          } catch (error) {
            console.error('Error in cookie consent setup:', error)
          }
        } else {
          console.error('Cookie consent library not properly loaded')
        }
      })
      .catch((err) => {
        console.error('Failed to load vanilla-cookieconsent:', err)
      })
  },
  beforeUnmount() {
    // Cleanup when component is destroyed
    if (window.CC && typeof window.CC.hide === 'function') {
      window.CC.hide()
    }
  }
}
</script>
