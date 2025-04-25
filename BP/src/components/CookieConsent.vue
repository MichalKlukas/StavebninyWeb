<template>
  <div id="cookie-banner"></div>
</template>

<script>
import 'vanilla-cookieconsent/dist/cookieconsent.css'
import * as CookieConsent from 'vanilla-cookieconsent' // SPRÁVNĚ pro v3

export default {
  name: 'CookieConsent',
  mounted() {
    console.log('CookieConsent objekt:', CookieConsent)
    console.log('RUN CONFIG:', {
      current_lang: 'cs',
      autoclear_cookies: true,
      page_scripts: true
    })
    CookieConsent.run({
      current_lang: 'cs',
      languages: {
        cs: {
          consent_modal: {
            title: 'Používáme cookies',
            description: 'Text',
            primary_btn: { text: 'Přijmout', role: 'accept_all' }
          },
          settings_modal: {
            title: 'Nastavení cookies',
            save_settings_btn: 'Uložit',
            cookie_table_headers: [
              { col1: 'Název' },
              { col2: 'Doména' },
              { col3: 'Expirace' },
              { col4: 'Popis' }
            ],
            blocks: [{ title: 'Využití cookies', description: 'Text' }]
          }
        }
      }
    })
  }
}
</script>
