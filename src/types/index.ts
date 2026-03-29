export type ArticleTopic =
  | "politics"
  | "economy"
  | "sports"
  | "culture"
  | "technology"
  | "society"
  | "eu"
  | "environment";

export type ArticleType = "trending" | "evergreen";

export type ArticleStatus = "draft" | "published" | "archived";

export type TrendingSourceType = "rss" | "google_trends" | "manual";

export interface TopicInfo {
  slug: ArticleTopic;
  label: string;
}

export const TOPICS: TopicInfo[] = [
  { slug: "politics", label: "Politika" },
  { slug: "economy", label: "Ekonomika" },
  { slug: "sports", label: "Sports" },
  { slug: "culture", label: "Kultūra" },
  { slug: "technology", label: "Tehnoloģijas" },
  { slug: "society", label: "Sabiedrība" },
  { slug: "eu", label: "ES" },
  { slug: "environment", label: "Vide" },
];

export const TOPIC_LABELS: Record<ArticleTopic, string> = {
  politics: "Politika",
  economy: "Ekonomika",
  sports: "Sports",
  culture: "Kultūra",
  technology: "Tehnoloģijas",
  society: "Sabiedrība",
  eu: "ES",
  environment: "Vide",
};

export const TOPIC_DESCRIPTIONS: Record<ArticleTopic, string> = {
  politics:
    "Raksti par Latvijas un Eiropas politiku — Saeimas lēmumiem, valdības darbu, vēlēšanām, politisko partiju aktivitātēm un likumdošanas izmaiņām, kas ietekmē ikvienu Latvijas iedzīvotāju.",
  economy:
    "Raksti par Latvijas un pasaules ekonomiku — darba tirgu, minimālo algu, inflāciju, banku sektoru, nekustamo īpašumu tirgu un ES ekonomikas politiku. Uzzini, kā ekonomiskie procesi ietekmē tavu ikdienu.",
  sports:
    "Jaunākās aktualitātes Latvijas sportā — hokejs, basketbols, futbols, vieglatlētika un citi sporta veidi. Latvijas sportistu panākumi starptautiskajā arēnā un vietējie sporta notikumi.",
  culture:
    "Raksti par Latvijas kultūras dzīvi — teātri, mūziku, kino, literatūru, mākslu un kultūras pasākumiem. Latviešu tradīcijas, svētki un kultūras mantojuma saglabāšana.",
  technology:
    "Tehnoloģiju jaunumi un to ietekme uz Latviju — digitalizācija, mākslīgais intelekts, kiberdrošība, e-pārvalde un tehnoloģiju jaunuzņēmumi Latvijā un Baltijā.",
  society:
    "Raksti par sabiedrības norisēm Latvijā — izglītību, veselības aprūpi, demogrāfiju, migrāciju, sociālo politiku un ikdienas jautājumiem, kas skar Latvijas iedzīvotājus.",
  eu:
    "Eiropas Savienības lēmumi un to ietekme uz Latviju — ES likumdošana, fondi un finansējums, ārpolitika, tirdzniecība un Latvijas loma Eiropas Savienībā.",
  environment:
    "Raksti par vidi un klimatu Latvijā — dabas aizsardzību, klimata pārmaiņām, ilgtspējīgu attīstību, atkritumu apsaimniekošanu un zaļajām tehnoloģijām.",
};
