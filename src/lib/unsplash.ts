const UNSPLASH_API = "https://api.unsplash.com";

// Topic to search query mapping — more diverse keywords
const TOPIC_QUERIES: Record<string, string[]> = {
  politics: ["parliament building", "government meeting", "voting ballot", "democracy protest", "capitol building", "political speech", "law books", "gavel court"],
  economy: ["finance chart", "stock market", "business meeting", "money currency", "banking", "trade shipping", "office work", "economic growth"],
  sports: ["sports action", "athletics track", "basketball game", "soccer football", "swimming pool", "winter sports", "tennis court", "stadium crowd"],
  culture: ["art museum", "theater stage", "music orchestra", "dance performance", "painting gallery", "sculpture", "film cinema", "books library"],
  technology: ["coding laptop", "server data center", "artificial intelligence", "circuit board", "smartphone app", "robot automation", "cybersecurity lock", "digital network"],
  society: ["community people", "school classroom", "hospital healthcare", "family park", "urban city street", "elderly care", "children playground", "volunteer work"],
  eu: ["european parliament", "eu flags brussels", "europe map", "diplomatic meeting", "international cooperation", "strasbourg", "euro currency", "european city"],
  environment: ["forest trees", "solar panels", "wind turbines", "ocean beach", "recycling", "green field", "wildlife nature", "river lake clean water"],
};

interface UnsplashPhoto {
  url: string;
  author: string;
  downloadUrl: string;
  unsplashId: string;
}

/**
 * Fetch a unique image from Unsplash, avoiding already-used URLs.
 */
export async function fetchUnsplashImage(
  query: string,
  topic: string,
  excludeUrls?: Set<string>
): Promise<UnsplashPhoto | null> {
  const apiKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!apiKey) return null;

  const topicQueries = TOPIC_QUERIES[topic] || ["editorial"];

  // Extract 2-3 key words from the title for more specific search
  const keywords = extractKeywords(query);
  const topicKeyword = topicQueries[Math.floor(Math.random() * topicQueries.length)];

  try {
    // Try specific keywords + random topic keyword
    let photo = await searchPhoto(apiKey, `${keywords} ${topicKeyword}`, excludeUrls);

    // Fallback: just topic keyword with random page
    if (!photo) {
      const page = Math.floor(Math.random() * 5) + 1;
      photo = await searchPhoto(apiKey, topicKeyword, excludeUrls, page);
    }

    // Last resort: very generic with random page
    if (!photo) {
      const generic = ["Latvia", "Baltic", "Europe landscape", "modern city", "nature scenic"];
      photo = await searchPhoto(
        apiKey,
        generic[Math.floor(Math.random() * generic.length)],
        excludeUrls,
        Math.floor(Math.random() * 10) + 1
      );
    }

    if (!photo) return null;

    // Trigger download tracking (required by Unsplash guidelines)
    fetch(`${photo.downloadUrl}?client_id=${apiKey}`).catch(() => {});

    return photo;
  } catch (error) {
    console.error("Unsplash fetch error:", error);
    return null;
  }
}

/**
 * Extract 2-3 meaningful keywords from a title, removing common Latvian words.
 */
function extractKeywords(title: string): string {
  const stopWords = new Set([
    "un", "vai", "par", "kas", "lai", "ar", "no", "ir", "nav", "kā", "ko",
    "latvijā", "latvijas", "latvija", "kā", "kas", "cik", "kur", "kad",
    "the", "and", "for", "with", "from", "how", "what", "this",
    "jaunākie", "aktuālie", "galvenie", "praktisks", "ceļvedis", "padomi",
    "tendences", "attīstība", "pārskats", "izaicinājumi", "inovācijas",
  ]);

  const words = title
    .toLowerCase()
    .replace(/[—–\-:,\.!?]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 3);

  return words.join(" ") || title.split(" ").slice(0, 2).join(" ");
}

async function searchPhoto(
  apiKey: string,
  query: string,
  excludeUrls?: Set<string>,
  page: number = 1
): Promise<UnsplashPhoto | null> {
  const params = new URLSearchParams({
    query,
    per_page: "30",
    page: String(page),
    orientation: "landscape",
    content_filter: "high",
  });

  const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${apiKey}` },
  });

  if (!res.ok) {
    if (res.status === 403) console.warn("Unsplash rate limit reached");
    return null;
  }

  const data = await res.json();
  if (!data.results || data.results.length === 0) return null;

  // Filter out already-used images
  let candidates = data.results;
  if (excludeUrls && excludeUrls.size > 0) {
    candidates = candidates.filter(
      (p: { urls: { raw: string } }) => !excludeUrls.has(p.urls.raw.split("?")[0])
    );
  }

  if (candidates.length === 0) {
    // All results are duplicates — try without filter but pick from end of list
    candidates = data.results.slice(-5);
  }

  // Pick random from candidates
  const photo = candidates[Math.floor(Math.random() * candidates.length)];
  const url = `${photo.urls.raw}&w=1200&h=630&fit=crop&auto=format&q=80`;

  return {
    url,
    author: `${photo.user.name} (unsplash.com/@${photo.user.username})`,
    downloadUrl: photo.links.download_location,
    unsplashId: photo.id,
  };
}
