// ========================================
// core/services/StageMonitor.js - Surveillance des stages pour déconnexion automatique + auto-promotion speaker
// ========================================

import { getVoiceConnection } from '@discordjs/voice';
import logger from '../../bot/logger.js';
import stageSpeakerManager from './StageSpeakerManager.js';  // ← AJOUT : Import du manager de promotion

class StageMonitor {
  constructor () {
    this.isMonitoring = false;
    this.checkInterval = 30000; // Vérification toutes les 30 secondes
    this.monitoringInterval = null;
    this.connectedStages = new Map(); // guildId -> { channelId, lastCheck }

    logger.info('StageMonitor initialisé');
  }

  /**
   * Démarrer la surveillance des stages
   */
  startMonitoring () {
    if (this.isMonitoring) {
      logger.warn('StageMonitor déjà en cours de surveillance');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAllStages();
    }, this.checkInterval);

    logger.info('Surveillance des stages démarrée');
  }

  /**
   * Arrêter la surveillance des stages
   */
  stopMonitoring () {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('🎭 Surveillance des stages arrêtée');
  }

  /**
   * Enregistrer un stage pour surveillance
   */
  registerStage (guildId, channelId) {
    this.connectedStages.set(guildId, {
      channelId,
      lastCheck: Date.now()
    });
    logger.info(`🎭 Stage enregistré pour surveillance: ${guildId} -> ${channelId}`);

    // ← AJOUT : Lancer l'auto-promotion immédiatement après l'enregistrement
    this.promoteBotInStage(guildId, channelId);
  }

  /**
   * Désenregistrer un stage de la surveillance
   */
  unregisterStage (guildId) {
    if (this.connectedStages.has(guildId)) {
      this.connectedStages.delete(guildId);
      logger.info(`🎭 Stage désenregistré de la surveillance: ${guildId}`);
    }
  }

  /**
   * Tenter de promouvoir le bot en speaker dans un stage (AJOUT)
   */
  async promoteBotInStage (guildId, channelId) {
    try {
      const connection = getVoiceConnection(guildId);
      if (!connection) {
        logger.warn(`🎤 Pas de connexion active pour promouvoir dans le stage ${channelId}`);
        return;
      }

      const channel = connection.joinConfig.guild.channels.cache.get(channelId);
      if (!channel) {
        logger.warn(`🎤 Canal introuvable pour promotion: ${channelId}`);
        return;
      }

      // Vérifier que c'est bien un stage channel (type 13 = GuildStageVoice)
      if (channel.type !== 13) {
        logger.debug(`🎤 Canal n'est pas un stage (type ${channel.type}), promotion ignorée`);
        return;
      }

      // Délai pour laisser Discord stabiliser l'état vocal (évite les erreurs prématurées)
      setTimeout(async () => {
        const result = await stageSpeakerManager.promoteToSpeaker(connection, channel);
        if (result.success) {
          logger.info(`🎤 Bot auto-promu en speaker dans ${channel.name}`);
        } else {
          logger.warn(`🎤 Échec auto-promotion dans ${channel.name}: ${result.message}`);
        }
      }, 3000); // 3 secondes – tu peux ajuster entre 2000 et 5000 si besoin

    } catch (error) {
      logger.error('🎤 Erreur lors de la tentative d\'auto-promotion:', error);
    }
  }

  /**
   * Vérifier tous les stages connectés
   */
  async checkAllStages () {
    if (this.connectedStages.size === 0) {
      return;
    }

    logger.debug(`🎭 Vérification de ${this.connectedStages.size} stage(s)`);

    for (const [guildId, stageInfo] of this.connectedStages) {
      try {
        await this.checkStage(guildId, stageInfo.channelId);
      } catch (error) {
        logger.error(`Erreur lors de la vérification du stage ${guildId}:`, error);
      }
    }
  }

  /**
   * Vérifier un stage spécifique
   */
  async checkStage (guildId, channelId) {
    try {
      const connection = getVoiceConnection(guildId);

      if (!connection) {
        // Le bot n'est plus connecté, nettoyer l'enregistrement
        this.unregisterStage(guildId);
        return;
      }

      // Récupérer le canal depuis la connexion
      const channel = connection.joinConfig.channelId;
      if (channel !== channelId) {
        logger.warn(`🎭 Canal de connexion différent: attendu ${channelId}, trouvé ${channel}`);
        return;
      }

      // Récupérer le guild et le canal
      const { guild } = connection.joinConfig;
      const voiceChannel = guild.channels.cache.get(channelId);

      if (!voiceChannel) {
        logger.warn(`🎭 Canal vocal introuvable: ${channelId}`);
        this.unregisterStage(guildId);
        return;
      }

      // Compter les membres dans le canal (excluant les bots)
      const humanMembers = voiceChannel.members.filter(member => !member.user.bot);
      const botMembers = voiceChannel.members.filter(member => member.user.bot);

      logger.debug(`🎭 Stage ${channelId}: ${humanMembers.size} humains, ${botMembers.size} bots`);

      // Si seulement des bots sont présents, déconnecter
      if (humanMembers.size === 0 && botMembers.size > 0) {
        logger.info(`🎭 Aucun humain dans le stage ${voiceChannel.name}, déconnexion du bot`);
        await this.disconnectFromStage(connection, guildId, voiceChannel);
      }
    } catch (error) {
      logger.error(`Erreur lors de la vérification du stage ${guildId}:`, error);
    }
  }

  /**
   * Déconnecter le bot d'un stage
   */
  async disconnectFromStage (connection, guildId, voiceChannel) {
    try {
      // Détruire la connexion
      connection.destroy();

      // Nettoyer l'enregistrement
      this.unregisterStage(guildId);

      logger.info(`🎭 Bot déconnecté du stage: ${voiceChannel.name} (${guildId})`);

      // Optionnel: envoyer un message dans un canal de log
      await this.logDisconnection(voiceChannel);
    } catch (error) {
      logger.error(`Erreur lors de la déconnexion du stage ${guildId}:`, error);
    }
  }

  /**
   * Logger la déconnexion (optionnel)
   */
  async logDisconnection (voiceChannel) {
    try {
      // Chercher un canal de log ou d'administration
      const { guild } = voiceChannel;
      const logChannel = guild.channels.cache.find(channel =>
        channel.name.includes('log')
        || channel.name.includes('admin')
        || channel.name.includes('bot'));

      if (logChannel && logChannel.permissionsFor(guild.members.me).has('SendMessages')) {
        await logChannel.send({
          content: '🎭 **Déconnexion automatique**\n'
                  + `Le bot s'est déconnecté du stage **${voiceChannel.name}** car aucun utilisateur n'était présent.`
        });
      }
    } catch (error) {
      logger.error('Erreur lors du log de déconnexion:', error);
    }
  }

  /**
   * Gérer les changements d'état vocal (événement Discord)
   */
  handleVoiceStateUpdate (oldState, newState) {  // ← Note : il faut passer oldState ET newState
    // Cas 1 : Quelqu'un quitte un stage surveillé → vérification immédiate
    if (oldState.channelId && this.connectedStages.has(oldState.guild.id)) {
      const stageInfo = this.connectedStages.get(oldState.guild.id);
      if (stageInfo.channelId === oldState.channelId) {
        setTimeout(() => {
          this.checkStage(oldState.guild.id, stageInfo.channelId);
        }, 2000);
      }
    }

    // ← AJOUT : Détecter quand LE BOT rejoint un stage channel
    if (newState.member.id === newState.client.user.id && newState.channelId) {
      const newChannel = newState.channel;
      if (newChannel && newChannel.type === 13) { // 13 = GuildStageVoice
        logger.info(`🎭 Bot a rejoint un stage: ${newChannel.name} (${newState.guild.id})`);
        this.registerStage(newState.guild.id, newState.channelId);
        // La promotion sera lancée automatiquement via registerStage → promoteBotInStage
      }
    }
  }

  /**
   * Obtenir le statut de surveillance
   */
  getStatus () {
    return {
      isMonitoring: this.isMonitoring,
      connectedStages: this.connectedStages.size,
      checkInterval: this.checkInterval
    };
  }
}

// Instance singleton
const stageMonitor = new StageMonitor();

export default stageMonitor;