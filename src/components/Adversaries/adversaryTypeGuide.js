// Type-specific guidance content derived from adversary-creation-guide.md

export const typeGuide = {
  Colossus: {
    summary: 'Massive, multi-segment adversary — a framework stat block plus individual segments (Head, Torso, Legs, etc.), each with its own HP, difficulty, attack, and features.',
    notes: 'Build the framework stats above (thresholds, stress, experiences, features), then add segments below. Segments track Broken (half HP marked) and Destroyed (all HP marked) independently.',
    experiences: [],
    features: [],
  },
  Standard: {
    summary: 'Makes up the core of enemy forces. Simple abilities and consistent threat.',
    damageDie: 'd6–d8',
    notes: 'Most features harry or distract a PC, or augment the standard\'s ATK or damage. Many Standards don\'t have experiences at all.',
    experiences: ['(usually none, or shared with other forces)'],
    features: [
      { name: 'Too Many to Handle', type: 'Passive', desc: 'When within Melee of a creature and at least one other of the same type is within Close, all attacks against that creature have advantage.' },
      { name: 'Pack Tactics', type: 'Passive', desc: 'On a successful attack, if another of the same type is within Melee of the target, deal extra damage and gain a Fear.' },
    ],
  },
  Bruiser: {
    summary: 'High HP, big hits. Throws people around and controls the battlefield.',
    damageDie: 'd10–d12',
    notes: 'Features hit multiple enemies and move PCs around. Tip: go down a die size and add +2 damage modifier for more consistent output.',
    experiences: ['Crusher', 'Charger', 'Intimidation', 'Throw'],
    features: [
      { name: 'Momentum', type: 'Reaction', desc: 'When the adversary makes a successful attack, gain a Fear.' },
      { name: 'Ramp Up', type: 'Passive', desc: 'Must spend a Fear to spotlight. While spotlighted, can attack all targets within range.' },
      { name: 'Slow', type: 'Passive', desc: 'First spotlight: place a token and describe what they\'re preparing. Second spotlight: clear token and act.' },
      { name: 'Terrifying', type: 'Passive', desc: 'On a successful attack, all PCs within Far range lose a Hope and you gain a Fear.' },
    ],
  },
  Horde: {
    summary: 'Large group of weaker creatures acting as one. Strong early, weaker at half HP.',
    damageDie: 'd6–d10',
    notes: 'Can hit Major at full HP, only Severe when rolling very well against non-Guardians. When splitting damage for Horde passive, aim to halve the average (e.g. 2d10+2 → 1d10+1).',
    experiences: [],
    features: [
      { name: 'Horde (damage)', type: 'Passive', desc: 'When half or more HP is marked, standard attack deals reduced damage instead.' },
    ],
  },
  Leader: {
    summary: 'Commands allies and enables them. Lower damage than a Bruiser but high tactical value.',
    damageDie: 'd8–d10',
    notes: 'Spotlight allies at reduced damage via Fear abilities. Avoid pairing Momentum with Fear-making attacks — it becomes Fear neutral. A Bruiser with Momentum + a Leader with Relentless is a powerful combo.',
    experiences: ['For the Realm!', 'Backstabber', 'Commander', 'Leadership'],
    features: [
      { name: 'Relentless (X)', type: 'Passive', desc: 'Can be spotlighted up to X times per GM turn. Spend Fear as usual.' },
      { name: 'Activate Allies', type: 'Action', desc: 'Spend X Fear to spotlight 1d4 allies. Attacks they make while spotlighted deal half damage.' },
      { name: 'Terrifying', type: 'Passive', desc: 'On a successful attack, all PCs within Far range lose a Hope and you gain a Fear.' },
      { name: 'Call Reinforcements', type: 'Action', desc: 'Once per scene, mark a Stress to summon a different adversary within range.' },
      { name: 'Merciless (1)', type: 'Passive', desc: 'When spotlighted, also spotlight one ally without spending Fear.' },
      { name: 'Tactician', type: 'Action', desc: 'When spotlighted, mark a Stress to also spotlight two allies within Close range.' },
    ],
  },
  Minion: {
    summary: 'Defeated by any damage. Dangerous in numbers via group attacks.',
    damageDie: 'Flat damage (no die)',
    notes: 'Always 1 HP and 1 Stress. The Minion (X) passive and Group Attack are the core of what makes them threatening. Add one group per tier of party.',
    experiences: [],
    features: [
      { name: 'Minion (X)', type: 'Passive', desc: 'Defeated by any damage. For every X damage dealt, defeat an additional Minion within range the attack would succeed against.' },
      { name: 'Group Attack', type: 'Action', desc: 'Spend a Fear — spotlight all of the same type within Close of a target. They move to Melee and make one shared attack roll. On a success, each deals standard damage (combined).' },
    ],
  },
  Ranged: {
    summary: 'Applies pressure from a distance. Spends Stress to boost damage, Fear to hit multiple targets.',
    damageDie: 'd8–d10',
    notes: 'Lower HP than melee types — they rely on distance for safety. Use Stress to increase damage of single attacks; use Fear for multi-target attacks.',
    experiences: ['Hunter', 'Survival', 'Tracker', 'Trapper'],
    features: [
      { name: 'Opportunity Shot', type: 'Reaction', desc: 'When another adversary deals damage to a target within Far range, mark a Stress to add extra damage.' },
      { name: 'Opportunist', type: 'Passive', desc: 'When two or more adversaries are within Very Close of a creature, all damage this adversary deals to it is doubled.' },
      { name: 'Hit Multiple Targets', type: 'Action', desc: 'Spend a Fear — attack a number of targets within Far range. Targets it succeeds against take reduced damage.' },
    ],
  },
  Skulk: {
    summary: 'Skirmisher in close quarters. Deals burst damage from stealth or flanking.',
    damageDie: 'd6–d8',
    notes: 'Features that disorient PCs (ambush) or impart status effects are common. Often has higher ATK but lower HP than a Bruiser.',
    experiences: ['Camouflage', 'Stealth', 'Rabblerouser', 'Intrusion'],
    features: [
      { name: 'Ambush', type: 'Action', desc: 'While Hidden, make an attack. On a success, deal increased damage.' },
      { name: 'Cloaked', type: 'Action', desc: 'Become Hidden until after the next attack. Attacks made while Hidden from this feature have advantage.' },
    ],
  },
  Solo: {
    summary: 'Boss-level threat. Extremely high damage, multiple actions, phases.',
    damageDie: 'd10–d12 (sometimes d20 or 2d6)',
    notes: 'Solos with phases should have lower HP and thresholds. Relentless is mechanically important — ensure they generate Fear somehow. Avoid pairing Momentum with Fear-based attacks.',
    experiences: ['Never Enough!', 'I See You', 'Vengeful'],
    features: [
      { name: 'Relentless (X)', type: 'Passive', desc: 'Can be spotlighted up to X times per GM turn. Spend Fear as usual.' },
      { name: 'Countdown', type: 'Reaction', desc: 'Countdown (Loop 1d6). When condition triggers, activate. When it fires, the adversary does something powerful — forces an attack or Reaction Roll on a group.' },
      { name: 'Momentum', type: 'Reaction', desc: 'On a successful attack, gain a Fear. Pair carefully — this becomes Fear-neutral if the Fear move itself makes an attack.' },
    ],
  },
  Support: {
    summary: 'Buffs allies, debuffs PCs, and changes the environment. Higher Stress than other types.',
    damageDie: 'd4–d6',
    notes: 'Think of Supports as weaker Leaders. Features cause PCs to mark Stress or lose Hope, or help other units. Higher Stress max means more action economy.',
    experiences: ['Magical Knowledge', 'Lore'],
    features: [
      { name: 'AOE Condition', type: 'Action', desc: 'Spend a Fear — attack all within Very Close. Targets it succeeds against become Restrained and Vulnerable. A successful Trait Roll breaks free.' },
    ],
  },
  Social: {
    summary: 'A bespoke adversary whose numbers reflect a narrative role, not a combat one.',
    damageDie: 'd4–d6',
    notes: 'Deviation from the stat tables is expected and encouraged. Consider designing two stat blocks — one social, one combat — with a phase-change between them. Tier reflects their place in the fiction, not combat power.',
    experiences: [],
    features: [],
  },
}

export const stressFearGuide = {
  stress: [
    'Attack more than 1 target',
    'Increase damage by a die face or number of dice',
    'Attack all targets in Very Close',
    'Do something spell-equivalent',
    'Impart conditions (not Restrained/Vulnerable)',
    'Give allies spotlight at reduced damage (≤5)',
    'Do a bit more damage and push a target',
  ],
  fear: [
    'Increase die size and AoE damage',
    'Summon something',
    'Give allies spotlight at full damage (≤5)',
    'Start countdowns on characters',
    'AoE larger than Very Close',
    'AoE moves that deal direct damage',
  ],
  momentumNote: 'Momentum generates Fear on a successful attack. If a Fear move also makes an attack, it becomes Fear-neutral on a hit — reserve that combo for truly dangerous adversaries.',
}
