// All rubber bridge scoring types and logic

export type Suit = 'C' | 'D' | 'H' | 'S' | 'NT';
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Seat = 'N' | 'S' | 'E' | 'W';
export type Doubled = 'none' | 'doubled' | 'redoubled';
export type Side = 'NS' | 'EW';

export interface Contract {
  level: Level;
  suit: Suit;
  declarer: Seat;
}

export interface HandScores {
  nsAbove: number;
  nsBelow: number;
  ewAbove: number;
  ewBelow: number;
}

export interface HandEntry {
  id: string;
  contract: Contract;
  // 0 = exactly made, positive = overtricks, negative = undertricks
  result: number;
  doubled: Doubled;
  honours?: { side: Side; value: 100 | 150 };
  scores: HandScores;
  timestamp: number;
  vulnerable: boolean; // was declarer's side vulnerable when played
  dealer?: Seat;
}

export interface GameSegment {
  startIdx: number;  // inclusive index into hands array
  endIdx: number;    // inclusive (-1 if empty)
  winner?: Side;     // set when game is complete
  gameNumber: number;
}

export interface ComputedRubberState {
  hands: HandEntry[];
  nsGames: number;
  ewGames: number;
  nsVul: boolean;
  ewVul: boolean;
  nsCurrentBelow: number;
  ewCurrentBelow: number;
  nsTotalAbove: number;
  ewTotalAbove: number;
  nsTotalBelow: number;
  ewTotalBelow: number;
  nsTotal: number;
  ewTotal: number;
  gameSegments: GameSegment[];
  rubberComplete: boolean;
  rubberWinner?: Side;
  rubberBonus?: number;
}

export interface RubberData {
  id: string;
  hands: HandEntry[];
  createdAt: number;
  completedAt?: number;
  // Manually-awarded unfinished rubber bonuses
  unfinishedNsBonus?: number;
  unfinishedEwBonus?: number;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function declarerSide(declarer: Seat): Side {
  return declarer === 'N' || declarer === 'S' ? 'NS' : 'EW';
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'C': return '♣';
    case 'D': return '♦';
    case 'H': return '♥';
    case 'S': return '♠';
    case 'NT': return 'NT';
  }
}

export function suitIsRed(suit: Suit): boolean {
  return suit === 'H' || suit === 'D';
}

export function contractLabel(contract: Contract, doubled: Doubled): string {
  const sym = suitSymbol(contract.suit);
  const dbl = doubled === 'doubled' ? ' x' : doubled === 'redoubled' ? ' xx' : '';
  return `${contract.level}${sym} ${contract.declarer}${dbl}`;
}

export function resultLabel(result: number): string {
  if (result === 0) return 'made';
  if (result > 0) return `+${result}`;
  return `${result}`;
}

// ─── Core scoring ─────────────────────────────────────────────────────────────

// Total trick score for contracted tricks (undoubled)
function contractTrickValue(suit: Suit, level: Level): number {
  if (suit === 'C' || suit === 'D') return level * 20;
  if (suit === 'H' || suit === 'S') return level * 30;
  // NT: 40 for first + 30 for each subsequent
  return 40 + 30 * (level - 1);
}

// Value per single trick (for overtrick calc)
function singleTrickValue(suit: Suit): number {
  if (suit === 'C' || suit === 'D') return 20;
  if (suit === 'H' || suit === 'S') return 30;
  return 30; // NT subsequent trick value
}

export function calculateHandScores(
  contract: Contract,
  result: number,
  vulnerable: boolean,
  doubled: Doubled,
  honours?: { side: Side; value: 100 | 150 },
): HandScores {
  const { level, suit } = contract;
  const side = declarerSide(contract.declarer);
  const isNS = side === 'NS';

  let nsAbove = 0;
  let nsBelow = 0;
  let ewAbove = 0;
  let ewBelow = 0;

  if (result >= 0) {
    // ── Contract made ──────────────────────────────────────────────────────
    const baseBelow = contractTrickValue(suit, level);

    // Below the line: trick score (doubled/redoubled multiplier)
    let belowScore: number;
    if (doubled === 'none') {
      belowScore = baseBelow;
    } else if (doubled === 'doubled') {
      belowScore = baseBelow * 2;
    } else {
      belowScore = baseBelow * 4;
    }
    if (isNS) nsBelow = belowScore;
    else ewBelow = belowScore;

    // Above the line: overtricks
    let overtrickTotal = 0;
    if (result > 0) {
      const perTrick = singleTrickValue(suit);
      if (doubled === 'none') {
        overtrickTotal = perTrick * result;
      } else if (doubled === 'doubled') {
        overtrickTotal = (vulnerable ? 200 : 100) * result;
      } else {
        overtrickTotal = (vulnerable ? 400 : 200) * result;
      }
    }

    // Insult bonus for making a doubled/redoubled contract
    let insult = 0;
    if (doubled === 'doubled') insult = 50;
    else if (doubled === 'redoubled') insult = 100;

    // Slam bonus
    let slamBonus = 0;
    if (level === 6) slamBonus = vulnerable ? 750 : 500;
    else if (level === 7) slamBonus = vulnerable ? 1500 : 1000;

    const totalAbove = overtrickTotal + insult + slamBonus;
    if (isNS) nsAbove += totalAbove;
    else ewAbove += totalAbove;

  } else {
    // ── Contract failed ────────────────────────────────────────────────────
    const undertricks = -result; // positive number

    let penalty: number;
    if (doubled === 'none') {
      penalty = undertricks * (vulnerable ? 100 : 50);
    } else {
      // Doubled penalties per-undertrick schedule
      let dPenalty: number;
      if (vulnerable) {
        // 200, 300, 300, 300…
        dPenalty = 200 + Math.max(0, undertricks - 1) * 300;
      } else {
        // 100, 200, 200, 200…
        dPenalty = 100 + Math.max(0, undertricks - 1) * 200;
      }
      if (doubled === 'redoubled') dPenalty *= 2;
      penalty = dPenalty;
    }

    // Penalty goes to defending side
    if (isNS) ewAbove = penalty;
    else nsAbove = penalty;
  }

  // Honours (always above the line, credited to the specified side)
  if (honours) {
    if (honours.side === 'NS') nsAbove += honours.value;
    else ewAbove += honours.value;
  }

  return { nsAbove, nsBelow, ewAbove, ewBelow };
}

