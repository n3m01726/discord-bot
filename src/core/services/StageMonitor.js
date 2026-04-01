// ========================================
// core/services/StageMonitor.js - Surveillance des stages pour dÃ©connexion automatique + auto-promotion speaker
// ========================================

import { getVoiceConnection } from '@discordjs/voice';
import logger from '../../bot/logger.js';
import stageSpeakerManager from './StageSpeakerManager.js';

class StageMonitor {
  constructor () {
    this.isMonitoring = false;
    this.checkInterval = 30000;
    this.monitoringInterval = null;
    this.connectedStages = new Map(); // guildId -> { channelId, guild, lastCheck }
    this.isDisconnecting = false;

    logger.info('StageMonitor initialisÃ©');
  }

  startMonitoring () {
    if (this.isMonitoring) {
      logger.warn('StageMonitor dÃ©jÃ  en cours de surveillance');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      void this.checkAllStages();
    }, this.checkInterval);

    logger.info('Surveillance des stages dÃ©marrÃ©e');
  }

  stopMonitoring () {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('ðŸŽ­ Surveillance des stages arrÃªtÃ©e');
  }

  registerStage (guildId, channelId, guild = null) {
    this.connectedStages.set(guildId, {
      channelId,
      guild,
      lastCheck: Date.now()
    });
    logger.info(`ðŸŽ­ Stage enregistrÃ© pour surveillance: ${guildId} -> ${channelId}`);

    void this.promoteBotInStage(guildId, channelId);
  }

  unregisterStage (guildId) {
    if (this.connectedStages.has(guildId)) {
      this.connectedStages.delete(guildId);
      logger.info(`ðŸŽ­ Stage dÃ©senregistrÃ© de la surveillance: ${guildId}`);
    }
  }

  async promoteBotInStage (guildId, channelId) {
    try {
      const connection = getVoiceConnection(guildId);
      if (!connection) {
        logger.warn(`ðŸŽ¤ Pas de connexion active pour promouvoir dans le stage ${channelId}`);
        return;
      }

      const stageInfo = this.connectedStages.get(guildId);
      const channel = stageInfo?.guild?.channels?.cache?.get(channelId);
      if (!channel) {
        logger.warn(`ðŸŽ¤ Canal introuvable pour promotion: ${channelId}`);
        return;
      }

      if (channel.type !== 13) {
        logger.debug(`ðŸŽ¤ Canal n'est pas un stage (type ${channel.type}), promotion ignorÃ©e`);
        return;
      }

      setTimeout(async () => {
        try {
          const activeConnection = getVoiceConnection(guildId);
          const activeStage = this.connectedStages.get(guildId);
          if (!activeConnection || activeStage?.channelId !== channelId) {
            logger.debug(`ðŸŽ¤ Promotion ignorÃ©e: stage ${channelId} inactif`);
            return;
          }

          const result = await stageSpeakerManager.promoteToSpeaker(activeConnection, channel);
          if (result.success) {
            logger.info(`ðŸŽ¤ Bot auto-promu en speaker dans ${channel.name}`);
          } else {
            logger.warn(`ðŸŽ¤ Ã‰chec auto-promotion dans ${channel.name}: ${result.message}`);
          }
        } catch (promotionError) {
          logger.error('ðŸŽ¤ Erreur lors de la promotion diffÃ©rÃ©e du bot:', promotionError);
        }
      }, 3000);
    } catch (error) {
      logger.error('ðŸŽ¤ Erreur lors de la tentative d\'auto-promotion:', error);
    }
  }

  async checkAllStages () {
    if (this.connectedStages.size === 0) {
      return;
    }

    logger.debug(`ðŸŽ­ VÃ©rification de ${this.connectedStages.size} stage(s)`);

    for (const [guildId, stageInfo] of this.connectedStages) {
      try {
        await this.checkStage(guildId, stageInfo.channelId);
      } catch (error) {
        logger.error(`Erreur lors de la vÃ©rification du stage ${guildId}:`, error);
      }
    }
  }

  async checkStage (guildId, channelId) {
    try {
      const connection = getVoiceConnection(guildId);

      if (!connection) {
        this.unregisterStage(guildId);
        return;
      }

      const connectedChannelId = connection.joinConfig.channelId;
      if (connectedChannelId !== channelId) {
        logger.warn(`ðŸŽ­ Canal de connexion diffÃ©rent: attendu ${channelId}, trouvÃ© ${connectedChannelId}`);
        return;
      }

      const stageInfo = this.connectedStages.get(guildId);
      const voiceChannel = stageInfo?.guild?.channels?.cache?.get(channelId);

      if (!voiceChannel) {
        logger.warn(`ðŸŽ­ Canal vocal introuvable: ${channelId}`);
        this.unregisterStage(guildId);
        return;
      }

      const humanMembers = voiceChannel.members.filter(member => !member.user.bot);
      const botMembers = voiceChannel.members.filter(member => member.user.bot);

      logger.debug(`ðŸŽ­ Stage ${channelId}: ${humanMembers.size} humains, ${botMembers.size} bots`);

      if (humanMembers.size === 0 && botMembers.size > 0) {
        logger.info(`ðŸŽ­ Aucun humain dans le stage ${voiceChannel.name}, dÃ©connexion du bot`);
        await this.disconnectFromStage(connection, guildId, voiceChannel);
      }
    } catch (error) {
      logger.error(`Erreur lors de la vÃ©rification du stage ${guildId}:`, error);
    }
  }

  async disconnectFromStage (connection, guildId, voiceChannel) {
    try {
      if (this.isDisconnecting) return;
      this.isDisconnecting = true;

      const player = connection?.state?.subscription?.player;
      player?.stop(true);

      await new Promise(resolve => setTimeout(resolve, 500));

      connection?.destroy();
      this.unregisterStage(guildId);

      logger.info(`ðŸŽ­ Bot dÃ©connectÃ© du stage: ${voiceChannel.name}`);
    } catch (err) {
      logger.error('Erreur dÃ©connexion stage:', err);
    } finally {
      this.isDisconnecting = false;
    }
  }

  async logDisconnection (voiceChannel) {
    try {
      const { guild } = voiceChannel;
      const logChannel = guild.channels.cache.find(channel =>
        channel.name.includes('log')
        || channel.name.includes('admin')
        || channel.name.includes('bot'));

      if (logChannel && logChannel.permissionsFor(guild.members.me).has('SendMessages')) {
        await logChannel.send({
          content: 'ðŸŽ­ **DÃ©connexion automatique**\n'
                  + `Le bot s'est dÃ©connectÃ© du stage **${voiceChannel.name}** car aucun utilisateur n'Ã©tait prÃ©sent.`
        });
      }
    } catch (error) {
      logger.error('Erreur lors du log de dÃ©connexion:', error);
    }
  }

  handleVoiceStateUpdate (oldState, newState) {
    if (oldState.channelId && this.connectedStages.has(oldState.guild.id)) {
      const stageInfo = this.connectedStages.get(oldState.guild.id);
      if (stageInfo.channelId === oldState.channelId) {
        setTimeout(() => {
          void this.checkStage(oldState.guild.id, stageInfo.channelId);
        }, 2000);
      }
    }

    if (newState.member.id === newState.client.user.id && newState.channelId) {
      const newChannel = newState.channel;
      if (newChannel && newChannel.type === 13) {
        logger.info(`ðŸŽ­ Bot a rejoint un stage: ${newChannel.name} (${newState.guild.id})`);
        this.registerStage(newState.guild.id, newState.channelId, newState.guild);
      }
    }
  }

  getStatus () {
    return {
      isMonitoring: this.isMonitoring,
      connectedStages: this.connectedStages.size,
      checkInterval: this.checkInterval
    };
  }
}

const stageMonitor = new StageMonitor();

export default stageMonitor;
