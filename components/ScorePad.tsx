import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ComputedRubberState, GameSegment } from '../utils/scoring';
import { HandRow } from './HandRow';

const C = {
  bg: '#0f1117',
  surface: '#1a1d27',
  border: '#2d3148',
  text: '#ffffff',
  subtext: '#6b7280',
  accent: '#22c55e',
  ns: '#60a5fa',
  ew: '#f87171',
  vul: '#ef4444',
  sectionBg: '#12151f',
  lineBg: '#1a2e1a',
};

interface Props {
  state: ComputedRubberState;
}

function VulDot() {
  return <View style={styles.vulDot} />;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{children}</Text>
    </View>
  );
}

function ScoreSubtotalRow({
  label,
  ns,
  ew,
}: {
  label: string;
  ns: number;
  ew: number;
}) {
  if (ns === 0 && ew === 0) return null;
  return (
    <View style={styles.subtotalRow}>
      <Text style={styles.subtotalLabel}>{label}</Text>
      <View style={styles.nsCell}>
        <Text style={[styles.subtotalValue, { color: C.ns }]}>
          {ns > 0 ? String(ns) : ''}
        </Text>
      </View>
      <View style={styles.colDivider} />
      <View style={styles.ewCell}>
        <Text style={[styles.subtotalValue, { color: C.ew }]}>
          {ew > 0 ? String(ew) : ''}
        </Text>
      </View>
    </View>
  );
}

export function ScorePad({ state }: Props) {
  const {
    hands,
    nsVul,
    ewVul,
    nsCurrentBelow,
    ewCurrentBelow,
    nsTotalAbove,
    ewTotalAbove,
    nsTotal,
    ewTotal,
    gameSegments,
  } = state;

  const aboveHands = hands.filter(
    (h) => h.scores.nsAbove > 0 || h.scores.ewAbove > 0,
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Column header with side labels + vul indicators ── */}
      <View style={styles.colHeaderRow}>
        <View style={styles.labelColHeader} />
        <View style={styles.nsColHeader}>
          <View style={styles.sideHeaderInner}>
            {nsVul && <VulDot />}
            <Text style={[styles.sideLabel, { color: C.ns }]}>NS</Text>
          </View>
        </View>
        <View style={styles.colDivider} />
        <View style={styles.ewColHeader}>
          <View style={styles.sideHeaderInner}>
            {ewVul && <VulDot />}
            <Text style={[styles.sideLabel, { color: C.ew }]}>EW</Text>
          </View>
        </View>
      </View>

      {/* ── ABOVE THE LINE ── */}
      <SectionHeader>ABOVE THE LINE</SectionHeader>

      {aboveHands.length === 0 ? (
        <View style={styles.emptyRow}>
          <Text style={styles.emptyText}>–</Text>
        </View>
      ) : (
        aboveHands.map((hand) => (
          <HandRow
            key={`above-${hand.id}`}
            hand={hand}
            nsValue={hand.scores.nsAbove}
            ewValue={hand.scores.ewAbove}
          />
        ))
      )}

      <ScoreSubtotalRow label="above" ns={nsTotalAbove} ew={ewTotalAbove} />

      {/* ── THE LINE ── */}
      <View style={styles.theLine}>
        <View style={styles.theLineBar} />
        <Text style={styles.theLineText}>THE LINE</Text>
        <View style={styles.theLineBar} />
      </View>

      {/* ── BELOW THE LINE — per game segment ── */}
      {gameSegments.map((seg: GameSegment) => {
        const segHands = hands.slice(
          seg.startIdx,
          seg.endIdx >= seg.startIdx ? seg.endIdx + 1 : seg.startIdx,
        );
        const belowHands = segHands.filter(
          (h) => h.scores.nsBelow > 0 || h.scores.ewBelow > 0,
        );
        const isCurrentGame = !seg.winner;

        return (
          <View key={`seg-${seg.gameNumber}`}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>
                {seg.winner
                  ? `GAME ${seg.gameNumber} — ${seg.winner} WON`
                  : `GAME ${seg.gameNumber}`}
              </Text>
              {seg.winner && (
                <View
                  style={[
                    styles.winnerBadge,
                    {
                      backgroundColor:
                        seg.winner === 'NS' ? '#1e3a5f' : '#3f1515',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.winnerBadgeText,
                      { color: seg.winner === 'NS' ? C.ns : C.ew },
                    ]}
                  >
                    {seg.winner}
                  </Text>
                </View>
              )}
            </View>

            {belowHands.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>–</Text>
              </View>
            ) : (
              belowHands.map((hand) => (
                <HandRow
                  key={`below-${hand.id}`}
                  hand={hand}
                  nsValue={hand.scores.nsBelow}
                  ewValue={hand.scores.ewBelow}
                />
              ))
            )}

            {isCurrentGame && (nsCurrentBelow > 0 || ewCurrentBelow > 0) && (
              <ScoreSubtotalRow
                label="running"
                ns={nsCurrentBelow}
                ew={ewCurrentBelow}
              />
            )}

            {seg.winner && (
              <View
                style={[
                  styles.gameLine,
                  {
                    borderBottomColor:
                      seg.winner === 'NS' ? C.ns : C.ew,
                  },
                ]}
              />
            )}
          </View>
        );
      })}

      {/* ── GRAND TOTALS ── */}
      <View style={styles.totalsRow}>
        <View style={styles.totalsLabel}>
          <Text style={styles.totalsTitleText}>TOTAL</Text>
        </View>
        <View style={styles.nsCell}>
          <Text style={[styles.totalsValue, { color: C.ns }]}>{nsTotal}</Text>
        </View>
        <View style={styles.colDivider} />
        <View style={styles.ewCell}>
          <Text style={[styles.totalsValue, { color: C.ew }]}>{ewTotal}</Text>
        </View>
      </View>

      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: 0, paddingBottom: 20 },

  // Column header
  colHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12151f',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  labelColHeader: { flex: 2, paddingLeft: 10 },
  nsColHeader: { flex: 1, alignItems: 'center' },
  ewColHeader: { flex: 1, alignItems: 'center' },
  sideHeaderInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sideLabel: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  vulDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.vul,
  },

  // Column divider
  colDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: C.border,
  },

  // NS / EW cells (shared)
  nsCell: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  ewCell: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.sectionBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  sectionHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.subtext,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  winnerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  winnerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Empty placeholder
  emptyRow: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: '#374151',
    fontSize: 16,
  },

  // THE LINE
  theLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: C.lineBg,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: C.accent,
  },
  theLineBar: {
    flex: 1,
    height: 1,
    backgroundColor: C.accent,
    opacity: 0.4,
  },
  theLineText: {
    color: C.accent,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginHorizontal: 10,
  },

  // Subtotal / running total row
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#12151f',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },
  subtotalLabel: {
    flex: 2,
    fontSize: 10,
    color: '#4b5563',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  subtotalValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Game completed double-line
  gameLine: {
    borderBottomWidth: 3,
    borderBottomColor: C.ns,
    marginHorizontal: 10,
    marginVertical: 2,
  },

  // Grand totals
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#12151f',
    borderTopWidth: 2,
    borderTopColor: C.accent,
    marginTop: 4,
  },
  totalsLabel: {
    flex: 2,
  },
  totalsTitleText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.subtext,
    letterSpacing: 2,
  },
  totalsValue: {
    fontSize: 26,
    fontWeight: '800',
  },
});
