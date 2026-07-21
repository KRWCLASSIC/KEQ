// Shared mutable runtime state for the KEQ extension.
// All modules import from here to avoid circular dependency issues.

export let audioCtx = null;
export let weq8 = null;
export let sourceNode = null;
export let activeVideo = null;
export let isEqEnabled = true;
export let currentPreset = 'flat';
export let isApplyingPreset = false;
export let isMonoEnabled = false;
export let monoNode = null;
export let lastKnownSpecJSON = null;
export let userPresets = {};

// Setters — used by other modules to mutate the shared state
export function setAudioCtx(v)          { audioCtx = v; }
export function setWeq8(v)              { weq8 = v; }
export function setSourceNode(v)        { sourceNode = v; }
export function setActiveVideo(v)       { activeVideo = v; }
export function setIsEqEnabled(v)       { isEqEnabled = v; }
export function setCurrentPreset(v)     { currentPreset = v; }
export function setIsApplyingPreset(v)  { isApplyingPreset = v; }
export function setIsMonoEnabled(v)     { isMonoEnabled = v; }
export function setMonoNode(v)          { monoNode = v; }
export function setLastKnownSpecJSON(v) { lastKnownSpecJSON = v; }
export function setUserPresets(v)       { userPresets = v; }
