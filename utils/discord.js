import * as DiscordModule from 'discord.js';

const Discord = DiscordModule;
const readExport = (name) => (Reflect.has(DiscordModule, name) ? DiscordModule[name] : undefined);

export default Discord;

export const ActionRowBuilder = readExport('ActionRowBuilder');
export const ActivityType = readExport('ActivityType');
export const ButtonBuilder = readExport('ButtonBuilder');
export const ButtonStyle = readExport('ButtonStyle');
export const ChannelType = readExport('ChannelType');
export const Client = readExport('Client');
export const Collection = readExport('Collection');
export const CommandInteraction = readExport('CommandInteraction');
export const EmbedBuilder = readExport('EmbedBuilder');
export const Events = readExport('Events');
export const GatewayIntentBits = readExport('GatewayIntentBits');
export const MessageFlags = readExport('MessageFlags');
export const PermissionFlagsBits = readExport('PermissionFlagsBits');
export const REST = readExport('REST');
export const Routes = readExport('Routes');
export const SlashCommandBuilder = readExport('SlashCommandBuilder');
export const SlashCommandSubcommandBuilder = readExport('SlashCommandSubcommandBuilder');
export const WebhookClient = readExport('WebhookClient');
