import React, { useState, useMemo } from 'react';
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
  bg: '#2e7d32',
  card: '#fffde7',
  cardBorder: '#f9a825',
  ns: '#1565c0',
  ew: '#b71c1c',
  red: '#cc0000',
  black: '#212121',
  white: '#fff',
  subtle: '#616161',
  selected: '#1b5e20',
  selectedText: '#fff',
  unselected: '#fff',
  unselectedText: '#212121',
  border: '#bdbdbd',
  preview: '#e8f5e9',
};

// ─── Pill selector ────────────────────────────────────────────────────────────

function PillRow<T extends string | number>({
  options,
  selected,
  onSelect,
  renderLabel,
  colorFor,
  size = 'md',
}: {
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
  renderLabel?: (v: T) => React.ReactNode;
  colorFor?: (v: T) => string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const h = size === 'lg' ? 44 : size === 'sm' ? 30 : 36;
  const minW = size === 'lg' ? 48 : size === 'sm' ? 36 : 40;
  return (
    <View style={pillStyles.row}>
      {options.map((opt) => {
        const isSel = opt === selected;
        const color = colorFor ? colorFor(opt) : C.black;
        return (
          <TouchableOpacity
            key={String(opt)}
            onPress={() => onSelect(opt)}
            style={[
              pillStyles.pill,
              { height: h, minWidth: minW },
              isSel ? { backgroundColor: color } : { borderColor: color },
            ]}
            activeOpacity={0.7}
          >
            {renderLabel ? (
              renderLabel(opt)
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
        <Text style={{ color: result >= 0 ? '#2e7d32' : '#b71c1c' }}>{res}</Text>
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
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#a5d6a7',
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
    borderBottomColor: '#c8e6c9',
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

export default function EnterHandScreen() {
  const router = useRouter();
  const { state, addHand } = useRubber();

  const [level, setLevel] = useState<Level>(1);
  const [suit, setSuit] = useState<Suit>('NT');
  const [declarer, setDeclarer] = useState<Seat>('N');
  const [madeOrDown, setMadeOrDown] = useState<'made' | 'down'>('made');
  const [overtricks, setOvertricks] = useState(0);
  const [undertricks, setUndertricks] = useState(1);
  const [doubled, setDoubled] = useState<Doubled>('none');
  const [honours, setHonours] = useState<
    'none' | '100NS' | '100EW' | '150NS' | '150EW'
  >('none');

  // Determine vulnerability from current rubber state
  const rs = useMemo(
    () => computeRubberState(state.currentRubber.hands),
    [state.currentRubber.hands],
  );

  const contract: Contract = { level, suit, declarer };
  const side = declarerSide(declarer);
  const vulnerable = side === 'NS' ? rs.nsVul : rs.ewVul;
  const result = madeOrDown === 'made' ? overtricks : -undertricks;

  // Max overtricks based on level
  const maxOver = 7 - level;
  // Max undertricks: up to level + 6 (can't win any of the 13 tricks)
  const maxUnder = Math.min(13, 6 + level);

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
    addHand(contract, result, doubled, honoursValue);
    router.back();
  };

  const suitColor = (s: Suit) => (suitIsRed(s) ? '#cc0000' : '#1a1a1a');
  const seatColor = (s: Seat) =>
    s === 'N' || s === 'S' ? C.ns : C.ew;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Contract level ──────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Level</Text>
        <PillRow
          options={LEVELS}
          selected={level}
          onSelect={(v) => {
            setLevel(v);
            setOvertricks(Math.min(overtricks, 7 - v));
            setUndertricks(Math.min(undertricks, 6 + v));
          }}
          colorFor={() => C.selected}
          size="lg"
        />
      </View>

      {/* ── Suit ────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Suit</Text>
        <PillRow
          options={SUITS}
          selected={suit}
          onSelect={setSuit}
          renderLabel={(s) => (
            <Text
              style={[
                pillStyles.pillText,
                {
                  color: suit === s ? C.white : suitColor(s),
                  fontSize: 18,
                },
              ]}
            >
              {suitSymbol(s)}
            </Text>
          )}
          colorFor={(s) => suitColor(s)}
          size="lg"
        />
      </View>

      {/* ── Declarer ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Declarer</Text>
        <PillRow
          options={SEATS}
          selected={declarer}
          onSelect={setDeclarer}
          colorFor={seatColor}
          size="lg"
        />
      </View>

      {/* ── Doubled ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Doubled</Text>
        <PillRow
          options={['none', 'doubled', 'redoubled'] as Doubled[]}
          selected={doubled}
          onSelect={setDoubled}
          renderLabel={(d) => (
            <Text
              style={[
                pillStyles.pillText,
                {
                  color: doubled === d ? C.white : C.black,
                  fontSize: 13,
                },
              ]}
            >
              {d === 'none' ? 'None' : d === 'doubled' ? 'X' : 'XX'}
            </Text>
          )}
          colorFor={() => '#5d4037'}
          size="md"
        />
      </View>

      {/* ── Result ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Result</Text>
        <View style={styles.resultRow}>
          {/* Made / Down toggle */}
          <View style={styles.madeDownRow}>
            <TouchableOpacity
              style={[
                styles.madeDownBtn,
                madeOrDown === 'made' && styles.madeDownBtnActive,
              ]}
              onPress={() => setMadeOrDown('made')}
            >
              <Text
                style={[
                  styles.madeDownText,
                  madeOrDown === 'made' && styles.madeDownTextActive,
                ]}
              >
                Made
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.madeDownBtn,
                madeOrDown === 'down' && { ...styles.madeDownBtnActive, backgroundColor: '#c62828' },
              ]}
              onPress={() => setMadeOrDown('down')}
            >
              <Text
                style={[
                  styles.madeDownText,
                  madeOrDown === 'down' && styles.madeDownTextActive,
                ]}
              >
                Down
              </Text>
            </TouchableOpacity>
          </View>

          {/* +/- stepper */}
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                if (madeOrDown === 'made') setOvertricks(Math.max(0, overtricks - 1));
                else setUndertricks(Math.max(1, undertricks - 1));
              }}
            >
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.stepperValue}>
              <Text style={styles.stepperValueText}>
                {madeOrDown === 'made'
                  ? overtricks === 0
                    ? 'made'
                    : `+${overtricks}`
                  : `−${undertricks}`}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => {
                if (madeOrDown === 'made')
                  setOvertricks(Math.min(maxOver, overtricks + 1));
                else setUndertricks(Math.min(maxUnder, undertricks + 1));
              }}
            >
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Honours ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.label}>Honours</Text>
        <PillRow
          options={['none', '100NS', '100EW', '150NS', '150EW']}
          selected={honours}
          onSelect={setHonours}
          renderLabel={(h) => (
            <Text
              style={[
                pillStyles.pillText,
                {
                  color:
                    honours === h
                      ? C.white
                      : h.includes('NS')
                      ? C.ns
                      : h === 'none'
                      ? C.black
                      : C.ew,
                  fontSize: 12,
                },
              ]}
            >
              {h === 'none'
                ? 'None'
                : `${h.startsWith('100') ? '100' : '150'} ${
                    h.endsWith('NS') ? 'NS' : 'EW'
                  }`}
            </Text>
          )}
          colorFor={(h) =>
            h === 'none' ? C.subtle : h.endsWith('NS') ? C.ns : C.ew
          }
          size="sm"
        />
        <Text style={styles.hint}>
          100 = 4 top honours in one hand · 150 = all 5 (or 4 aces in NT)
        </Text>
      </View>

      {/* ── Score preview ────────────────────────────────── */}
      <ScorePreview
        contract={contract}
        result={result}
        doubled={doubled}
        honours={honoursValue}
        vulnerable={vulnerable}
      />

      {/* ── Submit ───────────────────────────────────────── */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
        <Text style={styles.submitBtnText}>Record Hand</Text>
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
  section: {
    marginBottom: 16,
  },
  label: {
    color: '#c8e6c9',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  hint: {
    color: '#a5d6a7',
    fontSize: 11,
    marginTop: 4,
  },

  // Result controls
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  madeDownRow: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#43a047',
  },
  madeDownBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#1b5e20',
  },
  madeDownBtnActive: {
    backgroundColor: '#43a047',
  },
  madeDownText: {
    color: '#a5d6a7',
    fontSize: 14,
    fontWeight: '600',
  },
  madeDownTextActive: {
    color: C.white,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#43a047',
  },
  stepperBtn: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  stepperBtnText: {
    color: C.white,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '300',
  },
  stepperValue: {
    width: 72,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1b5e20',
  },
  stepperValueText: {
    color: C.white,
    fontSize: 17,
    fontWeight: '700',
  },

  // Submit
  submitBtn: {
    backgroundColor: '#43a047',
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
});
