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
    image: "/feed/hero-soccer.jpg",
    ctaLabel: "Find Matches",
    ctaHref: "#nearby-games",
  },
  {
    id: "secure",
    tag: "GET STARTED",
    title: "SECURE YOUR SPOT",
    description: "Book your place before the game fills up.",
    image: "/onboarding/secure.png",
    ctaLabel: "Browse Games",
    ctaHref: "#nearby-games",
  },
  {
    id: "map",
    tag: "NEARBY",
    title: "FIND GAMES NEAR YOU",
    description: "See matches on the map and join in seconds.",
    image: "/onboarding/map.png",
    ctaLabel: "Open Map",
    ctaHref: "/feed/map",
  },
  {
    id: "players",
    tag: "COMMUNITY",
    title: "SEE WHO'S PLAYING",
    description: "Check rosters, skill levels, and who's on the pitch.",
    image: "/onboarding/players.png",
    ctaLabel: "Explore",
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
