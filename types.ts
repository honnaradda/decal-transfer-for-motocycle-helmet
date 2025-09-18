
export type HelmetState = {
  file: File | null;
  previewUrl: string | null;
};

export type HelmetType = 'half-face' | 'open-face' | 'fullface' | 'cross-mx';

export type DecalPrompt = {
  theme: string;
  motifs: string;
  flow: string;
  palette: string;
  density: string;
  finish: string;
  typography: string;
  mood: string;
};

export type StyleId = 'line-sketch' | 'watercolor' | 'marker' | 'neon';
export type ActiveTab = 'single' | 'full-view' | 'style';
export type FullViewResolution = 1024 | 2048 | 4096;
export type FullViewAngleSpread = 'narrow' | 'standard' | 'wide';

/** Represents the data URL of the generated 2x2 grid image for the full view. */
export type FullViewResult = string | null;


export const initialHelmetState: HelmetState = { file: null, previewUrl: null };
export const initialDecalPrompt: DecalPrompt = {
  theme: '', motifs: '', flow: '', palette: '', density: '', finish: '', typography: '', mood: ''
};
