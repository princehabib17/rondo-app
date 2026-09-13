import { ErrorScreen } from "@/components/system/ErrorScreen";
import { RondoButton } from "@/components/rondo/primitives";

export default function NotFound() {
  return (
    <ErrorScreen
      title="That page isn't on the pitch"
      body="The link may be old, or the match, tournament, or profile it pointed to was removed."
      primary={<RondoButton href="/feed">Find a match</RondoButton>}
      secondary={
        <RondoButton href="/" variant="secondary">
          Back to start
        </RondoButton>
      }
    />
  );
}
