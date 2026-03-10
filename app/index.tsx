import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRubber } from '../context/RubberContext';
import {
  computeRubberState,
  Contract,
  Doubled,
  Side,
  calcUnfinishedBonus,
} from '../utils/scoring';
import { ScorePad } from '../components/ScorePad';
import { HandInputSheet } from '../components/HandInputSheet';

const C = {
  bg: '#0f1117',
  surface: '#1a1d27',
  border: '#2d3148',
  text: '#ffffff',
  subtext: '#6b7280',
  accent: '#22c55e',
  accentDim: '#1a2e1a',
  danger: '#ef4444',
};

export default function IndexScreen() {
  const { state, addHand, undoLastHand, newRubber } = useRubber();
  const [sheetVisible, setSheetVisible] = useState(false);

  if (!state.loaded) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  const rubber = state.currentRubber;
  const rs = computeRubberState(
    rubber.hands,
    rubber.unfinishedNsBonus,
    rubber.unfinishedEwBonus,
  );

  const handleAddHand = (
    contract: Contract,
    result: number,
    doubled: Doubled,
    honours?: { side: Side; value: 100 | 150 },
  ) => {
    addHand(contract, result, doubled, honours);
    setSheetVisible(false);
  };

  const handleNewRubber = () => {
    if (rs.rubberComplete || rubber.hands.length === 0) {
      newRubber(false);
      return;
    }
    const bonus = calcUnfinishedBonus(rs);
    const bonusLines: string[] = [];
    if (bonus.nsBonus) bonusLines.push(`NS +${bonus.nsBonus}`);
    if (bonus.ewBonus) bonusLines.push(`EW +${bonus.ewBonus}`);
    const bonusText = bonusLines.length
      ? `\n\nUnfinished bonuses: ${bonusLines.join(', ')}`
      : '\n\nNo unfinished bonuses apply.';

    Alert.alert(
      'New Rubber',
      `End the current rubber and start a new one?${bonusText}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End & Award Bonuses', onPress: () => newRubber(true) },
        {
          text: 'Abandon (No Bonus)',
          style: 'destructive',
          onPress: () => newRubber(false),
        },
      ],
    );
  };

  const handleUndo = () => {
    if (rubber.hands.length === 0) return;
    Alert.alert('Undo', 'Remove the last hand?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: undoLastHand },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── App header ── */}
      <View style={styles.appHeader}>
        <Text style={styles.appTitle}>Rubber Bridge</Text>
        {rs.rubberComplete && rs.rubberWinner ? (
          <View style={styles.rubberCompleteChip}>
            <Text style={styles.rubberCompleteChipText}>Rubber Complete</Text>
          </View>
        ) : (
          <Text style={styles.gameStatus}>
            Game {Math.min(rs.nsGames + rs.ewGames + 1, 3)} of 3
          </Text>
        )}
      </View>

      {/* ── Rubber winner banner ── */}
      {rs.rubberComplete && rs.rubberWinner && (
        <View style={styles.winnerBanner}>
          <Text style={styles.winnerBannerTitle}>
            ★{' '}
            <Text
              style={{
                color: rs.rubberWinner === 'NS' ? '#60a5fa' : '#f87171',
              }}
            >
              {rs.rubberWinner}
            </Text>{' '}
            WIN THE RUBBER ★
          </Text>
          <Text style={styles.winnerBannerBonus}>
            +{rs.rubberBonus} rubber bonus
          </Text>
          <TouchableOpacity
            style={styles.newRubberBannerBtn}
            onPress={handleNewRubber}
            activeOpacity={0.85}
          >
            <Text style={styles.newRubberBannerBtnText}>Start New Rubber</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Scorepad ── */}
      <ScorePad state={rs} />

      {/* ── Bottom toolbar ── */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarBtn}
          onPress={handleUndo}
          activeOpacity={0.7}
        >
          <Text style={styles.toolbarBtnText}>Undo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolbarBtn, styles.newRubberBtn]}
          onPress={handleNewRubber}
          activeOpacity={0.7}
        >
          <Text style={[styles.toolbarBtnText, styles.newRubberBtnText]}>
            New Rubber
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── FAB: Add Hand ── */}
      {!rs.rubberComplete && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* ── Hand input bottom sheet ── */}
      <HandInputSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onConfirm={handleAddHand}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.bg,
  },
  loadingText: { color: C.text, fontSize: 16 },

  // App header
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: '#12151f',
  },
  appTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gameStatus: {
    color: C.subtext,
    fontSize: 13,
    fontWeight: '500',
  },
  rubberCompleteChip: {
    backgroundColor: '#1a2e1a',
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rubberCompleteChipText: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '700',
  },

  // Winner banner
  winnerBanner: {
    backgroundColor: '#1a2e1a',
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  winnerBannerTitle: {
    color: C.accent,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },
  winnerBannerBonus: {
    color: '#86efac',
    fontSize: 13,
  },
  newRubberBannerBtn: {
    marginTop: 10,
    backgroundColor: C.accent,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 10,
  },
  newRubberBannerBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#12151f',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  toolbarBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 9,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  toolbarBtnText: {
    color: C.text,
    fontSize: 13,
    fontWeight: '600',
  },
  newRubberBtn: {
    flex: 2,
    backgroundColor: C.accentDim,
    borderColor: C.accent,
  },
  newRubberBtnText: {
    color: C.accent,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 74,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  fabText: {
    color: '#000',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '300',
  },
});
