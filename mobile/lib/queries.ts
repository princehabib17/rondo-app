import { supabase } from './supabase';
import type {
  Profile, Game, Team, GamePlayer, GamePlayerWithProfile, Announcement,
  WalletTransaction, PayoutRequest, AppNotification, Message, DirectMessage,
  Tournament, TournamentTeam, TournamentMatch, Post, PostComment,
  PlayerReel, ScoutShortlist, Organization,
} from './types';

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

// ── Auth / session ────────────────────────────────────────────
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

// ── Profiles ──────────────────────────────────────────────────
export async function getProfile(id: string): Promise<Profile> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', id).single());
}

export async function getMyProfile(): Promise<Profile | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;
  return unwrap(await supabase.from('profiles').select('*').eq('id', uid).single());
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('profiles').update(patch).eq('id', uid).select('*').single());
}

export async function getPlayerStats(userId: string) {
  const [games, followers, following] = await Promise.all([
    supabase.from('game_players').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);
  return {
    games: games.count ?? 0,
    followers: followers.count ?? 0,
    following: following.count ?? 0,
  };
}

// ── Follows ───────────────────────────────────────────────────
export async function isFollowing(targetId: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const { count } = await supabase
    .from('follows').select('follower_id', { count: 'exact', head: true })
    .eq('follower_id', uid).eq('following_id', targetId);
  return (count ?? 0) > 0;
}

export async function toggleFollow(targetId: string, follow: boolean): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  if (follow) {
    unwrap(await supabase.from('follows').insert({ follower_id: uid, following_id: targetId }).select());
  } else {
    const { error } = await supabase.from('follows').delete().eq('follower_id', uid).eq('following_id', targetId);
    if (error) throw new Error(error.message);
  }
}

// ── Games ─────────────────────────────────────────────────────
const GAME_WITH_ORG = '*, organizer:profiles!games_organizer_id_fkey(id, full_name, avatar_url)';

export async function listGames(opts: { status?: string; organizerId?: string; upcomingOnly?: boolean } = {}): Promise<Game[]> {
  let q = supabase.from('games').select(GAME_WITH_ORG).eq('is_private', false);
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.organizerId) q = q.eq('organizer_id', opts.organizerId);
  if (opts.upcomingOnly) q = q.gte('date_time', new Date().toISOString());
  q = q.order('date_time', { ascending: true });
  return unwrap(await q) as unknown as Game[];
}

export async function getGame(id: string): Promise<Game> {
  return unwrap(await supabase.from('games').select(GAME_WITH_ORG).eq('id', id).single()) as unknown as Game;
}

export async function getGameTeams(gameId: string): Promise<Team[]> {
  return unwrap(await supabase.from('teams').select('*').eq('game_id', gameId).order('slot_number'));
}

export async function getGamePlayers(gameId: string): Promise<GamePlayerWithProfile[]> {
  return unwrap(
    await supabase.from('game_players')
      .select('*, profile:profiles!game_players_user_id_fkey(id, full_name, avatar_url, skill_level, position)')
      .eq('game_id', gameId)
  ) as unknown as GamePlayerWithProfile[];
}

export async function createGame(input: Partial<Game>): Promise<Game> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('games').insert({ ...input, organizer_id: uid }).select('*').single());
}

export async function updateGame(id: string, patch: Partial<Game>): Promise<Game> {
  return unwrap(await supabase.from('games').update(patch).eq('id', id).select('*').single());
}

/** Join a game for "venue"/pay-later games (no online payment). Online/wallet payment goes through the API. */
export async function joinGameVenue(gameId: string, teamId: string | null): Promise<GamePlayer> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(
    await supabase.from('game_players')
      .insert({ game_id: gameId, user_id: uid, team_id: teamId, payment_status: 'venue' })
      .select('*').single()
  );
}

export async function getMyGames(): Promise<(GamePlayer & { game: Game | null })[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(
    await supabase.from('game_players')
      .select('*, game:games(*)')
      .eq('user_id', uid)
      .order('joined_at', { ascending: false })
  ) as unknown as (GamePlayer & { game: Game | null })[];
}

// ── Waitlist ──────────────────────────────────────────────────
export async function joinWaitlist(gameId: string, teamId: string | null): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  unwrap(await supabase.from('game_waitlist').insert({ game_id: gameId, user_id: uid, team_id: teamId }).select());
}

// ── Announcements ─────────────────────────────────────────────
export async function getAnnouncements(gameId: string): Promise<Announcement[]> {
  return unwrap(await supabase.from('announcements').select('*').eq('game_id', gameId).order('created_at', { ascending: false }));
}

export async function postAnnouncement(gameId: string, body: string): Promise<Announcement> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('announcements').insert({ game_id: gameId, organizer_id: uid, body }).select('*').single());
}

