# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/xiangbingxi/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/xiangbingxi/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Atlas — an offline web app: the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI. Static files, no build step, no network at run time.

## What it does

- **All 55 trophies** with their official name, description and grade (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden on PlayStation; 0 online), each with a guide written in our own words, steps, and the sources its facts come from.
- **Tracker**: tick trophies off; progress is saved in the browser (localStorage). Count trackers for the counted trophies (250 stunts, 42 shooting-range golds, 100 WAiNK scans, 18 meditations, …) that auto-mark a trophy earned when the target is reached.
- **Filters**: by kind (story, missable, collectibles, activities, side quests, crime, money, exploration, online), by grade, by earned / not-earned, plus full-text search.
- **Spoiler setting**: hides the names and descriptions of the story trophies until they are earned (on by default).
- **Roadmap to the platinum**: three phases (~200 hours, difficulty 4/10 per PowerPyx), the 100% checklist, and every warning that matters — the one possibly missable trophy (Positive Mental Attitude), no mission replay, cheats disabling trophies, character-locked strands.
- **Export / import** progress as a JSON file; reset button.

## Run it

```sh
node serve.ts        # serves app/ on http://localhost:8080
```

or serve `app/` with any static file server and open `index.html`. It works with the network off: the only requests it makes are for its own two data files, `app/data/trophies.json` and `app/data/guide.json`.

## Data honesty

Names, descriptions and grades come from the official PS5 list as published by PSNProfiles and Exophase, cross-checked against PowerPyx, GamesRadar+, GameMapa, GTADB and games.gg (checked 2026-11-20). Rockstar and Sony had not published the list officially at that date. Five trophies (*In The Beginning…*, *Capital Offense*, *Bad Luck, I Guess*, *The Truth Is Out There*, *Ten Pin*) have no verified unlock method yet — their entries admit that instead of guessing. *Fair Game*'s exact animal is still being confirmed. Sources are listed in the app footer and beside each trophy's guide.

## Entry

Built for the make.fun bounty [gta6-trophy-guide-01](https://make.fun/bounty/gta6-trophy-guide-01). `main.ts` hands the entry in (copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library).

## License

MIT — see `LICENSE`. Unofficial fan guide; not affiliated with Rockstar Games, Sony or PlayStation. No official artwork or logos are used.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
