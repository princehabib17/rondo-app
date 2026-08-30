import Image from "next/image";

export function OnboardingHeader() {
  return (
    <div className="pt-2">
      <Image
        src="/rondo-logo.png"
        alt="RONDO"
        width={40}
        height={40}
        className="object-contain"
        style={{ width: "auto", height: "auto" }}
      />
    </div>
  );
}
