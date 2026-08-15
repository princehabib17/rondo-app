export interface CarouselSlide {
  id: string;
  title: string;
  ctaLabel: string;
  ctaHref: string;
  image?: string;
  theme: "court" | "gold" | "dusk";
}

/** Default hero slides when there is no news or tournament content yet. */
export const DEFAULT_CAROUSEL_SLIDES: CarouselSlide[] = [
  {
    id: "find-a-game",
    title: "Find a game near you",
    ctaLabel: "Open the map",
    ctaHref: "/feed/map",
    image: "/feed/hero-night-court.png",
    theme: "court",
  },
  {
    id: "tournaments",
    title: "Take your team to a tournament",
    ctaLabel: "See tournaments",
    ctaHref: "/tournaments",
    theme: "gold",
  },
  {
    id: "reels",
    title: "Get seen. Post your reels",
    ctaLabel: "Watch reels",
    ctaHref: "/reels",
    theme: "dusk",
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
