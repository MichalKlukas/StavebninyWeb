<template>
  <div class="legal-container">
    <h1>Obchodní podmínky</h1>
    <p><strong>Provozovatel:</strong> Stavebniny Lysá</p>
    <p><strong>Sídlo:</strong> Lysá nad Labem, Sokolovská 1143</p>
    <p><strong>IČO:</strong> 07638230</p>
    <p><strong>Telefon:</strong> 775 315 349</p>
    <hr />
    <h2>1. Úvodní ustanovení</h2>
    <p>
      Provozovatelem webové aplikace je firma Stavebniny Lysá, IČO: 07638230, se sídlem Lysá nad
      Labem, Sokolovská 1143. Tato aplikace slouží k objednávání stavebního materiálu a
      souvisejícího sortimentu.
    </p>
    <h2>2. Registrace a objednávka</h2>
    <p>
      Pro zadání objednávky je nutná registrace. Uživatel je povinen při registraci uvádět pravdivé
      a úplné údaje.
    </p>
    <h2>3. Zpracování objednávek</h2>
    <p>
      Objednávka je pro provozovatele nezávazná do okamžiku potvrzení objednávky personálem
      prodejny. O průběhu zpracování je zákazník informován e-mailem.
    </p>
    <h2>4. Vyřízení a vyzvednutí zboží</h2>
    <p>
      Zboží je určeno k osobnímu vyzvednutí na adrese provozovatele po předchozím potvrzení. O
      možnosti vyzvednutí je zákazník informován.
    </p>
    <h2>5. Ochrana osobních údajů</h2>
    <p>
      Informace o zpracování osobních údajů jsou dostupné v dokumentu
      <router-link to="/ochrana-osobnich-udaju">Zásady zpracování osobních údajů</router-link>.
    </p>
    <h2>6. Závěrečná ustanovení</h2>
    <p>
      Tyto obchodní podmínky nabývají účinnosti dnem 27. 4. 2025. Provozovatel si vyhrazuje právo
      jejich změny. Aktuální znění je vždy k dispozici na webu.
    </p>
  </div>
</template>

<script setup>
// Žádné speciální skriptování není třeba.
</script>

<style scoped>
.legal-container {
  max-width: 700px;
  margin: 40px auto;
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  font-size: 1.05rem;
}
h1,
h2 {
  margin-bottom: 1rem;
}
hr {
  margin: 2rem 0 1rem 0;
}
</style>
