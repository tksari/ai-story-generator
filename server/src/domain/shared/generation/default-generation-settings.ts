export const defaultSettings = {
  video: {
    resolution: "1280x720",
    fps: 30,
    format: "mp4",
    codec: "libx264",
    quality: "medium",
    videoBitrate: "2500k",
    pixelFormat: "yuv420p",
  },
  audio: {
    codec: "mp3",
    bitrate: "128k",
    sampleRate: 48000,
    channels: 2,
    normalization: false,
  },
  transitions: {
    enabled: true,
    type: "fade",
    duration: 1.0,
  },
  backgroundMusic: {
    enabled: false,
    volume: 0.3,
    fadeIn: 2,
    fadeOut: 2,
    file: null,
  },
  performance: {
    threads: 0,
    maxCpuUsage: 70,
    preset: "faster",
  },
  gaps: {
    startSilence: 1.5,
    betweenSilence: 1.5,
    endSilence: 1.5,
  },
};

export const getDefaultSettings = () => defaultSettings;

export const resolutionOptions = [
  { value: "1920x1080", label: "1920x1080 (Full HD)" },
  { value: "1280x720", label: "1280x720 (HD)" },
  { value: "854x480", label: "854x480 (SD)" },
  { value: "640x360", label: "640x360 (360p)" },
];

export const fpsOptions = [
  { value: 60, label: "60 FPS" },
  { value: 30, label: "30 FPS" },
  { value: 25, label: "25 FPS" },
  { value: 24, label: "24 FPS" },
  { value: 15, label: "15 FPS" },
];

export const videoCodecOptions = [
  { value: "libx264", label: "H.264 (AVC)", container: "mp4" },
  { value: "libx265", label: "H.265 (HEVC)", container: "mp4" },
  { value: "libvpx", label: "VP8", container: "webm" },
  { value: "libvpx-vp9", label: "VP9", container: "webm" },
  { value: "mpeg4", label: "MPEG-4", container: "mp4" },
  { value: "libx264rgb", label: "H.264 RGB (alpha)", container: "mkv" },
];

export const qualityOptions = [
  { value: "ultrafast", label: "Lowest Quality / Fastest" },
  { value: "superfast", label: "Very Low Quality" },
  { value: "veryfast", label: "Low Quality" },
  { value: "faster", label: "Standard (Fast)" },
  { value: "fast", label: "Standard+" },
  { value: "medium", label: "Medium Quality" },
  { value: "slow", label: "High Quality" },
  { value: "slower", label: "Very High Quality" },
  { value: "veryslow", label: "Highest Quality / Slowest" },
];

export const audioCodecOptions = [
  { value: "aac", label: "AAC" },
  { value: "mp3", label: "MP3" },
  { value: "libopus", label: "Opus" },
  { value: "copy", label: "Preserve Original" },
];

export const transitionOptions = [
  { value: "fade", label: "Fade" },
  { value: "wipeleft", label: "Wipe Left" },
  { value: "wiperight", label: "Wipe Right" },
  { value: "wipeup", label: "Wipe Up" },
  { value: "wipedown", label: "Wipe Down" },
  { value: "slideleft", label: "Slide Left" },
  { value: "slideright", label: "Slide Right" },
];

export const pixelFormatOptions = [
  { value: "yuv420p", label: "yuv420p (Standard - Smallest size)" },
  { value: "yuv422p", label: "yuv422p (Better chroma - Medium size)" },
  { value: "yuv444p", label: "yuv444p (Best chroma - Largest size)" },
];

export const videoBitrateOptions = [
  { value: "500k", label: "500 kbps (Low Quality)" },
  { value: "1000k", label: "1000 kbps (SD Quality)" },
  { value: "2500k", label: "2500 kbps (HD Quality)" },
  { value: "5000k", label: "5000 kbps (Full HD Quality)" },
  { value: "8000k", label: "8000 kbps (High Quality)" },
];

export const audioSampleRateOptions = [
  { value: 44100, label: "44.1 kHz (CD)" },
  { value: 48000, label: "48 kHz (DVD/Dijital)" },
  { value: 96000, label: "96 kHz (Studio)" },
];

export const audioBitrateOptions = [
  { value: "64k", label: "64 kbps (Low Quality)" },
  { value: "96k", label: "96 kbps (Medium Quality)" },
  { value: "128k", label: "128 kbps (Standard Quality)" },
  { value: "192k", label: "192 kbps (High Quality)" },
  { value: "256k", label: "256 kbps (Very High Quality)" },
];

export const audioChannelOptions = [
  { value: 1, label: "Mono (1)" },
  { value: 2, label: "Stereo (2)" },
];

export const defaultGenerationSettings = {
  video: {
    resolutionOptions,
    fpsOptions,
    videoCodecOptions,
    qualityOptions,
    pixelFormatOptions,
    videoBitrateOptions,
  },
  audio: {
    audioCodecOptions,
    audioSampleRateOptions,
    audioBitrateOptions,
    audioChannelOptions,
  },
  transition: {
    transitionOptions,
  },
};
