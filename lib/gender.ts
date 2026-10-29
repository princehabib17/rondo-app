export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function isGender(value: string | null | undefined): value is Gender {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

export function genderLabel(value: string | null | undefined): string {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? "";
}
