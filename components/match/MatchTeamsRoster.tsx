import { PlayerAvatar } from "@/components/game/PlayerAvatar";
import type { Game, Profile } from "@/lib/supabase/types";
import {
  isTeamFull,
  playersPerTeam,
  teamPlayerCount,
  teamSpotsLeft,
} from "@/lib/match/rules";
import { cn } from "@/lib/utils";

interface TeamWithPlayers {
  id: string;
  name: string;
  color: string;
  slot_number: number;
  game_players?: Array<{
    id: string;
    user_id: string;
    profile: Pick<Profile, "id" | "avatar_url" | "nationality"> | null;
  }>;
}

export function MatchTeamsRoster({ game }: { game: Game }) {
  const teams = (game.teams as TeamWithPlayers[] | undefined)?.sort(
    (a, b) => a.slot_number - b.slot_number
  );
  if (!teams?.length) return null;

  const cap = playersPerTeam(game);

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-white font-black italic text-xl uppercase leading-none">
        Players joining
      </h2>
      <p className="font-body text-white/45 text-xs">
        Avatar and flag only · {cap} slots per team
      </p>
      <div className="grid grid-cols-2 gap-3">
        {teams.map((team) => {
          const count = teamPlayerCount(team);
          const left = teamSpotsLeft(team, game);
          const full = isTeamFull(team, game);
          const emptySlots = Array.from({ length: left });

          return (
            <div
              key={team.id}
              className={cn(
                "rondo-surface p-3 space-y-3",
                full && "opacity-70"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-heading text-white text-base font-black italic uppercase truncate flex-1">
                  {team.name}
                </span>
                {full ? (
                  <span className="text-[10px] font-semibold text-white/40 uppercase">Full</span>
                ) : (
                  <span className="text-[10px] font-semibold text-rondo-accent">
                    {left} left
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {team.game_players?.map((gp) =>
                  gp.profile ? (
                    <PlayerAvatar
                      key={gp.id}
                      profile={gp.profile as Profile}
                      size="xs"
                      showFlag
                      linkable={false}
                    />
                  ) : null
                )}
                {emptySlots.map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="w-7 h-7 rounded-full border border-dashed border-white/20 bg-white/5"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-[10px] text-white/40">
                {count}/{cap} filled
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