// ─── Rubber state computation ─────────────────────────────────────────────────

export function computeRubberState(
  hands: HandEntry[],
  unfinishedNsBonus = 0,
  unfinishedEwBonus = 0,
): ComputedRubberState {
  const gameSegments: GameSegment[] = [];

  let nsGames = 0;
  let ewGames = 0;
  let nsVul = false;
  let ewVul = false;
  let nsCurrentBelow = 0;
  let ewCurrentBelow = 0;
  let nsTotalAbove = 0;
  let ewTotalAbove = 0;
  let nsTotalBelow = 0;
  let ewTotalBelow = 0;
  let rubberComplete = false;
  let rubberWinner: Side | undefined;
  let rubberBonus: number | undefined;

  let segStart = 0;
  let gameNumber = 1;

  for (let i = 0; i < hands.length; i++) {
    if (rubberComplete) break;

    const { scores } = hands[i];
    nsTotalAbove += scores.nsAbove;
    ewTotalAbove += scores.ewAbove;
    nsTotalBelow += scores.nsBelow;
    ewTotalBelow += scores.ewBelow;
    nsCurrentBelow += scores.nsBelow;
    ewCurrentBelow += scores.ewBelow;

    if (nsCurrentBelow >= 100 || ewCurrentBelow >= 100) {
      const winner: Side = nsCurrentBelow >= 100 ? 'NS' : 'EW';
      if (winner === 'NS') nsGames++;
      else ewGames++;

      gameSegments.push({
        startIdx: segStart,
        endIdx: i,
        winner,
        gameNumber,
      });

      segStart = i + 1;
      gameNumber++;
      nsCurrentBelow = 0;
      ewCurrentBelow = 0;
      nsVul = nsGames >= 1;
      ewVul = ewGames >= 1;

      if (nsGames >= 2 || ewGames >= 2) {
        rubberComplete = true;
        rubberWinner = nsGames >= 2 ? 'NS' : 'EW';
        const loserGames = rubberWinner === 'NS' ? ewGames : nsGames;
        rubberBonus = loserGames === 0 ? 700 : 500;
        if (rubberWinner === 'NS') nsTotalAbove += rubberBonus;
        else ewTotalAbove += rubberBonus;
      }
    }
  }

  // Add the current in-progress game segment
  if (!rubberComplete) {
    gameSegments.push({
      startIdx: segStart,
      endIdx: hands.length - 1,
      gameNumber,
    });
  }

  // Apply unfinished rubber bonuses (if rubber was manually ended)
  nsTotalAbove += unfinishedNsBonus;
  ewTotalAbove += unfinishedEwBonus;

  return {
    hands,
    nsGames,
    ewGames,
    nsVul,
    ewVul,
    nsCurrentBelow: rubberComplete ? 0 : nsCurrentBelow,
    ewCurrentBelow: rubberComplete ? 0 : ewCurrentBelow,
    nsTotalAbove,
    ewTotalAbove,
    nsTotalBelow,
    ewTotalBelow,
    nsTotal: nsTotalAbove + nsTotalBelow,
    ewTotal: ewTotalAbove + ewTotalBelow,
    gameSegments,
    rubberComplete,
    rubberWinner,
    rubberBonus,
  };
}

// ─── Unfinished rubber bonus calculation ─────────────────────────────────────

export function calcUnfinishedBonus(state: ComputedRubberState): {
  nsBonus: number;
  ewBonus: number;
  description: string;
} {
  const { nsGames, ewGames, nsCurrentBelow, ewCurrentBelow } = state;

  // The side with the most games gets the game-up bonus
  let nsBonus = 0;
  let ewBonus = 0;
  const parts: string[] = [];

  if (nsGames > ewGames) {
    nsBonus += 300;
    parts.push('NS +300 (game up)');
  } else if (ewGames > nsGames) {
    ewBonus += 300;
    parts.push('EW +300 (game up)');
  }

  if (nsCurrentBelow > 0) {
    nsBonus += 100;
    parts.push('NS +100 (part score)');
  }
  if (ewCurrentBelow > 0) {
    ewBonus += 100;
    parts.push('EW +100 (part score)');
  }

  return {
    nsBonus,
    ewBonus,
    description: parts.length > 0 ? parts.join(', ') : 'No unfinished bonuses',
  };
}
