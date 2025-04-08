<template>
  <div class="HeadingStrip">
    <h1>O nás</h1>
  </div>

  <div class="about-page">
    <div class="about-text">
      <p>
        Stavebniny Lysá nad Labem působí na trhu od roku 2013 jako specializovaný prodejce
        stavebních materiálů, dřeva a doplňkového vybavení pro profesionály i kutily. Jako firma se
        zaměřujeme na osobní přístup, konkurenceschopné ceny a dlouhodobé vztahy s lokálními
        zákazníky.
      </p>
      <p>
        Sídlíme ve středočeském regionu, kde úzce spolupracujeme s firmou Baroch – okna, s.r.o.,
        čímž poskytujeme komplexní služby od materiálů po montážní řešení. Naše nabídka zahrnuje
        široký sortiment včetně izolací, lepidel, cihel a speciálních produktů, s možností dopravy
        na stavbu a odborného poradenství přímo na prodejně. V našich stavebninách naleznete téměř
        vše pro pro vaši stavbu na jednou místě.
      </p>
      <p class="margin">
        Na prodejně nás přivítají dvě kolegyně, které se postarají o lehký průběh vašeho nákupu.
      </p>
      <p class="margin">Vedoucí prodejny: Jaromíra Hrázská</p>
      <p class="margin">Asistentka prodeje: Monika Jůzová</p>
    </div>
    <div class="about-images">
      <!--<img src="@/assets/woman1.jpg" alt="Obrázek ženy 1" />
      <img src="@/assets/woman2.jpg" alt="Obrázek ženy 2" />-->
    </div>
  </div>

  <img class="FrontView" src="@/assets/store-front.jpg" alt="Fotka prodejny" />
</template>

<style scoped>
.HeadingStrip {
  width: 100%;
  height: 150px;
  background-color: #f0f0f0;

  display: flex;
  justify-content: center;
  align-items: center;
}
p {
  line-height: 1.7;
}
h1 {
  color: #0e0e0e;
  margin: 100px auto 80px auto; /* 200px from top, 80px bottom, centered */
  text-align: center;
  font-size: 42px;
}
.margin {
  margin: 20px auto 0 auto;
}

.about-page {
  max-width: 1200px;
  display: flex;
  gap: 15%; /* Space between text and images columns */
  margin-top: 30px;

  /* center horizontally: margin-left/right auto */
  margin-left: auto;
  margin-right: auto;
}

.about-text {
  width: 60%;
}

.about-images {
  width: 25%;
  display: flex;
  flex-direction: column;
  gap: 20px; /* Space between the two images */
}

/* Fix image sizes */
.about-images img {
  width: 100%;
  height: 220px; /* Set a fixed height for both images */
  object-fit: cover; /* Ensures the images fill the container and crop as needed */
}

/*tady bude fotka vnitřku prodejny*/
.FrontView {
  width: 1200px;
  height: 400px;
  display: block;
  margin-left: auto;
  margin-right: auto;
  margin-top: 20px;
}
</style>