// ── Game chat (messages) ──────────────────────────────────────
export async function getGameMessages(gameId: string): Promise<(Message & { profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null })[]> {
  return unwrap(
    await supabase.from('messages')
      .select('*, profile:profiles!messages_user_id_fkey(id, full_name, avatar_url)')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true })
  ) as unknown as (Message & { profile: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null })[];
}

export async function sendGameMessage(gameId: string, body: string): Promise<Message> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('messages').insert({ game_id: gameId, user_id: uid, body }).select('*').single());
}

// ── Direct messages ───────────────────────────────────────────
export async function getConversation(peerId: string): Promise<DirectMessage[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(
    await supabase.from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${uid},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${uid})`)
      .order('created_at', { ascending: true })
  );
}

export async function sendDirectMessage(peerId: string, body: string): Promise<DirectMessage> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('direct_messages').insert({ sender_id: uid, recipient_id: peerId, body }).select('*').single());
}

/** Latest message per conversation partner, newest first. */
export async function listConversations(): Promise<{ peer: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>; last: DirectMessage; unread: number }[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const rows = unwrap(
    await supabase.from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${uid},recipient_id.eq.${uid}`)
      .order('created_at', { ascending: false })
  ) as DirectMessage[];

  const byPeer = new Map<string, { last: DirectMessage; unread: number }>();
  for (const m of rows) {
    const peerId = m.sender_id === uid ? m.recipient_id : m.sender_id;
    const entry = byPeer.get(peerId);
    const isUnread = m.recipient_id === uid && !m.read_at;
    if (!entry) byPeer.set(peerId, { last: m, unread: isUnread ? 1 : 0 });
    else if (isUnread) entry.unread += 1;
  }
  const peerIds = [...byPeer.keys()];
  if (peerIds.length === 0) return [];
  const profiles = unwrap(await supabase.from('profiles').select('id, full_name, avatar_url').in('id', peerIds)) as Pick<Profile, 'id' | 'full_name' | 'avatar_url'>[];
  return peerIds.map((pid) => ({
    peer: profiles.find((p) => p.id === pid) ?? { id: pid, full_name: null, avatar_url: null },
    last: byPeer.get(pid)!.last,
    unread: byPeer.get(pid)!.unread,
  }));
}

// ── Wallet ────────────────────────────────────────────────────
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(await supabase.from('wallet_transactions').select('*').eq('user_id', uid).order('created_at', { ascending: false }));
}

/** Balance in centavos (credits − debits). */
export async function getWalletBalance(): Promise<number> {
  const txns = await getWalletTransactions();
  return txns.reduce((sum, t) => sum + (t.direction === 'credit' ? t.amount : -t.amount), 0);
}

// ── Organizer earnings ────────────────────────────────────────
export async function getOrganizerEarnings(): Promise<{ collected: number; txns: WalletTransaction[] }> {
  const uid = await getCurrentUserId();
  if (!uid) return { collected: 0, txns: [] };
  const txns = unwrap(await supabase.from('wallet_transactions').select('*').eq('organizer_id', uid).order('created_at', { ascending: false })) as WalletTransaction[];
  const collected = txns.reduce((s, t) => s + (t.direction === 'credit' ? t.amount : -t.amount), 0);
  return { collected, txns };
}

export async function getPayoutRequests(): Promise<PayoutRequest[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(await supabase.from('payout_requests').select('*').eq('organizer_id', uid).order('created_at', { ascending: false }));
}

export async function requestPayout(input: { amount: number; bank_account_name?: string; bank_name?: string; bank_account_number?: string }): Promise<PayoutRequest> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('payout_requests').insert({ ...input, organizer_id: uid }).select('*').single());
}

// ── Notifications ─────────────────────────────────────────────
export async function getNotifications(): Promise<AppNotification[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(await supabase.from('notifications').select('*').eq('user_id', uid).order('created_at', { ascending: false }));
}

export async function markNotificationRead(id: string): Promise<void> {
  unwrap(await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).select());
}

// ── Tournaments ───────────────────────────────────────────────
export async function listTournaments(opts: { status?: string; organizerId?: string } = {}): Promise<Tournament[]> {
  let q = supabase.from('tournaments').select('*');
  if (opts.status) q = q.eq('status', opts.status);
  if (opts.organizerId) q = q.eq('organizer_id', opts.organizerId);
  return unwrap(await q.order('starts_at', { ascending: true }));
}

export async function getTournament(id: string): Promise<Tournament> {
  return unwrap(await supabase.from('tournaments').select('*').eq('id', id).single());
}

export async function getTournamentTeams(tournamentId: string): Promise<TournamentTeam[]> {
  return unwrap(await supabase.from('tournament_teams').select('*').eq('tournament_id', tournamentId).order('created_at'));
}

export async function getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
  return unwrap(await supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('round').order('position'));
}

