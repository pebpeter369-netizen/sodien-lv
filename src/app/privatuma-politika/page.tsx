import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privātuma politika",
  description: "TavaDiena.lv privātuma politika — kā mēs apstrādājam jūsu datus.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-6">
        Privātuma politika
      </h1>

      <div className="article-content text-text-secondary leading-relaxed space-y-4">
        <p>
          Šī privātuma politika apraksta, kā <strong>TavaDiena.lv</strong>{" "}
          apkopo, izmanto un aizsargā jūsu personisko informāciju, apmeklējot
          mūsu tīmekļa vietni.
        </p>

        <h2>Kādu informāciju mēs apkopojam</h2>
        <p>
          Mēs apkopojam anonīmu analītikas informāciju par lapas apmeklējumiem,
          lai uzlabotu mūsu pakalpojumus. Šī informācija ietver:
        </p>
        <ul>
          <li>Apmeklētās lapas un to skaits</li>
          <li>Ierīces veids un pārlūkprogramma</li>
          <li>Aptuvena ģeogrāfiskā atrašanās vieta (valsts līmenī)</li>
          <li>Atsauces avots (no kurienes atnācāt)</li>
        </ul>

        <h2>Sīkdatnes (Cookies)</h2>
        <p>
          Mūsu vietne izmanto sīkdatnes, lai nodrošinātu vietnes darbību un
          apkopotu analītikas datus. Mēs izmantojam:
        </p>
        <ul>
          <li>
            <strong>Nepieciešamās sīkdatnes</strong> — vietnes pamatfunkciju
            nodrošināšanai
          </li>
          <li>
            <strong>Analītikas sīkdatnes</strong> — apmeklējumu statistikas
            apkopošanai
          </li>
          <li>
            <strong>Reklāmas sīkdatnes</strong> — Google AdSense reklāmu
            personalizācijai
          </li>
        </ul>

        <h2>Google AdSense</h2>
        <p>
          Mēs izmantojam Google AdSense, lai rādītu reklāmas mūsu vietnē.
          Google var izmantot sīkdatnes, lai rādītu reklāmas, pamatojoties uz
          jūsu iepriekšējiem apmeklējumiem šajā vai citās tīmekļa vietnēs. Jūs
          varat atteikties no personalizētajām reklāmām, apmeklējot{" "}
          <a
            href="https://www.google.com/settings/ads"
            className="text-primary underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google reklāmu iestatījumus
          </a>
          .
        </p>

        <h2>Jūsu tiesības</h2>
        <p>
          Saskaņā ar GDPR (Vispārīgā datu aizsardzības regula) jums ir
          tiesības:
        </p>
        <ul>
          <li>Piekļūt saviem datiem</li>
          <li>Labot neprecīzus datus</li>
          <li>Pieprasīt datu dzēšanu</li>
          <li>Iebilst pret datu apstrādi</li>
          <li>Pieprasīt datu pārnesamību</li>
        </ul>

        <h2>Kontaktinformācija</h2>
        <p>
          Ja jums ir jautājumi par mūsu privātuma politiku, sazinieties ar mums:{" "}
          <a href="mailto:info@tavadiena.lv" className="text-primary underline">
            info@tavadiena.lv
          </a>
        </p>

        <p className="text-sm text-text-muted mt-8">
          Pēdējo reizi atjaunots: 2025. gada 1. janvārī
        </p>
      </div>
    </div>
  );
}
