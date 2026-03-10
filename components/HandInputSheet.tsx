import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Contract,
  Level,
  Suit,
  Seat,
  Doubled,
  Side,
  suitSymbol,
  suitIsRed,
} from '../utils/scoring';

const C = {
  bg: '#0f1117',
  surface: '#1a1d27',
  card: '#252a3e',
  border: '#2d3148',
  text: '#ffffff',
  subtext: '#6b7280',
  accent: '#22c55e',
  accentDim: '#1a2e1a',
  red: '#ef4444',
  selectedBg: '#1a2e1a',
  selectedBorder: '#22c55e',
};

const LEVELS: Level[] = [1, 2, 3, 4, 5, 6, 7];
const SUITS: Suit[] = ['C', 'D', 'H', 'S', 'NT'];
const SEATS: Seat[] = ['N', 'S', 'E', 'W'];
const DOUBLED_OPTIONS: { value: Doubled; label: string }[] = [
  { value: 'none', label: '—' },
  { value: 'doubled', label: 'X' },
  { value: 'redoubled', label: 'XX' },
];

type HonoursKey = 'none' | '100NS' | '100EW' | '150NS' | '150EW';
const HONOURS_OPTIONS: { key: HonoursKey; label: string }[] = [
  { key: 'none', label: '—' },
  { key: '100NS', label: '100 NS' },
  { key: '100EW', label: '100 EW' },
  { key: '150NS', label: '150 NS' },
  { key: '150EW', label: '150 EW' },
];

const SHEET_HEIGHT = 540;

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (
    contract: Contract,
    result: number,
    doubled: Doubled,
    honours?: { side: Side; value: 100 | 150 },
  ) => void;
}

