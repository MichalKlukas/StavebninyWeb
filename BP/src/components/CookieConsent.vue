<template>
  <div id="cookie-banner"></div>
</template>

<script>
import 'vanilla-cookieconsent/dist/cookieconsent.css'
import * as CookieConsent from 'vanilla-cookieconsent'

export default {
  name: 'CookieConsent',
  mounted() {
    console.log('CookieConsent init...')
    CookieConsent.run({
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
            cookie_table_headers: [
              { col1: 'Název' },
              { col2: 'Doména' },
              { col3: 'Expirace' },
              { col4: 'Popis' }
            ],
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
              },
              {
                title: 'Analytické cookies',
                description: 'Umožňují nám analyzovat využití webu.',
                toggle: {
                  value: 'analytics',
                  enabled: false,
                  readonly: false
                },
                cookie_table: [
                  {
                    col1: '^_ga',
                    col2: 'google.com',
                    col3: '2 roky',
                    col4: 'Google Analytics cookies',
                    is_regex: true
                  }
                ]
              }
            ]
          }
        }
      }
    })
  }
}
</script>
