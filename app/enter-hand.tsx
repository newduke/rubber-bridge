import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRubber } from '../context/RubberContext';
import {
  Suit,
  Level,
  Seat,
  Doubled,
  Side,
  Contract,
  calculateHandScores,
  computeRubberState,
  declarerSide,
  suitSymbol,
  suitIsRed,
  contractLabel,
  resultLabel,
} from '../utils/scoring';

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7];
const SUITS: Suit[] = ['C', 'D', 'H', 'S', 'NT'];
const SEATS: Seat[] = ['N', 'E', 'S', 'W'];

const C = {
  bg: '#fdfbf7',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  ns: '#2563eb',
  ew: '#dc2626',
  red: '#dc2626',
  black: '#1f2937',
  white: '#ffffff',
  subtle: '#64748b',
  selected: '#2563eb',
  selectedText: '#ffffff',
  unselected: '#ffffff',
  unselectedText: '#1f2937',
  border: '#cbd5e1',
  preview: '#f1f5f9',
};

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillRow<T extends string | number>({
  options,
  selected,
  onSelect,
  renderLabel,
  colorFor,
  disabledFor,
  size = 'md',
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  renderLabel?: (v: T, disabled: boolean, isSel: boolean) => React.ReactNode;
  colorFor?: (v: T, disabled: boolean) => string;
  disabledFor?: (v: T) => boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const h = size === 'lg' ? 44 : size === 'sm' ? 30 : 36;
  const minW = size === 'lg' ? 48 : size === 'sm' ? 36 : 40;
  return (
    <View style={pillStyles.row}>
      {options.map((opt) => {
        const isSel = opt === selected;
        const isDisabled = disabledFor ? disabledFor(opt) : false;
        const color = colorFor ? colorFor(opt, isDisabled) : C.black;
        return (
          <TouchableOpacity
            key={String(opt)}
            disabled={isDisabled}
            onPress={() => onSelect(opt)}
            style={[
              pillStyles.pill,
              { height: h, minWidth: minW },
              isSel ? { backgroundColor: color, borderColor: color } : { borderColor: color, backgroundColor: 'transparent' },
              isDisabled && { opacity: 0.4 },
            ]}
            activeOpacity={0.7}
          >
            {renderLabel ? (
              renderLabel(opt, isDisabled, isSel)
            ) : (
              <Text
                style={[
                  pillStyles.pillText,
                  { color: isSel ? C.white : color },
                  size === 'lg' && { fontSize: 16, fontWeight: '700' },
                ]}
              >
                {String(opt)}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const pillStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pill: {
    borderRadius: 8,
    borderWidth: 2,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

// ─── Score preview ─────────────────────────────────────────────────────────────

function ScorePreview({
  contract,
  result,
  doubled,
  honours,
  vulnerable,
}: {
  contract: Contract;
  result: number;
  doubled: Doubled;
  honours?: { side: Side; value: 100 | 150 };
  vulnerable: boolean;
}) {
  const scores = useMemo(
    () => calculateHandScores(contract, result, vulnerable, doubled, honours),
    [contract, result, vulnerable, doubled, honours],
  );

  const side = declarerSide(contract.declarer);
  const sideColor = side === 'NS' ? C.ns : C.ew;

  const label = contractLabel(contract, doubled);
  const res = resultLabel(result);

  const rows: Array<{ label: string; ns: number; ew: number }> = [];
  if (scores.nsAbove > 0 || scores.ewAbove > 0)
    rows.push({ label: 'above line', ns: scores.nsAbove, ew: scores.ewAbove });
  if (scores.nsBelow > 0 || scores.ewBelow > 0)
    rows.push({ label: 'below line', ns: scores.nsBelow, ew: scores.ewBelow });

  return (
    <View style={previewStyles.container}>
      <Text style={previewStyles.heading}>
        Preview: <Text style={{ color: sideColor }}>{label}</Text>{' '}
        <Text style={{ color: result >= 0 ? '#15803d' : '#dc2626' }}>{res}</Text>
        {vulnerable ? '  (vul)' : '  (not vul)'}
      </Text>
      <View style={previewStyles.table}>
        <View style={previewStyles.headerRow}>
          <Text style={[previewStyles.cellLabel]} />
          <Text style={[previewStyles.cellValue, { color: C.ns }]}>NS</Text>
          <Text style={[previewStyles.cellValue, { color: C.ew }]}>EW</Text>
        </View>
        {rows.map((r) => (
          <View key={r.label} style={previewStyles.row}>
            <Text style={previewStyles.cellLabel}>{r.label}</Text>
            <Text style={[previewStyles.cellValue, { color: C.ns }]}>
              {r.ns > 0 ? r.ns : '—'}
            </Text>
            <Text style={[previewStyles.cellValue, { color: C.ew }]}>
              {r.ew > 0 ? r.ew : '—'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    backgroundColor: C.preview,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  heading: {
    fontSize: 13,
    fontWeight: '600',
    color: C.black,
    marginBottom: 6,
  },
  table: { gap: 2 },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
    marginBottom: 2,
  },
  row: { flexDirection: 'row' },
  cellLabel: {
    flex: 1,
    fontSize: 12,
    color: C.subtle,
  },
  cellValue: {
    width: 60,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    paddingRight: 8,
  },
});

// ─── Main form ────────────────────────────────────────────────────────────────

type Call = { type: 'Pass' } | { type: 'X' } | { type: 'XX' } | { type: 'Bid'; level: Level; suit: Suit };
type BidRecord = { seat: Seat; call: Call };

export default function EnterHandScreen() {
  const router = useRouter();
  const { state, addHand } = useRubber();

  const [step, setStep] = useState<'dealer' | 'bidding' | 'scoring'>('dealer');
  
  // Dealer
  const [dealer, setDealer] = useState<Seat | null>(null);

  // Bidding
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [tempLevel, setTempLevel] = useState<Level>(1);

  // Scoring
  const [tricksTaken, setTricksTaken] = useState(7);
  const [honours, setHonours] = useState<
    'none' | '100NS' | '100EW' | '150NS' | '150EW'
  >('none');

  const rs = useMemo(
    () => computeRubberState(state.currentRubber.hands),
    [state.currentRubber.hands],
  );

  const suitRank = (s: Suit) => SUITS.indexOf(s);

  let highestBid: { level: Level; suit: Suit; seat: Seat } | null = null;
  let currentDoubled: Doubled = 'none';
  const firstBidBySuitAndPartnership: Record<string, Seat> = {};
  
  let consecutivePasses = 0;
  for (let i = bids.length - 1; i >= 0; i--) {
    if (bids[i].call.type === 'Pass') consecutivePasses++;
    else break;
  }

  for (const b of bids) {
    if (b.call.type === 'Bid') {
      highestBid = { level: b.call.level, suit: b.call.suit, seat: b.seat };
      currentDoubled = 'none';
      const partnership = b.seat === 'N' || b.seat === 'S' ? 'NS' : 'EW';
      const key = `${partnership}-${b.call.suit}`;
      if (!firstBidBySuitAndPartnership[key]) {
        firstBidBySuitAndPartnership[key] = b.seat;
      }
    } else if (b.call.type === 'X') {
      currentDoubled = 'doubled';
    } else if (b.call.type === 'XX') {
      currentDoubled = 'redoubled';
    }
  }

  const startIndex = dealer ? SEATS.indexOf(dealer) : 0;
  const currentTurn = SEATS[(startIndex + bids.length) % 4];

  const isOpponentCall = highestBid && ((highestBid.seat === 'N' || highestBid.seat === 'S') !== (currentTurn === 'N' || currentTurn === 'S'));
  const canDouble = highestBid && isOpponentCall && currentDoubled === 'none';
  const canRedouble = highestBid && !isOpponentCall && currentDoubled === 'doubled';
  
  const canBid = (l: Level, s: Suit) => {
    if (!highestBid) return true;
    if (l > highestBid.level) return true;
    if (l === highestBid.level && suitRank(s) > suitRank(highestBid.suit)) return true;
    return false;
  };

  useEffect(() => {
    if (step === 'bidding') {
      const isPassedOut = bids.length >= 4 && !highestBid && consecutivePasses === 4;
      const isBiddingOver = highestBid && consecutivePasses >= 3;
      
      if (isPassedOut) {
        Alert.alert('Passed Out', 'No one bid. Hand is passed out.');
        router.back();
      } else if (isBiddingOver) {
        setStep('scoring');
        setTricksTaken(highestBid!.level + 6);
      } else if (highestBid) {
        if (tempLevel < highestBid.level || (tempLevel === highestBid.level && highestBid.suit === 'NT')) {
          setTempLevel(Math.min(highestBid.level + 1, 7) as Level);
        }
      }
    }
  }, [bids, highestBid, consecutivePasses, step, router, tempLevel]);

  const finalDeclarer = highestBid
    ? firstBidBySuitAndPartnership[`${highestBid.seat === 'N' || highestBid.seat === 'S' ? 'NS' : 'EW'}-${highestBid.suit}`]
    : 'N';
    
  const contract: Contract = highestBid ? { level: highestBid.level, suit: highestBid.suit, declarer: finalDeclarer } : { level: 1, suit: 'NT', declarer: 'N' };
  
  const side = declarerSide(contract.declarer);
  const vulnerable = side === 'NS' ? rs.nsVul : rs.ewVul;
  const result = tricksTaken - (contract.level + 6);

  const honoursValue: { side: Side; value: 100 | 150 } | undefined =
    honours === 'none'
      ? undefined
      : {
          side: honours.endsWith('NS') ? 'NS' : 'EW',
          value: honours.startsWith('150') ? 150 : 100,
        };

  const handleSubmit = () => {
    if (rs.rubberComplete) {
      Alert.alert('Rubber Complete', 'Start a new rubber to enter more hands.');
      return;
    }
    if (!highestBid) return;
    
    addHand(contract, result, currentDoubled, honoursValue);
    router.replace('/');
  };

  const suitColor = (s: Suit) => (suitIsRed(s) ? C.red : C.black);
  const seatColor = (s: Seat) => s === 'N' || s === 'S' ? C.ns : C.ew;

  const renderCall = (call: Call | null) => {
    if (!call) return '';
    if (call.type === 'Pass') return 'Pass';
    if (call.type === 'X') return 'X';
    if (call.type === 'XX') return 'XX';
    return `${call.level}${suitSymbol(call.suit)}`;
  };

  const getBiddingGrid = () => {
    if (!dealer) return [];
    const _startIndex = SEATS.indexOf(dealer);
    const rows: Call[][] = [];
    let currentRow: Call[] = new Array(_startIndex).fill(null);
    for (const b of bids) {
      currentRow.push(b.call);
      if (currentRow.length === 4) {
        rows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      while(currentRow.length < 4) currentRow.push(null as any);
      rows.push(currentRow);
    }
    return rows;
  };

  if (step === 'dealer') {
    return (
      <View style={styles.root}>
        <View style={styles.centerContent}>
          <Text style={styles.mainTitle}>New Hand</Text>
          <Text style={styles.descriptionText}>Who is the dealer?</Text>
          <PillRow
            options={SEATS}
            selected={dealer || ('' as Seat)}
            onSelect={(s) => {
              setDealer(s);
              setStep('bidding');
            }}
            colorFor={seatColor}
            size="lg"
          />
        </View>
      </View>
    );
  }

  if (step === 'bidding') {
    const gridRows = getBiddingGrid();
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Bidding</Text>
        <Text style={styles.subheading}>Dealer: {dealer}  •  Turn: {currentTurn}</Text>
        
        <View style={styles.biddingGrid}>
          <View style={styles.biddingGridRow}>
            {SEATS.map(s => <Text key={s} style={[styles.biddingGridHeader, { color: seatColor(s) }]}>{s}</Text>)}
          </View>
          {gridRows.map((row, i) => (
            <View key={i} style={styles.biddingGridRow}>
              {row.map((call, j) => (
                <View key={j} style={styles.biddingGridCell}>
                  <Text style={[
                     styles.biddingGridText,
                     call?.type === 'Bid' && { color: suitColor(call.suit), fontWeight: '700' },
                     (call?.type === 'X' || call?.type === 'XX') && { color: C.ew, fontWeight: '700' }
                  ]}>
                    {renderCall(call)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Bid Level</Text>
          <PillRow
            options={LEVELS}
            selected={tempLevel}
            onSelect={l => setTempLevel(l)}
            disabledFor={l => {
              if (!highestBid) return false;
              if (l < highestBid.level) return true;
              if (l === highestBid.level && highestBid.suit === 'NT') return true;
              return false;
            }}
            colorFor={(l, disabled) => disabled ? '#cbd5e1' : C.selected}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Select Suit to Bid at Level {tempLevel}</Text>
          <PillRow
            options={SUITS}
            selected={'' as any}
            onSelect={s => {
              if (canBid(tempLevel, s)) {
                setBids([...bids, { seat: currentTurn, call: { type: 'Bid', level: tempLevel, suit: s } }]);
              }
            }}
            disabledFor={s => !canBid(tempLevel, s)}
            renderLabel={(s, disabled) => (
              <Text style={[pillStyles.pillText, { color: disabled ? '#cbd5e1' : suitColor(s), fontSize: 26 }]}>
                {suitSymbol(s)}
              </Text>
            )}
            colorFor={(s, disabled) => disabled ? '#cbd5e1' : suitColor(s)}
            size="lg"
          />
        </View>

        <View style={styles.callActions}>
          <TouchableOpacity 
            style={[styles.callBtn, { backgroundColor: '#64748b' }]}
            onPress={() => setBids([...bids, { seat: currentTurn, call: { type: 'Pass' } }])}
          >
            <Text style={styles.callBtnText}>Pass</Text>
          </TouchableOpacity>

          {(canDouble || canRedouble) && (
            <View style={styles.callActionsRow}>
              {canDouble && (
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => setBids([...bids, { seat: currentTurn, call: { type: 'X' } }])}
                >
                  <Text style={styles.callBtnText}>Double</Text>
                </TouchableOpacity>
              )}

              {canRedouble && (
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: '#2563eb' }]}
                  onPress={() => setBids([...bids, { seat: currentTurn, call: { type: 'XX' } }])}
                >
                  <Text style={styles.callBtnText}>Redouble</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => {
            if (bids.length > 0) {
               setBids(bids.slice(0, -1));
            } else {
               setStep('dealer');
               setDealer(null);
            }
        }}>
           <Text style={styles.cancelBtnText}>{bids.length > 0 ? 'Undo Last Call' : 'Back to Dealer'}</Text>
        </TouchableOpacity>
        <View style={{height: 32}} />
      </ScrollView>
    );
  }

  // Scoring Step
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.scoringInfoBox}>
        <Text style={styles.scoringTitle}>
          Contract:{' '}
          <Text style={{ color: suitColor(contract.suit) }}>
            {contract.level}{suitSymbol(contract.suit)}
          </Text>{' '}
          {currentDoubled === 'doubled' ? 'X' : currentDoubled === 'redoubled' ? 'XX' : ''}
        </Text>
        <Text style={styles.scoringSub}>Declarer: {contract.declarer}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tricks Taken (0-13)</Text>
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setTricksTaken(Math.max(0, tricksTaken - 1))}>
            <Text style={styles.stepperBtnText}>−</Text>
          </TouchableOpacity>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{tricksTaken}</Text>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => setTricksTaken(Math.min(13, tricksTaken + 1))}>
            <Text style={styles.stepperBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>Contract needs {contract.level + 6} tricks. Result: {result === 0 ? 'Made' : result > 0 ? `+${result}` : `${result}`}.</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Honours</Text>
        <PillRow
          options={['none', '100NS', '100EW', '150NS', '150EW']}
          selected={honours}
          onSelect={setHonours}
          renderLabel={(h) => (
            <Text style={[pillStyles.pillText, { color: honours === h ? C.white : h.includes('NS') ? C.ns : h === 'none' ? C.black : C.ew, fontSize: 12 }]}>
              {h === 'none' ? 'None' : `${h.startsWith('100') ? '100' : '150'} ${h.endsWith('NS') ? 'NS' : 'EW'}`}
            </Text>
          )}
          colorFor={(h) => h === 'none' ? C.subtle : h.endsWith('NS') ? C.ns : C.ew}
          size="sm"
        />
        <Text style={styles.hint}>
          100 = 4 top honours in one hand · 150 = all 5 (or 4 aces in NT)
        </Text>
      </View>

      <ScorePreview contract={contract} result={result} doubled={currentDoubled} honours={honoursValue} vulnerable={vulnerable} />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.submitBtnText}>Record Hand</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => { setStep('bidding'); setBids(bids.slice(0, -1)); }}>
        <Text style={styles.cancelBtnText}>Undo Final Pass & Return to Bidding</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 32,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  subheading: {
    color: C.black,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  // Bidding Grid
  biddingGrid: {
    backgroundColor: C.card,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  biddingGridRow: {
    flexDirection: 'row',
  },
  biddingGridHeader: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 15,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  biddingGridCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  biddingGridText: {
    fontSize: 15,
    color: '#1f2937',
  },

  // Call Actions
  callActions: {
    gap: 8,
    marginTop: 8,
  },
  callActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  callBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  callBtnDisabled: {
    backgroundColor: '#93c5fd',
    opacity: 0.7,
  },
  callBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignSelf: 'flex-start',
  },
  stepperBtn: {
    width: 50,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  stepperBtnText: {
    color: C.black,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '300',
  },
  stepperValue: {
    width: 60,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  stepperValueText: {
    color: C.black,
    fontSize: 20,
    fontWeight: '700',
  },

  // Scoring Info Box
  scoringInfoBox: {
    backgroundColor: '#f1f5f9',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoringTitle: {
    color: C.black,
    fontSize: 22,
    fontWeight: '800',
  },
  scoringSub: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },

  // Submit & Cancel
  submitBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    elevation: 3,
  },
  submitBtnText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
});

