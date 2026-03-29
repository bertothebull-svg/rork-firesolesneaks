export type Gender = "male" | "female" | "non-binary" | "prefer-not-to-say";

export type BodyType = 
  | "athletic"
  | "slim"
  | "average"
  | "muscular"
  | "curvy"
  | "plus-size";

export type HairColor = 
  | "black"
  | "brown"
  | "blonde"
  | "red"
  | "gray"
  | "white"
  | "other";

export type EyeColor = 
  | "brown"
  | "blue"
  | "green"
  | "hazel"
  | "gray"
  | "amber";

export interface UserProfile {
  hasCompletedOnboarding: boolean;
  gender?: Gender;
  height?: number;
  heightUnit?: "cm" | "ft";
  weight?: number;
  weightUnit?: "kg" | "lbs";
  bodyType?: BodyType;
  location?: string;
  hairColor?: HairColor;
  eyeColor?: EyeColor;
}
