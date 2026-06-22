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
    tag: "DISCOVER",
    title: "JOIN LOCAL GAMES",
    description: "Floodlit futsal, weekend leagues, and trusted hosts around your city.",
    image: "/feed/hero-soccer.jpg",
    ctaLabel: "Find Matches",
    ctaHref: "#nearby-games",
  },
  {
    id: "match-details",
    tag: "CONFIDENCE",
    title: "SECURE YOUR SPOT",
    description: "See venue, teams, rules, price, and payment state before you commit.",
    image: "/onboarding/confidence.png",
    ctaLabel: "Browse Games",
    ctaHref: "#nearby-games",
  },
  {
    id: "roster",
    tag: "SQUAD",
    title: "SEE WHO'S PLAYING",
    description: "Preview the lineup, team balance, and organizer reputation before kick-off.",
    image: "/onboarding/roster.png",
    ctaLabel: "Explore",
    ctaHref: "#nearby-games",
  },
  {
    id: "confidence",
    tag: "LIVE MATCH",
    title: "RUN THE CLOCK",
    description: "Use the live timer, rotations, and match room once the game starts.",
    image: "/feed/hero-night-court.png",
    ctaLabel: "Get Started",
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
