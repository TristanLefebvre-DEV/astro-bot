import { ChannelType, type Client, type TextChannel } from "discord.js";
import type { Model } from "mongoose";
import { Announcement, Giveaway, TempBan } from "../../database/models/index.js";
import { embeds } from "../../utils/embeds.js";
import { logger } from "../../utils/logger.js";

let interval: NodeJS.Timeout | null = null;

async function processTempBans(client: Client): Promise<void> {
  const expired = await (TempBan as Model<any>)
    .find({ active: true, expiresAt: { $lte: new Date() } })
    .limit(25);

  for (const tempBan of expired) {
    const guild = client.guilds.cache.get(tempBan.guildId);
    if (!guild) continue;

    await guild.members.unban(tempBan.userId, "Tempban expiré").catch(() => undefined);
    tempBan.active = false;
    await tempBan.save();
    logger.info(`Tempban expiré: ${tempBan.guildId}/${tempBan.userId}`);
  }
}

async function processGiveaways(client: Client): Promise<void> {
  const ended = await (Giveaway as Model<any>)
    .find({ ended: false, endsAt: { $lte: new Date() } })
    .limit(25);

  for (const giveaway of ended) {
    const guild = client.guilds.cache.get(giveaway.guildId);
    const channel = guild?.channels.cache.get(giveaway.channelId);
    if (!guild || !channel || channel.type !== ChannelType.GuildText) continue;

    const participants = [...new Set((giveaway.participants ?? []) as string[])];
    const winnersCount = Math.max(1, Number(giveaway.winners ?? 1));
    const shuffled = participants.sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, winnersCount);

    giveaway.ended = true;
    giveaway.winnerIds = winners;
    await giveaway.save();

    await (channel as TextChannel).send({
      embeds: [
        embeds.success({
          title: "Giveaway terminé",
          description: [
            `Prix: **${giveaway.prize}**`,
            winners.length ? `Gagnant(s): ${winners.map((id) => `<@${id}>`).join(", ")}` : "Aucun participant valide."
          ].join("\n"),
          guild
        })
      ]
    });
  }
}

async function processAnnouncements(client: Client): Promise<void> {
  const due = await (Announcement as Model<any>)
    .find({ sent: false, scheduledAt: { $lte: new Date() } })
    .limit(25);

  for (const announcement of due) {
    const guild = client.guilds.cache.get(announcement.guildId);
    const channel = guild?.channels.cache.get(announcement.channelId);
    if (!guild || !channel || channel.type !== ChannelType.GuildText) continue;

    await (channel as TextChannel).send({
      content: announcement.mentionRoleId ? `<@&${announcement.mentionRoleId}>` : undefined,
      embeds: [
        embeds.info({
          title: announcement.title,
          description: announcement.description ?? "Annonce",
          guild
        })
      ],
      allowedMentions: { roles: announcement.mentionRoleId ? [announcement.mentionRoleId] : [] }
    });

    announcement.sent = true;
    announcement.sentAt = new Date();
    await announcement.save();
  }
}

export function startSchedulers(client: Client): void {
  if (interval) return;

  interval = setInterval(() => {
    void Promise.all([
      processTempBans(client),
      processGiveaways(client),
      processAnnouncements(client)
    ]).catch((error) => logger.error("Erreur scheduler", error));
  }, 30_000);

  interval.unref();
  logger.info("Schedulers persistants démarrés");
}

export function stopSchedulers(): void {
  if (interval) clearInterval(interval);
  interval = null;
}