export async function createTournament(input: Partial<Tournament>): Promise<Tournament> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('tournaments').insert({ ...input, organizer_id: uid }).select('*').single());
}

export async function registerTournamentTeam(tournamentId: string, name: string): Promise<TournamentTeam> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('tournament_teams').insert({ tournament_id: tournamentId, captain_id: uid, name }).select('*').single());
}

// ── Social: posts ─────────────────────────────────────────────
export async function listPosts(): Promise<(Post & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null; like_count: number; comment_count: number; liked_by_me: boolean })[]> {
  const uid = await getCurrentUserId();
  const posts = unwrap(
    await supabase.from('posts')
      .select('*, author:profiles!posts_author_id_fkey(id, full_name, avatar_url), post_likes(user_id), post_comments(id)')
      .order('created_at', { ascending: false })
  ) as any[];
  return posts.map((p) => ({
    ...p,
    like_count: p.post_likes?.length ?? 0,
    comment_count: p.post_comments?.length ?? 0,
    liked_by_me: uid ? (p.post_likes ?? []).some((l: any) => l.user_id === uid) : false,
  }));
}

export async function createPost(body: string, mediaUrl?: string): Promise<Post> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('posts').insert({ author_id: uid, body, media_url: mediaUrl ?? null }).select('*').single());
}

export async function togglePostLike(postId: string, like: boolean): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  if (like) unwrap(await supabase.from('post_likes').insert({ post_id: postId, user_id: uid }).select());
  else {
    const { error } = await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', uid);
    if (error) throw new Error(error.message);
  }
}

export async function getPostComments(postId: string): Promise<(PostComment & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null })[]> {
  return unwrap(
    await supabase.from('post_comments')
      .select('*, author:profiles!post_comments_author_id_fkey(id, full_name, avatar_url)')
      .eq('post_id', postId).order('created_at')
  ) as unknown as (PostComment & { author: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null })[];
}

export async function addComment(postId: string, body: string): Promise<PostComment> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('post_comments').insert({ post_id: postId, author_id: uid, body }).select('*').single());
}

// ── Reels ─────────────────────────────────────────────────────
export async function listReels(): Promise<(PlayerReel & { player: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'nationality'> | null; like_count: number; liked_by_me: boolean })[]> {
  const uid = await getCurrentUserId();
  const reels = unwrap(
    await supabase.from('player_reels')
      .select('*, player:profiles!player_reels_player_id_fkey(id, full_name, avatar_url, nationality), reel_likes(user_id)')
      .order('created_at', { ascending: false })
  ) as any[];
  return reels.map((r) => ({
    ...r,
    like_count: r.reel_likes?.length ?? 0,
    liked_by_me: uid ? (r.reel_likes ?? []).some((l: any) => l.user_id === uid) : false,
  }));
}

export async function listReelsByPlayer(playerId: string): Promise<PlayerReel[]> {
  return unwrap(await supabase.from('player_reels').select('*').eq('player_id', playerId).order('created_at', { ascending: false }));
}

export async function toggleReelLike(reelId: string, like: boolean): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  if (like) unwrap(await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: uid }).select());
  else {
    const { error } = await supabase.from('reel_likes').delete().eq('reel_id', reelId).eq('user_id', uid);
    if (error) throw new Error(error.message);
  }
}

export async function createReel(input: { video_url: string; caption?: string; position?: string; skill_level?: string }): Promise<PlayerReel> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  return unwrap(await supabase.from('player_reels').insert({ ...input, player_id: uid }).select('*').single());
}

// ── Scout shortlist ───────────────────────────────────────────
export async function getShortlist(): Promise<(ScoutShortlist & { player: Profile | null })[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  return unwrap(
    await supabase.from('scout_shortlists')
      .select('*, player:profiles!scout_shortlists_player_id_fkey(*)')
      .eq('scout_id', uid).order('created_at', { ascending: false })
  ) as unknown as (ScoutShortlist & { player: Profile | null })[];
}

export async function addToShortlist(playerId: string, note?: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  unwrap(await supabase.from('scout_shortlists').insert({ scout_id: uid, player_id: playerId, note: note ?? null }).select());
}

export async function removeFromShortlist(playerId: string): Promise<void> {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error('Not signed in');
  const { error } = await supabase.from('scout_shortlists').delete().eq('scout_id', uid).eq('player_id', playerId);
  if (error) throw new Error(error.message);
}

// ── Players directory (community / scout discovery) ───────────
export async function listPlayers(limit = 50): Promise<Profile[]> {
  return unwrap(await supabase.from('profiles').select('*').eq('role', 'player').order('created_at', { ascending: false }).limit(limit));
}

// ── Organizations ─────────────────────────────────────────────
export async function getOrganization(id: string): Promise<Organization> {
  return unwrap(await supabase.from('organizations').select('*').eq('id', id).single());
}
