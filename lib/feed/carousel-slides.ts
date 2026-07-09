export interface CarouselSlide {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
}

/** Default hero slides when there is no news or tournament content yet. */
export const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "join-local",
    tag: "Street map",
    title: "Find the next run",
    description: "Open nearby games, check the pitch, and claim a spot before it fills.",
    image: "/feed/hero-night-court.png",
    ctaLabel: "Find matches",
    ctaHref: "#nearby-games",
  },
  {
    id: "match-details",
    tag: "Match card",
    title: "Know the setup",
    description: "Price, venue, roster, format, and payment stay on one card.",
    image: "/onboarding/match-details.png",
    ctaLabel: "Browse games",
    ctaHref: "#nearby-games",
  },
  {
    id: "roster",
    tag: "Squad check",
    title: "See who's in",
    description: "Read the room before you join. Squads, levels, and spots are visible.",
    image: "/onboarding/roster.png",
    ctaLabel: "Explore",
    ctaHref: "#nearby-games",
  },
  {
    id: "confidence",
    tag: "Matchday",
    title: "Play with receipts",
    description: "Reservations, updates, and results stay attached to the match.",
    image: "/onboarding/confidence.png",
    ctaLabel: "Get started",
    ctaHref: "#nearby-games",
  },
];

export interface FeedNewsItem {
  id: string;
  tag: string;
  title: string;
  description: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
}