function OptionBtn({
  label,
  selected,
  onPress,
  labelColor,
  wide,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  labelColor?: string;
  wide?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.optBtn,
        wide && styles.optBtnWide,
        selected && styles.optBtnSelected,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optBtnText,
          selected && styles.optBtnTextSelected,
          labelColor ? { color: selected ? labelColor : C.subtext } : {},
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RowLabel({ children }: { children: string }) {
  return <Text style={styles.rowLabel}>{children}</Text>;
}

export function HandInputSheet({ visible, onClose, onConfirm }: Props) {
  const [level, setLevel] = useState<Level>(1);
  const [suit, setSuit] = useState<Suit>('NT');
  const [declarer, setDeclarer] = useState<Seat>('N');
  const [madeOrDown, setMadeOrDown] = useState<'made' | 'down'>('made');
  const [overtricks, setOvertricks] = useState(0);
  const [undertricks, setUndertricks] = useState(1);
  const [doubled, setDoubled] = useState<Doubled>('none');
  const [honours, setHonours] = useState<HonoursKey>('none');

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const prevVisible = useRef(false);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 28,
        stiffness: 320,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  // Reset fields when sheet opens
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setLevel(1);
      setSuit('NT');
      setDeclarer('N');
      setMadeOrDown('made');
      setOvertricks(0);
      setUndertricks(1);
      setDoubled('none');
      setHonours('none');
    }
    prevVisible.current = visible;
  }, [visible]);

  const handleConfirm = () => {
    const result = madeOrDown === 'made' ? overtricks : -undertricks;
    let honoursData: { side: Side; value: 100 | 150 } | undefined;
    if (honours !== 'none') {
      const side: Side = honours.includes('NS') ? 'NS' : 'EW';
      const value = honours.startsWith('150') ? 150 : 100;
      honoursData = { side, value };
    }
    onConfirm({ level, suit, declarer }, result, doubled, honoursData);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Drag handle */}
          <View style={styles.handle} />
          <Text style={styles.title}>Enter Hand</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Level ── */}
            <RowLabel>Level</RowLabel>
            <View style={styles.optRow}>
              {LEVELS.map((l) => (
                <OptionBtn
                  key={l}
                  label={String(l)}
                  selected={level === l}
                  onPress={() => setLevel(l)}
                />
              ))}
            </View>

            {/* ── Suit ── */}
            <RowLabel>Suit</RowLabel>
            <View style={styles.optRow}>
              {SUITS.map((s) => (
                <OptionBtn
                  key={s}
                  label={suitSymbol(s)}
                  selected={suit === s}
                  onPress={() => setSuit(s)}
                  labelColor={suitIsRed(s) ? C.red : C.text}
                />
              ))}
            </View>

            {/* ── Declarer ── */}
            <RowLabel>Declarer</RowLabel>
            <View style={styles.optRow}>
              {SEATS.map((s) => (
                <OptionBtn
                  key={s}
                  label={s}
                  selected={declarer === s}
                  onPress={() => setDeclarer(s)}
                />
              ))}
            </View>

            {/* ── Result ── */}
            <RowLabel>Result</RowLabel>
            <View style={styles.resultRow}>
              <View style={styles.madeDownToggle}>
                <TouchableOpacity
                  style={[
                    styles.madeDownBtn,
                    madeOrDown === 'made' && styles.madeDownBtnActive,
                  ]}
                  onPress={() => setMadeOrDown('made')}
                >
                  <Text
                    style={[
                      styles.madeDownBtnText,
                      madeOrDown === 'made' && styles.madeDownBtnTextActive,
                    ]}
                  >
                    Made
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.madeDownBtn,
                    madeOrDown === 'down' && styles.madeDownBtnActiveDown,
                  ]}
                  onPress={() => setMadeOrDown('down')}
                >
                  <Text
                    style={[
                      styles.madeDownBtnText,
                      madeOrDown === 'down' && styles.madeDownBtnTextActiveDown,
                    ]}
                  >
                    Down
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.counter}>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => {
                    if (madeOrDown === 'made') {
                      setOvertricks(Math.max(0, overtricks - 1));
                    } else {
                      setUndertricks(Math.max(1, undertricks - 1));
                    }
                  }}
                >
                  <Text style={styles.counterBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.counterValue}>
                  {madeOrDown === 'made'
                    ? overtricks === 0
                      ? 'exact'
                      : `+${overtricks}`
                    : `−${undertricks}`}
                </Text>
                <TouchableOpacity
                  style={styles.counterBtn}
                  onPress={() => {
                    if (madeOrDown === 'made') {
                      setOvertricks(Math.min(7, overtricks + 1));
                    } else {
                      setUndertricks(Math.min(13, undertricks + 1));
                    }
                  }}
                >
                  <Text style={styles.counterBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Double ── */}
            <RowLabel>Double</RowLabel>
            <View style={styles.optRow}>
              {DOUBLED_OPTIONS.map((d) => (
                <OptionBtn
                  key={d.value}
                  label={d.label}
                  selected={doubled === d.value}
                  onPress={() => setDoubled(d.value)}
                />
              ))}
            </View>

            {/* ── Honours ── */}
            <RowLabel>Honours</RowLabel>
            <View style={styles.optRow}>
              {HONOURS_OPTIONS.map((h) => (
                <OptionBtn
                  key={h.key}
                  label={h.label}
                  selected={honours === h.key}
                  onPress={() => setHonours(h.key)}
                  wide
                />
              ))}
            </View>

            {/* ── Confirm ── */}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Add Hand</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: SHEET_HEIGHT,
    borderTopWidth: 1,
    borderColor: C.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    color: C.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },

  rowLabel: {
    color: C.subtext,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 12,
  },

  // Option buttons
  optRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optBtn: {
    flex: 1,
    minWidth: 40,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
  },
  optBtnWide: {
    minWidth: 56,
  },
  optBtnSelected: {
    backgroundColor: C.accentDim,
    borderColor: C.selectedBorder,
  },
  optBtnText: {
    color: C.subtext,
    fontSize: 14,
    fontWeight: '600',
  },
  optBtnTextSelected: {
    color: C.accent,
  },

  // Result row
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  madeDownToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  madeDownBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: C.card,
  },
  madeDownBtnActive: {
    backgroundColor: C.accentDim,
  },
  madeDownBtnActiveDown: {
    backgroundColor: '#2e1515',
  },
  madeDownBtnText: {
    color: C.subtext,
    fontSize: 13,
    fontWeight: '600',
  },
  madeDownBtnTextActive: {
    color: C.accent,
  },
  madeDownBtnTextActiveDown: {
    color: C.red,
  },
  counter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  counterBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  counterBtnText: {
    color: C.text,
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 20,
  },
  counterValue: {
    flex: 1,
    textAlign: 'center',
    color: C.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // Confirm
  confirmBtn: {
    backgroundColor: C.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 18,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
