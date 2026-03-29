import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Par TavaDiena.lv — Latvijas ikdienas informācijas portāls",
  description:
    "Par TavaDiena.lv — Latvijas informācijas portāls ar vārda dienu kalendāru, algu kalkulatoru, svētku dienām un aktuālajām ziņām.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-text mb-6">
        Par TavaDiena.lv
      </h1>

      <div className="article-content text-text-secondary leading-relaxed space-y-4">
        <p>
          <strong>TavaDiena.lv</strong> ir Latvijas informācijas portāls, kas
          apvieno ikdienā noderīgus rīkus ar aktuālu saturu par norisēm
          Latvijā. Mūsu mērķis ir radīt vienu vietu, kur katrs Latvijas
          iedzīvotājs var ātri atrast ikdienā nepieciešamo informāciju.
        </p>

        <h2 className="font-heading">Mūsu mērķis</h2>
        <p>
          Mēs vēlamies, lai aktuālā informācija par Latviju būtu pieejama
          vienkārši, ātri un latviešu valodā. TavaDiena.lv apvieno vārda dienu
          kalendāru, algu kalkulatoru, svētku dienu sarakstu un izskaidrojošus
          rakstus par aktuālākajām norisēm valstī — viss vienuviet, bez
          liekiem klikšķiem.
        </p>

        <h2 className="font-heading">Ko mēs piedāvājam</h2>
        <ul>
          <li>
            <Link
              href="/varda-dienas"
              className="text-primary hover:underline font-medium"
            >
              Vārda dienu kalendārs
            </Link>{" "}
            — pilns oficiālais Latvijas vārda dienu kalendārs ar vairāk nekā
            700 unikāliem vārdiem. Katram vārdam ir individuāla lapa ar
            informāciju par vārda izcelsmi, nozīmi un tradīcijām.
          </li>
          <li>
            <Link
              href="/algu-kalkulators"
              className="text-primary hover:underline font-medium"
            >
              Algu kalkulators
            </Link>{" "}
            — precīzs bruto→neto un neto→bruto aprēķins ar aktuālajām
            Latvijas nodokļu likmēm. Atbalsta progresīvo IIN likmi, VSAOI,
            neapliekamo minimumu un atvieglojumus par apgādājamajiem.
          </li>
          <li>
            <Link
              href="/svetku-dienas"
              className="text-primary hover:underline font-medium"
            >
              Svētku dienu kalendārs
            </Link>{" "}
            — visi Latvijas valsts svētki un ievērojamās dienas ar datumiem,
            nedēļas dienām, tradīciju aprakstiem un nākamo gadu prognozēm.
          </li>
          <li>
            <Link
              href="/aktualitates"
              className="text-primary hover:underline font-medium"
            >
              Aktualitātes
            </Link>{" "}
            — izskaidrojošie raksti par aktuālākajām tēmām Latvijā. Politika,
            ekonomika, kultūra, sabiedrība un citas tēmas.
          </li>
        </ul>

        <h2 className="font-heading">Kas stāv aiz TavaDiena.lv</h2>
        <p>
          TavaDiena.lv izveidoja un uztur <strong>Pēteris</strong> — portāla
          dibinātājs un galvenais redaktors. Dzīvojot un strādājot Latvijā,
          Pēteris ikdienā saskaras ar tiem pašiem jautājumiem, ko risina
          portāla lietotāji: algu aprēķini, nodokļu izmaiņas, vārda dienu
          meklēšana un svētku plānošana. Šī personīgā pieredze ir pamatā
          katram portāla rīkam un lēmumam par saturu.
        </p>

        <h2 className="font-heading">Redakcionālais process</h2>
        <p>
          Daļa rakstu ir sagatavota ar mākslīgā intelekta palīdzību,
          pamatojoties uz publiskiem avotiem. Katrs raksts ietver atsauces uz
          izmantotajiem avotiem. Visi fakti un dati tiek redakcionāli pārbaudīti
          pirms publicēšanas.
        </p>
        <ul>
          <li>
            <strong>Nodokļu dati</strong> — iegūti no Ministru kabineta noteikumiem
            un VID publicētajām metodiskajām norādēm. IIN likmes, VSAOI un
            neapliekamā minimuma formula tiek pārbaudīta katru gadu pret
            aktuālajiem normatīvajiem aktiem.
          </li>
          <li>
            <strong>Vārda dienu kalendārs</strong> — balstīts uz Latvijas Zinātņu
            akadēmijas Latviešu valodas institūta apstiprināto oficiālo sarakstu.
            Vārdu nozīmes un izcelsmes apraksti tiek pārbaudīti pret onomastikas
            avotiem.
          </li>
          <li>
            <strong>Algu statistika</strong> — pamatojas uz CSP (Centrālās
            statistikas pārvaldes) publicēto datu par bruto algām Latvijā.
          </li>
          <li>
            <strong>Svētku dienas</strong> — datumi un brīvdienu statuss pārbaudīts
            pret Latvijas Republikas likumu &ldquo;Par svētku, atceres un
            atzīmējamām dienām&rdquo;.
          </li>
        </ul>
        <p>
          Mēs izmantojam tehnoloģijas, lai padarītu noderīgu informāciju
          pieejamāku — taču vienmēr iesakām pārbaudīt svarīgus finanšu
          lēmumus pie sertificēta speciālista.
        </p>

        <h2 className="font-heading">Kontakti</h2>
        <p>
          Ja jums ir jautājumi, ierosinājumi vai vēlaties sazināties ar mums,
          rakstiet uz e-pastu:{" "}
          <a href="mailto:info@tavadiena.lv" className="text-primary underline">
            info@tavadiena.lv
          </a>
        </p>
        <p>
          Mēs vienmēr priecājamies par atsauksmēm — ja pamanāt kļūdu vai
          jums ir ierosinājums, kā uzlabot vietni, lūdzu, sazinieties ar mums.
        </p>
      </div>
    </div>
  );
}
