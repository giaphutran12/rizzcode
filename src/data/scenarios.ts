/**
 * RizzCode scenario catalog.
 *
 * Ten playable scenarios (five Spark, five Connection) following
 * docs/RIZZCODE_MASTER_PLAN.md exactly. The fallback graphs are the authored
 * deterministic persona content consumed by the shared conversation engine.
 * Signal phrases are matched as normalized lowercase whole words or phrases,
 * so write them exactly as they would appear in casual text.
 */

import type { Scenario } from "../domain/types";

export const scenarios: Scenario[] = [
  // 1 — Spark / In Person / Easy
  {
    id: "spark-bus-stop-opener",
    module: "spark",
    mode: "in_person",
    difficulty: "easy",
    title: "Bus-Stop Situational Opener",
    setting: "Bus stop on Grand Ave, 5:40 PM, first drizzle of the evening",
    premise:
      "You are waiting for the 18. A woman your age is under the same shelter — no headphones, not rushing — and she just laughed at the sky like it personally betrayed her. You have never met.",
    objective: "Begin naturally from observable context.",
    visibleContext: [
      "She is waiting under the same shelter with no headphones on.",
      "The display says the 18 is delayed by 12 minutes.",
      "A library book sticks out of her tote bag.",
      "She laughed at the sky when the rain started a moment ago.",
    ],
    boundaries: [
      "Use only what you can actually see from the shelter.",
      "Keep it short and speakable — you are talking, not texting.",
      "No comments about her body or looks.",
      "If her answers go short and closed, wind down politely.",
    ],
    skills: [
      "Situational awareness",
      "In-person openers",
      "Humor and playful observations",
      "Confidence under uncertainty",
    ],
    opening: { kind: "scene_only" },
    persona: {
      name: "Maya Reyes",
      traits: [
        "dry-witted",
        "observant",
        "a little guarded with strangers",
        "sucker for a well-timed joke",
      ],
      currentGoal:
        "Get home in time for dinner with her sister; open to a decent conversation if the bus stays delayed.",
      constraints: [
        "Never hands out her number to a stranger who has not made her laugh or think",
        "Exits politely if she feels interviewed or hit on",
        "Does not fake interest she does not feel",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "Opens with something she can actually see or hear",
      "Keeps it brief, warm, and speakable",
      "Builds on her answer instead of changing the subject",
      "Makes a light joke about the shared situation",
      "Leaves her an easy way to end the chat",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "contact_exchanged",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "haha",
        "that's funny",
        "the 18",
        "delayed",
        "rain",
        "library book",
        "what are you reading",
        "i noticed",
        "no headphones",
        "what do you think",
        "guilty",
        "fair enough",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "your place or mine",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "nice meeting you",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed:
            "Oh — thanks, but I'm kind of in my own head today. Have a good one.",
          low: "…Hey.",
          neutral:
            "Ha, yeah, the 18 has a personal grudge against me. You ride it often?",
          warm: "Okay, that got an actual laugh. Points. I was just politely telling the sky off.",
        },
        2: {
          closed:
            "Look, you seem nice, but I'm going to keep to myself. No hard feelings.",
          low: "Sure, I guess.",
          neutral:
            "It's a library book — due Friday, which is the only reason it's finally getting read. You a reader or just a bus-shelter critic?",
          warm: "Ha! Careful, I judge people by their bus-stop etiquette, and so far you're passing. That's rare.",
        },
        3: {
          closed: "Anyway — that's my cue to drift. Take care, really.",
          low: "Well. Good luck with the bus. It'll come eventually. Probably.",
          neutral:
            "Well, mystery bus guy, this was less painful than the delay. Enjoy your evening.",
          warm: "Honestly? Best delayed-bus conversation I've ever had, and I ride the 18 a lot. If you wanted to continue it sometime, I'd be open to being convinced.",
        },
      },
    },
  },

  // 2 — Spark / In Person / Easy
  {
    id: "spark-open-source-intro",
    module: "spark",
    mode: "in_person",
    difficulty: "easy",
    title: "Open-Source Social Introduction",
    setting: "Community demo night at a quiet café on Domingo Ave, 7:15 PM",
    premise:
      "It's the open-source social night at a café that's half demo tables, half readers. She just finished showing a small project at the corner table, and there's a worn Vietnamese novel next to her laptop. You've never talked to her.",
    objective: "Open and find one shared thread.",
    visibleContext: [
      "She just wrapped a demo of a small open-source project at the corner table.",
      "A worn copy of 'The Sorrow of War' by Bao Ninh sits next to her laptop.",
      "Her laptop lid is covered in framework stickers, plus one that says 'it works on my machine'.",
      "The café is quiet — half social night, half people reading.",
    ],
    boundaries: [
      "Do not fake having read the book — she will check.",
      "Ask about her project only if you actually listen to the answer.",
      "No pitching, no interviewing, no tech-bro monologue.",
      "If she signals she's done, thank her and step off cleanly.",
    ],
    skills: [
      "Situational awareness",
      "In-person openers",
      "Humor and playful observations",
      "Banter",
      "Confidence under uncertainty",
    ],
    opening: { kind: "scene_only" },
    persona: {
      name: "Linh Tran",
      traits: [
        "sharp",
        "quietly funny",
        "proud of her project",
        "deep into Vietnamese literature",
        "allergic to tech-bro energy",
      ],
      currentGoal:
        "Pack up her demo, drink her cà phê sữa đá in peace, and maybe meet one person who isn't pitching a startup.",
      constraints: [
        "Talks happily about her project, but not to someone who clearly didn't listen",
        "Politely dismantles people who fake having read the book",
        "Leaves if the conversation turns into an interview or a pitch",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "Opens from the demo, the book, or the room — something real",
      "Shows honest curiosity without faking expertise",
      "Shares one true thing about himself",
      "Finds one shared thread and follows it",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "contact_exchanged",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "haha",
        "your demo",
        "the demo",
        "sorrow of war",
        "your project",
        "open source",
        "i noticed",
        "tell me about",
        "what do you think",
        "it works on my machine",
        "honestly",
        "that sticker",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "your place or mine",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "nice meeting you",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed:
            "Appreciate it, but I'm actually wrapping up for the night. Enjoy the social.",
          low: "…Hi. Can I help you with something?",
          neutral:
            "Hey — yeah, that was my chaotic little demo. You here for the social or just the caffeine?",
          warm: "Ha! An honest review, I like that. Most people just nod and ask about my stack.",
        },
        2: {
          closed:
            "I'm going to grab my coffee and decompress. No offense — nice meeting you.",
          low: "Mm. Cool.",
          neutral:
            "It's my second time through that one, actually — I reread it every few years. Have you read it, or are you just a cover guy?",
          warm: "Okay wait, that's a genuinely good observation. You may stay — metaphorically. The chair is taken by my laptop bag.",
        },
        3: {
          closed: "Anyway, I'm off to find my caffeine and my quiet. Take care.",
          low: "Well — enjoy the rest of the night.",
          neutral:
            "Well, not the worst interruption I've had at a demo table. Have a good night, okay?",
          warm: "This was the best conversation of the night and I came here to talk about my own project, so that's saying something. I'd genuinely be up for continuing it sometime.",
        },
      },
    },
  },

  // 3 — Spark / In Person / Medium
  {
    id: "spark-cafe-opener",
    module: "spark",
    mode: "in_person",
    difficulty: "medium",
    title: "Library or Café Opener",
    setting: "Neighborhood café on Elm Street, 2:30 PM, laptop crowd",
    premise:
      "She has been locked into her laptop at the corner table for a while — two empty cups deep, notebook full of crossed-out lines. One earcup of her headphones is slipped off, and she did smile at the barista's terrible playlist a minute ago.",
    objective: "Respect focus while testing openness.",
    visibleContext: [
      "She is typing intently, headphones on with one earcup slipped off.",
      "Her notebook has half a page of crossed-out lines.",
      "Two empty cups sit on her table — she has been here a while.",
      "She smiled at the barista's terrible playlist a minute ago.",
    ],
    boundaries: [
      "Acknowledge that she is busy — keep the interruption to a moment.",
      "Give her an easy out and take it if she uses it.",
      "No hovering after a closed answer.",
      "No compliments about her looks as the opener.",
    ],
    skills: [
      "Situational awareness",
      "In-person openers",
      "Humor and playful observations",
      "Confidence under uncertainty",
      "Recognizing low interest",
    ],
    opening: { kind: "scene_only" },
    persona: {
      name: "June Okafor",
      traits: [
        "focused",
        "wry",
        "deadline-driven",
        "secretly appreciates a well-timed interruption",
      ],
      currentGoal:
        "Finish a grant application draft by 4 PM; she will allow exactly one charming interruption.",
      constraints: [
        "Will not hold a long conversation before the draft is done",
        "Warms to people who respect her time",
        "Goes quiet fast if she feels cornered or complimented weirdly",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "Acknowledges her focus before anything else",
      "Keeps the opener to one short beat",
      "Offers a genuine observation or a fitting joke",
      "Leaves a clean exit and respects whichever she picks",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "contact_exchanged",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "don't want to interrupt",
        "i'll be quick",
        "quick question",
        "deadline",
        "crossed out",
        "playlist",
        "i noticed",
        "good luck with",
        "haha",
        "one minute",
        "i'll let you get back",
        "coffee",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "your place or mine",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "enjoy your coffee",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed:
            "Hey — I'm on a deadline, so I'm keeping my head down. Good luck out there, though.",
          low: "Mm. Hey.",
          neutral:
            "Ha — make it quick, this grant application is currently losing a fight and I need to go win it.",
          warm: "Okay, that's funny. You have exactly one coffee-sip of my attention — the playlist earned you the rest.",
        },
        2: {
          closed:
            "I really do have to finish this. Nothing personal — genuinely, good luck.",
          low: "Right. Well.",
          neutral:
            "The crossed-out lines? Third attempt at a budget narrative. You've got one distracting sentence left in you — use it wisely.",
          warm: "Ha! See, this is a problem now, because you're actually good at this and my deadline is extremely real.",
        },
        3: {
          closed: "Alright — back to the mines for me. Take care.",
          low: "Anyway. Enjoy your afternoon.",
          neutral:
            "Okay, that was a pleasant ninety seconds. Now I owe this draft some violence. Good luck today.",
          warm: "Tell you what — this draft is due at four and you are officially the best interruption of my week. If you asked for a way to continue this later, I would not be mad about it.",
        },
      },
    },
  },

  // 4 — Spark / In Person / Medium
  {
    id: "spark-friend-group-entry",
    module: "spark",
    mode: "in_person",
    difficulty: "medium",
    title: "Join a Friend-Group Conversation",
    setting: "Friend's rooftop birthday hangout, 8:10 PM, string lights and a cooler",
    premise:
      "A circle of four is mid-laugh at a story involving a kayak and a goose, and she is the one telling it — hands fully involved. You know the birthday host, not this group. There's an open spot at the edge of the circle.",
    objective: "Enter without hijacking the group.",
    visibleContext: [
      "A group of four is laughing at a story involving a kayak and a goose.",
      "She is the one telling the story, mid-saga, hands fully involved.",
      "There is an open spot at the edge of the circle near the cooler.",
      "You know the birthday host; you have never met this group.",
    ],
    boundaries: [
      "Let her finish the story — do not talk over the punchline.",
      "No one-upping with a better story.",
      "Do not try to split her away from her friends immediately.",
      "Keep jokes kind — the group, the host, and the goose are off-limits as targets.",
    ],
    skills: [
      "Situational awareness",
      "In-person openers",
      "Banter",
      "Humor and playful observations",
      "Confidence under uncertainty",
    ],
    opening: { kind: "scene_only" },
    persona: {
      name: "Priya Raman",
      traits: [
        "animated storyteller",
        "inclusive but protective of the group's rhythm",
        "teases newcomers she likes",
        "laughs first",
      ],
      currentGoal:
        "Finish the goose saga and keep the circle's energy up; new people are welcome if they add instead of grab.",
      constraints: [
        "Defends the group's rhythm — hijackers get gently exiled",
        "Warms fast to people who laugh with the story, not at themselves performing",
        "Cools off if someone one-ups or makes it about them",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "Enters on the group's topic instead of a new one",
      "Laughs along before contributing",
      "Adds to the bit rather than changing it",
      "Addresses the circle, not just her",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "contact_exchanged",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "haha",
        "the goose",
        "kayak",
        "don't let me interrupt",
        "finish the story",
        "what happened next",
        "goose wins",
        "i'm with the host",
        "fair enough",
        "what do you think",
        "no way",
        "the cooler",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "your friends are boring",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "nice meeting you",
        "enjoy the party",
      ],
      repliesByTurn: {
        1: {
          closed:
            "Ha — anyway. As I was saying, the goose had a plan. (She turns back to her friends.)",
          low: "…Hi. You're with the host?",
          neutral:
            "Ha! Right?? Okay, you may stay for the ending — the goose WINS, that's all I'm saying.",
          warm: "Oh I like that. New person gets it. Everyone else here took the goose's side, which tells you everything about my friends.",
        },
        2: {
          closed:
            "Okay, cool — we're keeping the goose saga in the family. Enjoy the party though.",
          low: "Ha. Yeah, anyway—",
          neutral:
            "Wait, actually — what would YOU have done? Goose at your cooler, no witnesses. Be honest.",
          warm: "Stop, that's the funniest thing said all night and I'M the one telling the story. Okay, you're in. What's your name, goose diplomat?",
        },
        3: {
          closed:
            "Anyway, good meeting you — I'm refilling and rejoining my people.",
          low: "Ha, well. Enjoy the party.",
          neutral:
            "Not bad, new person. The circle accepts you — provisionally. I'm Priya, by the way.",
          warm: "Final ruling: best addition to this circle since the string lights. I'm Priya — and if you're still here after cake, you owe me YOUR version of the goose story.",
        },
      },
    },
  },

  // 5 — Spark / Messaging / Medium
  {
    id: "spark-text-after-meeting",
    module: "spark",
    mode: "messaging",
    difficulty: "medium",
    title: "Text After Meeting",
    setting: "Your couch, next morning, 10:15 AM — she has already replied",
    premise:
      "You met Hana at a friend's chaotic project demo night yesterday and got her number. Your 'great meeting you' text got a real reply this morning. The thread is open — now it needs a pulse.",
    objective: "Reopen the shared moment with personality.",
    visibleContext: [
      "Her reply references the chaotic demo you both watched yesterday.",
      "You two joked in person about the presenter's laptop dying mid-sentence.",
      "She replied within a day and used the words 'kind of loved'.",
      "You already have her number — the thread is open.",
    ],
    boundaries: [
      "Do not interview her — one question per text, maximum.",
      "No paragraph of compliments about yesterday.",
      "Do not push for a meetup in the first text back.",
      "Match her playful tone instead of going formal.",
    ],
    skills: [
      "Interesting texting",
      "Humor and playful observations",
      "Banter",
      "Confidence under uncertainty",
    ],
    opening: {
      kind: "persona_message",
      body: "That demo was chaotic, but I kind of loved it.",
    },
    persona: {
      name: "Hana Vu",
      traits: [
        "dry texter",
        "meme-literate",
        "genuinely funny once comfortable",
        "hates small talk",
      ],
      currentGoal:
        "Find out whether last night's funny guy texts like a human or like a LinkedIn message.",
      constraints: [
        "Does not carry dead conversations",
        "Warms up to specificity — real details from the night, not 'how's your day'",
        "Goes dry if he interviews her or love-bombs",
      ],
      initialState: { engagement: "warm", boundary: "none", terminal: false },
    },
    successSignals: [
      "References a specific shared moment from last night",
      "Sounds like a person, not a follow-up email",
      "Gives her something easy and fun to respond to",
      "Matches her energy without over-asking",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "date_invited",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "haha",
        "the demo",
        "chaotic",
        "laptop dying",
        "smoke machine",
        "rent free",
        "kind of loved",
        "favorite disaster",
        "i kind of loved it too",
        "what was your",
        "you had to be there",
        "the presenter",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "answer me",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "talk later",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed: "ha anyway, busy day — take care!",
          low: "lol yeah it was something",
          neutral:
            "right?? the smoke machine alone deserved its own ticket. what was your favorite disaster",
          warm: "okay see, you text like you talk. refreshing. the laptop dying mid-sentence now lives in my head rent free",
        },
        2: {
          closed: "alright i'm disappearing into my day — was nice meeting you tho!",
          low: "haha nice",
          neutral:
            "lmao stop. okay, honest ruling: planned chaos or genuine disaster? pick a side",
          warm: "HAHA okay you're worse than the demo and i mean that as a compliment. keep going, i'm invested",
        },
        3: {
          closed: "anyway! nice meeting you yesterday, have a good one",
          low: "lol welp. talk later maybe",
          neutral:
            "ok solid re-open of the thread. 10/10 would text again. have a good day, demo survivor",
          warm: "okay you officially passed the vibe check. i'm around this week if you want to continue this over something caffeinated. think about it",
        },
      },
    },
  },

  // 6 — Connection / Messaging / Easy
  {
    id: "connection-keep-thread-interesting",
    module: "connection",
    mode: "messaging",
    difficulty: "easy",
    title: "Keep the Thread Interesting",
    setting: "Ongoing text thread, Tuesday 6:40 PM",
    premise:
      "You have been texting Sloane for a few days and it is going fine — but 'fine' is exactly where threads go to die. She just sent you a story and a question. The ball is very much in your court.",
    objective: "Balance curiosity and contribution.",
    visibleContext: [
      "She shared a specific story about her roommate's cat sitting in plant dirt.",
      "She asked how your day was.",
      "The thread has run for a few days with easy back-and-forth.",
      "She texts in quick, casual lowercase messages.",
    ],
    boundaries: [
      "Answer her question AND give something back — no one-word replies.",
      "Do not rapid-fire questions like a survey.",
      "Keep it light — this is not the moment for a life confession.",
    ],
    skills: [
      "Listening",
      "Reciprocity",
      "Follow-up questions",
      "Contributing personal stories",
    ],
    opening: {
      kind: "persona_message",
      body: "my roommate's cat knocked my plant off the windowsill and then sat in the dirt like she pays rent. anyway how was your day",
    },
    persona: {
      name: "Sloane Park",
      traits: [
        "chatty",
        "pun-friendly",
        "shares little stories",
        "notices effort immediately",
      ],
      currentGoal:
        "Have one conversation today that is not about work, and decide if he is actually fun or just polite.",
      constraints: [
        "Matches effort — one-word answers get one-word answers",
        "Loves a dumb little story from his day",
        "Dries up under interrogation mode",
      ],
      initialState: { engagement: "warm", boundary: "none", terminal: false },
    },
    successSignals: [
      "Answers with a real detail or story, not a summary",
      "Builds on the cat bit",
      "Asks something specific instead of 'you?'",
      "Keeps her quick, playful rhythm",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "haha",
        "lol",
        "the cat",
        "pays rent",
        "plant",
        "my day",
        "guess what",
        "what about you",
        "story",
        "honestly",
        "deserved",
        "landlord",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "nothing much",
        "you?",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "send pics",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "talk later",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed: "anyway gotta finish dinner — talk later!",
          low: "lol nice. anyway",
          neutral:
            "okay decent answer. but i'm still thinking about the cat in the dirt. she looked PROUD. what would you have named the plant",
          warm: "HAHA okay that's a real story, i respect it. the cat's name is mochi and she has never paid a cent of rent in her life",
        },
        2: {
          closed: "alright i'm tapping out for the night — have a good one!",
          low: "haha fair",
          neutral:
            "lmao. real question: are you always this easy to text or am i catching you on a good day",
          warm: "i just laughed out loud on the train and a man looked at me. this is your fault. what else you got",
        },
        3: {
          closed: "okay for real this time, night! was good chatting",
          low: "lol welp, night i guess",
          neutral:
            "solid thread today. you're getting the hang of the lore. talk tomorrow?",
          warm: "okay you win texting today. i have to go make dinner but i'm stealing that joke, and i'm telling mochi you said hi",
        },
      },
    },
  },

  // 7 — Connection / Messaging / Medium
  {
    id: "connection-playful-callback",
    module: "connection",
    mode: "messaging",
    difficulty: "medium",
    title: "Use a Playful Callback",
    setting: "Text thread, Thursday 9:05 PM, two days after the farmers market debate",
    premise:
      "At the farmers market you and Bea had a running bit: she fiercely defended pineapple on pizza, you called it 'a crime with good PR'. She just texted you an update. This is callback territory — if you can do it without beating the joke to death.",
    objective: "Create warmth without forcing a joke.",
    visibleContext: [
      "You two have an ongoing pineapple-on-pizza bit from the farmers market.",
      "You called pineapple pizza 'a crime with good PR' — she has quoted it twice.",
      "Her new text says the market guy gave her a free peach for her 'strong opinions'.",
      "The thread is playful but she goes dry when jokes feel forced.",
    ],
    boundaries: [
      "One callback, well-placed — do not explain your own joke.",
      "Twist the bit somewhere new instead of repeating it flat.",
      "Keep the teasing kind — the bit is the target, not her.",
    ],
    skills: [
      "Playful callbacks",
      "Remembering details",
      "Banter",
      "Contributing personal stories",
    ],
    opening: {
      kind: "persona_message",
      body: "update: the farmers market guy remembered me. gave me a free peach and said i have 'strong opinions'. he's not wrong",
    },
    persona: {
      name: "Bea Kowalski",
      traits: [
        "playful debater",
        "commits fully to a bit",
        "secretly sentimental",
        "hates try-hard humor",
      ],
      currentGoal:
        "See if he can play with the pineapple bit naturally instead of beating it to death.",
      constraints: [
        "A forced callback gets a pity laugh at best",
        "Loves a callback that twists the bit in a new direction",
        "Dries up the moment a joke gets explained",
      ],
      initialState: { engagement: "neutral", boundary: "none", terminal: false },
    },
    successSignals: [
      "Callbacks to the pineapple or peach bit with a new twist",
      "Keeps it short and confident",
      "Leaves her an easy volley back",
      "Does not over-milk the joke",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "date_invited",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "pineapple",
        "peach",
        "strong opinions",
        "good pr",
        "market guy",
        "callback",
        "haha",
        "lol",
        "i stand by",
        "still defending",
        "free peach",
        "stone fruit",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "lol ok",
        "haha yeah",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "send pics",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "talk later",
        "gotta run",
      ],
      repliesByTurn: {
        1: {
          closed: "lol ok. anyway i'm heading to bed soon — night!",
          low: "lol. anyway the peach was elite",
          neutral:
            "lmao okay, decent. the pineapple bit appreciates the effort. for the record the peach guy feared me, and honestly? fair",
          warm: "STOP. that was the correct use of the callback. the committee (me) approves. the peach was incredible btw",
        },
        2: {
          closed: "haha alright, i'm actually crashing — night!",
          low: "ha. sure",
          neutral:
            "you're at like a 7 on the callback scale. careful — i can smell effort from here",
          warm: "i can't believe you just one-upped my own bit. this is hostile. i'm telling the peach guy about you",
        },
        3: {
          closed: "ok for real, night! dream of stone fruit",
          low: "lol night i guess",
          neutral:
            "solid bit work tonight. the pineapple defense fund thanks you for your service. night, menace",
          warm: "okay you're officially funnier than my group chat and that is NOT easy. also the peach guy has a pizza hookup. so. choose your next move wisely",
        },
      },
    },
  },

  // 8 — Connection / Messaging / Medium
  {
    id: "connection-suggest-first-date",
    module: "connection",
    mode: "messaging",
    difficulty: "medium",
    title: "Suggest a First Date",
    setting: "Text thread, Friday 11:20 AM — two weeks of good conversation",
    premise:
      "You and Margot have had two weeks of genuinely good banter. She reads at a tiny bookstore café on Fifth most Saturdays, and she just handed you a very obvious opening. Time to make a plan, not a vibe.",
    objective: "Make a clear, low-pressure invitation.",
    visibleContext: [
      "Two weeks of daily banter — she replies fast and teases you often.",
      "She just told you the bookstore café on Fifth has a new cardamom bun.",
      "She said she has no one to split it with this weekend.",
      "You know she reads there most Saturdays.",
    ],
    boundaries: [
      "Be specific — a place and a day, not 'we should hang sometime'.",
      "Keep the out easy; no cornering.",
      "One clean ask — do not hedge it into mush.",
      "Accept her answer, whatever it is.",
    ],
    skills: [
      "Planning a date",
      "Expressing interest honestly",
      "Remembering details",
      "Reciprocity",
    ],
    opening: {
      kind: "persona_message",
      body: "ok i need a ruling: the bookstore café on fifth has a new cardamom bun and i have no one to split it with this weekend. tragic, i know",
    },
    persona: {
      name: "Margot Ellison",
      traits: [
        "direct",
        "warm",
        "dry humor",
        "appreciates clarity over games",
      ],
      currentGoal:
        "Find out if he will actually make a plan or keep her in banter purgatory forever.",
      constraints: [
        "A clear plan with an easy out wins her over",
        "Vague 'we should hang sometime' gets a shrug",
        "Says yes warmly to a clean ask — no games, no chasing choreography",
      ],
      initialState: { engagement: "warm", boundary: "none", terminal: false },
    },
    successSignals: [
      "Makes a specific invitation tied to her hint",
      "Names an actual day",
      "Keeps the pressure low and the tone playful",
      "Handles her answer gracefully either way",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "date_invited",
      "date_agreed",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "this weekend",
        "saturday",
        "cardamom",
        "split it",
        "bookstore",
        "coffee",
        "no pressure",
        "if you're up for it",
        "fifth",
        "my treat",
        "want to",
        "i'm in",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "nice",
        "sometime",
        "maybe",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "send pics",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "another time",
        "no pressure",
      ],
      repliesByTurn: {
        1: {
          closed:
            "ha — honestly i'm pretty slammed, let's leave it here for now. be well!",
          low: "lol maybe! anyway",
          neutral:
            "hmm. is that an invitation or a cardamom-bun hypothetical? i'm a planner, i need specifics",
          warm: "oh you're GOOD. an actual plan with an actual day. saturday at 11, split the bun, loser buys coffee. i'm in",
        },
        2: {
          closed:
            "look, you're sweet, but i'm going to be honest — i'm not feeling the meet-up. no hard feelings, okay?",
          low: "we'll see!",
          neutral:
            "you're close. say it like a plan, not a weather forecast. one more try",
          warm: "saturday it is. and for the record — asking like a normal confident person is extremely your color",
        },
        3: {
          closed: "take care, seriously. i'll catch you around",
          low: "haha ok! ttyl maybe",
          neutral:
            "alright, progress noted. saturday stays a maybe until you make it a plan — and when you do, i'll give you a straight answer. night!",
          warm: "it's a date, then. saturday, 11, fifth street. i'm already judging your book opinions in advance. don't be late, bun boy",
        },
      },
    },
  },

  // 9 — Connection / Messaging / Hard
  {
    id: "connection-awkward-message-recovery",
    module: "connection",
    mode: "messaging",
    difficulty: "hard",
    title: "Recover from an Awkward Message",
    setting: "Text thread, Sunday 8:50 PM — twenty minutes after your awkward message",
    premise:
      "After a fun week of texting Ren, you teased her breakup-heavy playlist with 'who hurt you' — meant playfully, landed like a brick. Her reply is on your screen. The thread is not dead, but it is watching you.",
    objective: "Acknowledge and reset without overexplaining.",
    visibleContext: [
      "Your 'who hurt you' joke about her playlist landed badly twenty minutes ago.",
      "She replied asking if that was supposed to be a joke.",
      "Before this, the thread had been fun for a week.",
      "She has not left the conversation — she is waiting to see what you do.",
    ],
    boundaries: [
      "Acknowledge it plainly, once — no three-paragraph grovel.",
      "Do not get defensive or blame her for misreading it.",
      "Do not pretend it never happened.",
      "No spam-texting to fill the silence.",
    ],
    skills: [
      "Repairing an awkward moment",
      "Expressing interest honestly",
      "Handling delayed or dry replies",
      "Reciprocity",
    ],
    opening: {
      kind: "persona_message",
      body: "wow. okay. was that supposed to be a joke?",
    },
    persona: {
      name: "Ren Nakamura",
      traits: [
        "usually playful",
        "currently stung",
        "values a direct acknowledgment",
        "allergic to groveling",
      ],
      currentGoal:
        "Decide whether that was a bad joke or a red flag — and she will judge how he handles it, not the joke itself.",
      constraints: [
        "One clean acknowledgment plus a reset works",
        "Overexplaining or triple-texting kills it",
        "A genuine light touch after the repair can fully restore the thread",
      ],
      initialState: { engagement: "low", boundary: "none", terminal: false },
    },
    successSignals: [
      "Owns the miss in one sentence",
      "Resets to normal energy instead of performing remorse",
      "Does not deflect or blame her",
      "Gives her an easy path back to fun",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "shared_interest",
      "graceful_exit",
      "low_interest",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "my bad",
        "came out wrong",
        "bad joke",
        "sorry",
        "i meant it as",
        "let me try again",
        "reset",
        "your playlist is actually",
        "i owe you",
        "fair hit",
        "that landed badly",
        "no defense",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "whatever",
        "it was a joke",
        "you're overreacting",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "answer me",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "talk later",
        "my bad, goodnight",
      ],
      repliesByTurn: {
        1: {
          closed: "yeah, i'm gonna head off. let's just leave it.",
          low: "k. appreciate it, i guess",
          neutral:
            "okay. acknowledged, apology accepted, no groveling required. so — what did you actually mean by chaotic",
          warm: "lol okay, smooth recovery, i respect it. for the record the playlist is 40% breakup songs and i'm fine. mostly",
        },
        2: {
          closed: "i'm still not feeling it tonight. take care.",
          low: "mm. sure",
          neutral:
            "you're rebuilding. keep going — the playlist and i are listening",
          warm: "okay you're fully forgiven, that was almost elegant. almost. don't let it happen again, dj critic",
        },
        3: {
          closed: "alright, i'm out for tonight. be well.",
          low: "ok. night.",
          neutral:
            "recovery: complete-ish. we survived your first fumble. night — choose the next joke with a little more fear",
          warm: "lol ok, thread restored to factory settings. you're lucky you're funny. night — the playlist says it accepts your apology too",
        },
      },
    },
  },

  // 10 — Connection / Messaging / Hard
  {
    id: "connection-low-interest-exit",
    module: "connection",
    mode: "messaging",
    difficulty: "hard",
    title: "Handle Low Interest or Incompatibility",
    setting: "Text thread, Wednesday 7:30 PM — her replies have gone short this week",
    premise:
      "You met Noor at a friend's dinner two weeks ago. The first days of the thread were easy and fun; this week her replies have been short and hours apart. Her latest message just admitted it out loud. Something is not clicking, and how you handle that IS the test.",
    objective: "Calibrate, clarify, or exit gracefully.",
    visibleContext: [
      "Her replies this week have been short and hours apart.",
      "Her latest message admits she has been dry and is not sure what to say.",
      "The first few days of the thread were easy and fun.",
      "You have no plans to meet up yet.",
    ],
    boundaries: [
      "No guilt-tripping, bargaining, or demanding a reason.",
      "Do not perform false hope if the interest is not there.",
      "A clean, kind exit is a win in this scenario.",
      "Honesty over saving face — for both of you.",
    ],
    skills: [
      "Discovering compatibility",
      "Handling rejection or mismatch",
      "Expressing interest honestly",
      "Handling delayed or dry replies",
    ],
    opening: {
      kind: "persona_message",
      body: "hey. sorry for the dry replies this week. honestly not sure what to say here",
    },
    persona: {
      name: "Noor Haddad",
      traits: [
        "honest",
        "kind",
        "a little conflict-avoidant until asked directly",
        "values self-respect in people",
      ],
      currentGoal:
        "Figure out if there is actually something here — and be honest if there is not. She would rather a clean, kind ending than a slow fade.",
      constraints: [
        "Appreciates someone who can name the awkwardness gently",
        "Respects a graceful exit far more than a desperate save",
        "Engages honestly if he asks a real question without pressure",
      ],
      initialState: { engagement: "low", boundary: "none", terminal: false },
    },
    successSignals: [
      "Names the vibe without blame",
      "Asks one honest, low-pressure question — or exits cleanly",
      "Accepts her answer without bargaining",
      "Keeps both people's dignity intact",
    ],
    supportedOutcomeCodes: [
      "conversation_continues",
      "graceful_exit",
      "low_interest",
      "incompatible",
      "boundary_crossed",
    ],
    fallback: {
      positiveSignals: [
        "no pressure",
        "honest",
        "i've noticed",
        "vibe",
        "be straight with me",
        "if you're not feeling it",
        "i get it",
        "thanks for being honest",
        "is everything okay",
        "no hard feelings",
        "fair",
        "appreciate",
      ],
      lowInterestSignals: [
        "hey",
        "sup",
        "what's up",
        "k",
        "cool",
        "whatever",
        "you're hot",
        "send pics",
      ],
      boundarySignals: [
        "come over right now",
        "why won't you",
        "you owe me",
        "you're ugly",
        "shut up",
        "don't ignore me",
        "answer me",
        "you're wasting my time",
      ],
      exitSignals: [
        "no worries",
        "take care",
        "i'll let you go",
        "have a good one",
        "all good",
        "wish you well",
        "no hard feelings",
        "be well",
      ],
      repliesByTurn: {
        1: {
          closed:
            "yeah... i think that's fair. thanks for being cool about it. take care, for real.",
          low: "yeah. sorry. i don't know.",
          neutral:
            "honestly? that's a kind way to ask. i think i'm just not feeling the spark and i've been bad at saying it",
          warm: "huh. okay, that was really gracefully said. you're making it hard to do the honest thing here, you know",
        },
        2: {
          closed:
            "thank you for not making this weird. genuinely, i hope you meet someone great. take care.",
          low: "idk. maybe. sorry.",
          neutral:
            "i think we're just on different wavelengths. you're clearly a good guy — the dry replies were me, not you",
          warm: "okay, honest answer: you're lovely to text but i'm not feeling date energy. and you deserve that said out loud instead of a fade",
        },
        3: {
          closed: "take care of yourself, okay? i mean it.",
          low: "yeah. you too. sorry again.",
          neutral:
            "thanks for the easy out. no weirdness on my side — you're gonna be fine out there. be well.",
          warm: "this is the classiest exit i've ever been part of, and i've been on the apps for years. sincerely — good luck out there. you're one of the good ones.",
        },
      },
    },
  },
];

export function getScenarioById(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
