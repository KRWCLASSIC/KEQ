// Standard Equalizer Presets
export const PRESETS = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0],
  'bass-boost': [6.5, 5.0, 3.5, 1.0, 0.0, 0.0, 0.0, 0.0],
  'treble-boost': [0.0, 0.0, 0.0, 0.0, 1.5, 3.5, 5.0, 6.5],
  'vocal-boost': [-2.0, -1.0, 1.0, 3.5, 4.0, 3.0, 1.5, -1.0],
  dance: [5.5, 4.5, 1.5, -0.5, 2.0, 1.5, 3.5, 4.5],
  rock: [4.5, 3.0, -1.0, -2.0, 0.5, 2.0, 3.0, 4.5],
  pop: [-1.5, 1.5, 3.0, 2.0, -0.5, -1.0, 1.5, 2.5],
  classical: [3.5, 2.5, 1.5, 1.0, -1.0, -1.5, -0.5, 2.0]
};

// Initial layout (Standard 8-band setup)
export const INITIAL_SPEC = [
  { type: "lowshelf12", frequency: 32, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 64, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 125, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 250, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 500, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 1000, gain: 0, Q: 0.7, bypass: false },
  { type: "peaking12", frequency: 2000, gain: 0, Q: 0.7, bypass: false },
  { type: "highshelf12", frequency: 8000, gain: 0, Q: 0.7, bypass: false }
];
