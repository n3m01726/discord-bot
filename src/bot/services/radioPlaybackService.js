import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  getVoiceConnection
} from '@discordjs/voice';
import config from '../config.js';
import logger from '../logger.js';

const tempVcConnections = new Map();

export async function startRadioInVoiceChannel (channel) {
  if (!config.STREAM_URL) {
    logger.warn('TempVC auto-play ignoré: STREAM_URL non configurée');
    return { success: false, reason: 'STREAM_URL manquante' };
  }

  try {
    const existing = getVoiceConnection(channel.guild.id);
    if (existing) {
      try {
        existing.destroy();
      } catch {
        // Ignore clean-up errors
      }
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false
    });

    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    });

    const resource = createAudioResource(config.STREAM_URL, { inlineVolume: true });
    player.play(resource);
    connection.subscribe(player);

    tempVcConnections.set(channel.id, { connection, player });
    return { success: true };
  } catch (error) {
    logger.error('Erreur auto-play TempVC:', error);
    return { success: false, reason: error.message };
  }
}

export function stopRadioForTempChannel (channelId) {
  const active = tempVcConnections.get(channelId);
  if (!active) return;

  try {
    active.player.stop();
    active.connection.destroy();
  } catch {
    // Ignore clean-up errors
  }

  tempVcConnections.delete(channelId);
}
