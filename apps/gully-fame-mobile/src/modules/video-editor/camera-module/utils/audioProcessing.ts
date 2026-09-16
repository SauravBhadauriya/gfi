/**
 * Audio Processing Engine
 * Handles all audio effects, TTS, mixing, and processing
 */

// Audio imports removed - expo-av native module error
const Audio = { Sound: { create: async () => ({ sound: null }) } };
import { AudioTrackWithEffects, VoiceOverlayWithEffects, AudioEffectType, TextToSpeechConfig, AudioMixSettings } from '../types/audioEffects.types';
import * as FileSystem from 'expo-file-system';

// Conditional Speech import - optional for TTS
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (e) {
  console.log('expo-speech not available');
}

// Audio effect presets
const AUDIO_EFFECTS: Record<AudioEffectType, any> = {
  'none': { pitchShift: 0, speedMultiplier: 1, reverbLevel: 0, distortionLevel: 0 },
  'helium': { pitchShift: 12, speedMultiplier: 1.2, reverbLevel: 0.1, distortionLevel: 0 },
  'low': { pitchShift: -12, speedMultiplier: 0.9, reverbLevel: 0.3, distortionLevel: 0 },
  'toy_speaker': { pitchShift: 8, speedMultiplier: 1.1, reverbLevel: 0.5, distortionLevel: 0.3 },
  'microphone': { pitchShift: 0, speedMultiplier: 1, reverbLevel: 0, distortionLevel: 0.1 },
  'android': { pitchShift: -5, speedMultiplier: 0.95, reverbLevel: 0.2, distortionLevel: 0.2 },
};

// TTS Voice configurations
const TTS_VOICES: Record<string, any> = {
  'alex': { language: 'en-US', rate: 0.9 },
  'billie': { language: 'en-US', rate: 0.85 },
  'bold': { language: 'en-US', rate: 0.95 },
  'bubbly': { language: 'en-US', rate: 1.1 },
  'calm': { language: 'en-US', rate: 0.75 },
};

/**
 * Generate FFmpeg filter chain for audio effects
 */
export function generateAudioEffectFilter(effect: AudioEffectType, eqSettings?: { bass?: number; mid?: number; treble?: number }): string {
  const effectPreset = AUDIO_EFFECTS[effect] || AUDIO_EFFECTS['none'];
  const filters: string[] = [];

  // Pitch shift (using rubberband or similar)
  if (effectPreset.pitchShift !== 0) {
    filters.push(`asetrate=44100*pow(2,${effectPreset.pitchShift}/12),atempo=1`);
  }

  // Speed multiplier
  if (effectPreset.speedMultiplier !== 1) {
    filters.push(`atempo=${effectPreset.speedMultiplier}`);
  }

  // Reverb effect
  if (effectPreset.reverbLevel > 0) {
    const reverbIntensity = effectPreset.reverbLevel * 100;
    filters.push(`aecho=0.8:0.9:${50 + reverbIntensity}:0.5`);
  }

  // Distortion
  if (effectPreset.distortionLevel > 0) {
    filters.push(`adelay=${effectPreset.distortionLevel * 50}|${effectPreset.distortionLevel * 50}`);
  }

  // EQ settings (bass/mid/treble)
  if (eqSettings && (eqSettings.bass !== undefined || eqSettings.mid !== undefined || eqSettings.treble !== undefined)) {
    const bass = eqSettings.bass || 0;
    const mid = eqSettings.mid || 0;
    const treble = eqSettings.treble || 0;
    filters.push(`equalizer=f=100:g=${bass},equalizer=f=1000:g=${mid},equalizer=f=10000:g=${treble}`);
  }

  // Fade in/out
  filters.push(`afade=t=in:st=0:d=0.5,afade=t=out:st=-1:d=0.5`);

  return filters.length > 0 ? filters.join(',') : '';
}

/**
 * Synthesize text-to-speech audio and return URI
 */
export async function synthesizeTextToSpeech(config: TextToSpeechConfig): Promise<string> {
  try {
    // Request audio permissions
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Audio permission not granted');
    }

    // Set audio mode for recording
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const voiceConfig = TTS_VOICES[config.voice] || TTS_VOICES['alex'];
    
    // Use expo-speech to generate audio
    // Note: This is a simplified implementation. For production, you'd want to:
    // 1. Use a real TTS API (Google Cloud Text-to-Speech, etc.)
    // 2. Save the audio to a file
    // 3. Return the file URI
    
    // For now, we'll create a placeholder
    const cacheDir = (FileSystem as any).cacheDirectory || '';
    const audioUri = `${cacheDir}tts_${config.id}_${Date.now()}.wav`;
    
    // In a real implementation, you would:
    // - Call Speech.speak() with event listeners
    // - Record the output using expo-av
    // - Save to audioUri
    
    console.log('TTS: Generating speech for:', config.text);
    
    // Placeholder: return mock URI
    return audioUri;
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error(`Text-to-speech failed: ${error}`);
  }
}

