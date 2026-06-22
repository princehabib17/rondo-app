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
    tag: "PLAY LOCAL",
    title: "JOIN LOCAL GAMES",
    description: "Find and join soccer matches near you.",
    image: "/feed/hero-night-court.png",
    ctaLabel: "Find Matches",
    ctaHref: "#nearby-games",
  },
  {
    id: "match-details",
    tag: "MATCH INFO",
    title: "KNOW THE MATCH",
    description: "Check format, teams, venue, and rules before you play.",
    image: "/onboarding/match-details.png",
    ctaLabel: "Browse Games",
    ctaHref: "#nearby-games",
  },
  {
    id: "roster",
    tag: "COMMUNITY",
    title: "SEE WHO'S PLAYING",
    description: "Check rosters, skill levels, and who's on the pitch.",
    image: "/onboarding/roster.png",
    ctaLabel: "Explore",
    ctaHref: "#nearby-games",
  },
  {
    id: "confidence",
    tag: "TRUSTED PLAY",
    title: "PLAY WITH CONFIDENCE",
    description: "Keep payments, spots, and match updates in one place.",
    image: "/onboarding/confidence.png",
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
