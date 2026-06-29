# Commandes

Cette liste regroupe la surface slash command disponible. Les commandes critiques déjà reliées à une logique métier réelle incluent modération, cases, tickets, panels, config, sécurité de base et informations.

Les modules très avancés exposent déjà leurs sous-commandes, permissions, cooldowns, confirmations et réponses embeds. Leur logique métier peut ensuite être enrichie module par module sans changer l'API Discord.

## Aide

- `/help` [base]
- `/help command`
- `/help category`
- `/help search`

## Owner / Debug

- `/bot status` [base]
- `/bot pingdb` [base]
- `/bot maintenance`
- `/bot reload`
- `/bot debug`
- `/bot guilds`
- `/bot stats`

## Configuration

- `/config view`
- `/config reset`
- `/config logs`
- `/config moderation`
- `/config tickets`
- `/config antiraid`
- `/config antinuke`
- `/config welcome`
- `/config verification`
- `/config giveaways`
- `/config tempvoice`
- `/config roles`
- `/config phishing`
- `/config scam`
- `/config backup`
- `/config maintenance`
- `/config help`
- `/language set`
- `/timezone set`
- `/modrole add`
- `/modrole remove`
- `/ignoredchannels add`
- `/ignoredchannels remove`
- `/ignoredroles add`
- `/ignoredroles remove`
- `/bypass add`
- `/bypass remove`

## Moderation

- `/mod ban/kick/timeout/untimeout/warn/warnings/history`
- `/purge messages/user/bots/links/invites/embeds/attachments/after/before/between/reactions/emojis/caps/duplicates`
- `/channel slowmode/slowmodeoff/lock/unlock/lockdown/unlockdown/hide/unhide/nuke/clone/archive/close/reopen`
- `/voice mute/unmute/deafen/undeafen/disconnect/move`
- `/role add/remove/nickname/resetnick/autorole/autoroleoff/massadd/massremove`
- `/restriction nolinks/noimages/noattachments/nomedia/nomentionrole/nochannels/onlyread/newbieonly/linkprobation/messageapprove/list/remove`

## Nettoyage

- `/purge`, `/purge user`, `/purge bots`, `/purge links`, `/purge invites`
- `/purge embeds`, `/purge attachments`
- `/clear`, `/clear after`, `/clear before`, `/clear between`
- `/clear reactions`, `/clear emojis`, `/clear caps`, `/clear duplicates`

## Serveur, sécurité et modules

- tickets : `/ticket setup/open/close/claim/unclaim/add/remove/rename/transcript/panel`
- anti-raid : `/antiraid enable/disable/config/status/whitelist/panic/unpanic`
- anti-nuke : `/antinuke on/off/config`, `/maxbans`, `/maxkicks`, `/maxchannels`, `/maxroles`
- sécurité : `/security status/scan/score`, `/dangerroles`, `/adminlist`, `/botlist`
- phishing/scam : `/phishing`, `/scamcheck`, `/linkscan`, `/domainblock`, `/invitecheck`
- automod : `/automod`, `/filter`, `/badwords`, `/regex`, `/antilink`, `/antispam`
- verification : `/verification`, `/verify`, `/unverify`
- roles : `/roles panel`, `/roles add`, `/roles remove`, `/roles config`
- welcome/leave : `/welcome`, `/leave`
- giveaways : `/giveaway start/end/reroll/cancel/list/config`
- stats : `/stats setup/refresh/config/disable`
- backup : `/backup create/load/list/delete/info/export`
- tempvoice : `/tempvoice setup/config/rename/limit/lock/permit/transfer`
- serverbuilder : `/serverbuilder load/preview/export/template/validate`
- logs : `/logs setup/config/enable/disable`
- maintenance : `/maintenance enable/disable/status/config/message`
- annonces : `/announce create/embed/preview/send/schedule/edit/delete/list/config`
- evidence/incidents : `/evidence`, `/transcript`, `/incident`, `/timeline`
- staff audit : `/staffaudit`, `/staffrisk`, `/staffactions`, `/twomanrule`
- risk/toxicity/privacy : `/risk`, `/trustscore`, `/toxicity`, `/doxfilter`, `/redact`

Commandes groupées ajoutées :

- `/antinuke on/off/config/maxbans/maxkicks/maxchannels/maxroles/restoreperms/whitelistadd/whitelistremove/status`
- `/antiraid enable/disable/config/status/whitelistadd/whitelistremove/panic/unpanic/raidmode`
- `/automod status/wordadd/wordremove/wordslist/spam/links/invites/caps/emoji/mentions/punish/threshold/exemptrole/exemptchannel/regexadd/regexremove/regexlist/allowlink/antibot/on/off`
- `/phishing enable/disable/config/test/scamcheck/linkscan/domainadd/domainremove/domainlist/invitecheck/antiwebhook/webhooklist/deletewebhook/logs`
- `/scam check/wordsadd/wordsremove/wordslist/massdel/dmraid/marketban/uhqon/uhqoff/uhqadd/uhqremove/accountscan/accountpurge/credentialon/credentialoff/leakreport/leakpurge/blackmarketscan`
- `/verification setup/enable/disable/panel/roleset/logs/config/verify/unverify`
- `/roles panelcreate/paneledit/paneldelete/panelsend/add/remove/config/exclusive/stackable`
- `/welcome enable/disable/channel/message/embed/test/leaveenable/leavedisable/leavemessage/autorole`
- `/giveaway start/end/reroll/cancel/list/config`
- `/stats setup/refresh/config/disable`
- `/backup create/load/list/delete/info/export`
- `/tempvoice setup/disable/config/rename/limit/lock/unlock/permit/reject/transfer/claim`
- `/serverbuilder load/preview/export/template/validate`
- `/logs setup/config/enable/disable/messages/members/voice/roles/channels/security`
- `/maintenance enable/disable/status/config/message/whitelistadd/whitelistremove/roleadd/roleremove/forcedisable`
- `/roleprotect enable/disable/add/remove/list/config/whitelistadd/whitelistremove/rollback`
- `/announce create/embed/preview/send/schedule/edit/delete/list/config/message`
- `/evidence save/user/export/transcriptchannel/transcriptuser/incidentcreate/incidentadd/incidentclose/incidentreport/chain/timeline/whointeracted/modbrief/heatmap`
- `/staff audit/risk/actions/abusereport/cooldown/suspend/restore/twomanon/twomanoff/approveban/denyban/lock/verify/notes/permissiondiff/poll/chat/alert/modmailreply/anonymousreport/suggestapprove/suggestdeny/rulessend/rulesupdate`
- `/risk trustscore/score/list/config/activity/joinedrecently/inactive/lurkers/suspiciousnames/duplicates/avatarcheck/namehistory/joinposition/accountage/serverage/firstmessage/lastmessages/deletedmessages/nameflags/avatarflags/altsuspect/similarusers/freshaccounts`
- `/toxicity user/scan/insulton/insultoff/sluron/sluroff/harassment/targetprotect/dogpiledetect/dogpilestop/cooldown/shadowflag/modwatch/watchlist/watchremove/ragebait/conflict`
- `/privacy doxon/doxoff/doxtest/doxpurge/doxcase/lock/redact/sensitivescan/sensitivereport/victimprotect/nomention`
- `/media scanon/scanoff/fileblock/fileunblock/filelist/attachmentrisk/quarantineon/quarantineoff/nsfwon/nsfwoff/goreon/goreoff/report/hashadd/hashremove/hashlist/reviewqueue`
