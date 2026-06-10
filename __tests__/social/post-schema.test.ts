import { describe, expect, it } from "vitest";
import { createCommentSchema, createPostSchema, POST_BODY_MAX } from "@/lib/social/post-schema";

describe("createPostSchema", () => {
  it("accepts a plain post", () => {
    const parsed = createPostSchema.safeParse({ body: "Great game tonight!" });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.kind).toBe("post");
  });

  it("trims and rejects empty bodies", () => {
    expect(createPostSchema.safeParse({ body: "   " }).success).toBe(false);
  });

  it("rejects bodies over the limit", () => {
    expect(createPostSchema.safeParse({ body: "x".repeat(POST_BODY_MAX + 1) }).success).toBe(false);
  });

  it("rejects non-https media links", () => {
    expect(
      createPostSchema.safeParse({ body: "clip", mediaUrl: "http://evil.example/x.mp4" }).success
    ).toBe(false);
    expect(
      createPostSchema.safeParse({ body: "clip", mediaUrl: "https://example.com/x.mp4" }).success
    ).toBe(true);
  });

  it("rejects malformed game/tournament ids", () => {
    expect(createPostSchema.safeParse({ body: "hi", gameId: "not-a-uuid" }).success).toBe(false);
  });
});

describe("createCommentSchema", () => {
  it("enforces the comment length limit", () => {
    expect(createCommentSchema.safeParse({ body: "nice" }).success).toBe(true);
    expect(createCommentSchema.safeParse({ body: "x".repeat(501) }).success).toBe(false);
  });
});
