<template>
  <div id="cookie-banner"></div>
</template>

<script>
import 'vanilla-cookieconsent/dist/cookieconsent.css'

export default {
  name: 'CookieConsent',
  async mounted() {
    try {
      // Using require instead of import for better compatibility with bundlers
      const cookieConsentModule = await import('vanilla-cookieconsent')

      if (cookieConsentModule && cookieConsentModule.run) {
        cookieConsentModule.run({
          current_lang: 'cs',
          autoclear_cookies: true,
          page_scripts: true,
          languages: {
            cs: {
              consent_modal: {
                title: 'Používáme cookies',
                description: 'Tento web používá cookies pro zlepšení vašeho zážitku.',
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
                    description: 'Používáme cookies pro základní funkce webu.'
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
      } else {
        console.error('Cookie consent module loaded but run method not found')
      }
    } catch (error) {
      console.error('Error setting up cookie consent:', error)
    }
  }
}
</script>