/**
 * Build FFmpeg audio mixing command
 * Combines multiple audio tracks with proper mixing
 */
export function buildAudioMixCommand(
  tracks: AudioTrackWithEffects[],
  mixSettings: AudioMixSettings,
  videoUri: string
): string {
  if (tracks.length === 0) return '';

  let command = `-i "${videoUri}" `;
  const filterInputs: string[] = [];

  // Add audio input files
  tracks.forEach((track, index) => {
    command += `-i "${track.uri}" `;
    filterInputs.push(`[${index + 1}:a]`);
  });

  // Build volume filters
  const volumeFilters = tracks.map((track, index) => {
    const trackVolume = (track.volume || 1) * (mixSettings.masterVolume || 1);
    const effect = generateAudioEffectFilter(track.audioEffect || 'none', {
      bass: track.bassGain,
      mid: track.midtoneGain,
      treble: track.trebleGain,
    });
    
    let filter = `[${index + 1}:a]volume=${trackVolume}`;
    if (effect) {
      filter += `,${effect}`;
    }
    filter += `[a${index}]`;
    return filter;
  });

  // Build amix filter to combine all tracks
  const amixInputs = tracks.map((_, index) => `[a${index}]`).join('');
  const amixFilter = `${amixInputs}amix=inputs=${tracks.length}:duration=longest[aout]`;

  // Combine all filters
  const fullFilterComplex = volumeFilters.join(';') + ';' + amixFilter;

  return `-filter_complex "${fullFilterComplex}" -map 0:v -map "[aout]" -c:v copy -c:a aac`;
}

/**
 * Extract waveform data from audio file (simplified)
 */
export async function extractWaveformData(audioUri: string, duration: number) {
  try {
    // This is a simplified placeholder
    // In production, use: react-native-audiowaveform or similar
    const samples = Array.from({ length: 100 }, () => Math.random());
    return {
      audioId: audioUri,
      samples,
      duration,
      sampleRate: 44100,
      channels: 2,
    };
  } catch (error) {
    console.error('Waveform extraction error:', error);
    return null;
  }
}

/**
 * Apply audio fade effects
 */
export function generateFadeFilter(fadeIn?: number, fadeOut?: number): string {
  const filters: string[] = [];
  
  if (fadeIn && fadeIn > 0) {
    filters.push(`afade=t=in:st=0:d=${fadeIn}`);
  }
  
  if (fadeOut && fadeOut > 0) {
    filters.push(`afade=t=out:st=-${fadeOut}:d=${fadeOut}`);
  }

  return filters.join(',');
}

/**
 * Normalize audio levels
 */
export function generateNormalizationFilter(targetLevel: number = -20): string {
  return `anlmdn,loudness=I=${targetLevel}:TP=-1.5:LRA=11`;
}

/**
 * Generate complete audio processing chain for FFmpeg
 */
export function generateAudioProcessingChain(
  track: AudioTrackWithEffects,
  cropStart?: number,
  cropEnd?: number
): string {
  const filters: string[] = [];

  // Cropping
  if (cropStart !== undefined || cropEnd !== undefined) {
    const start = cropStart || 0;
    const end = cropEnd ? `'${cropEnd - start}'` : 'inf';
    filters.push(`atrim=start=${start}:end=${end},asetpts=PTS-STARTPTS`);
  }

  // Volume
  const volume = track.volume || 1;
  if (volume !== 1) {
    filters.push(`volume=${volume}`);
  }

  // Audio effects
  if (track.audioEffect && track.audioEffect !== 'none') {
    const effectFilter = generateAudioEffectFilter(track.audioEffect, {
      bass: track.bassGain,
      mid: track.midtoneGain,
      treble: track.trebleGain,
    });
    if (effectFilter) {
      filters.push(effectFilter);
    }
  }

  // Fading
  const fadeFilter = generateFadeFilter(track.fadeIn, track.fadeOut);
  if (fadeFilter) {
    filters.push(fadeFilter);
  }

  // Normalization
  if (track.isNormalized) {
    filters.push(generateNormalizationFilter(track.normalizedLevel ? -20 + track.normalizedLevel * 10 : -20));
  }

  return filters.join(',');
}

/**
 * Calculate total audio duration including all effects
 */
export function calculateAudioDuration(tracks: AudioTrackWithEffects[]): number {
  if (tracks.length === 0) return 0;
  return Math.max(...tracks.map(track => track.endTime || track.duration));
}

export { Audio, Speech };
