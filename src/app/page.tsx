import Link from "next/link";

export default function Home() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("lv-LV", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-bg-secondary py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary mb-6">
            Laipni lūdzam TavaDiena.lv
          </h1>
          <p className="text-xl text-text-secondary mb-8">
            Latvijas ikdienas informācija — vārda dienas, algu kalkulators, svētku dienas un aktuālās ziņas
          </p>
          <p className="text-lg text-text-muted mb-12">
            {formattedDate}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/varda-dienas"
              className="btn btn-primary"
            >
              Vārda dienas
            </Link>
            <Link
              href="/algu-kalkulators"
              className="btn btn-primary"
            >
              Algu kalkulators
            </Link>
            <Link
              href="/aktualitates"
              className="btn btn-primary"
            >
              Aktualitātes
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-primary mb-12 text-center">
            Ērti rīki katrai dienai
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Link href="/varda-dienas" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Vārda dienas
              </h3>
              <p className="text-text-secondary">
                Uzzini šodienas, rītdienas un citu dienu vārda dienas. Meklē pēc vārda un sūti apsveikumus.
              </p>
            </Link>

            <Link href="/algu-kalkulators" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Algu kalkulators
              </h3>
              <p className="text-text-secondary">
                Uzzini neto algu, aprēķini nodokļus un pārskatīti savu atalgojumu analīzi.
              </p>
            </Link>

            <Link href="/svetku-dienas" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Svētku dienas
              </h3>
              <p className="text-text-secondary">
                Latvijas valsts un tautas svētku dienu kalendārs ar sīkāku informāciju.
              </p>
            </Link>

            <Link href="/darba-dienu-kalendars" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Kalendārs
              </h3>
              <p className="text-text-secondary">
                Darba dienu un svētku dienu kalendārs. Plāno darbu un projektus efektīvi.
              </p>
            </Link>

            <Link href="/aktualitates" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Aktualitātes
              </h3>
              <p className="text-text-secondary">
                Pēdējās ziņas par Latviju, ekonomiku, politiku, sportu un vēl daudz ko.
              </p>
            </Link>

            <Link href="/meklet" className="card card:hover">
              <h3 className="text-xl font-heading font-bold text-primary mb-3">
                Meklēt
              </h3>
              <p className="text-text-secondary">
                Meklē vārda dienas, artikulus un citu informāciju mūsu vietnē.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
