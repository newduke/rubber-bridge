import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRubber } from '../context/RubberContext';
import {
  computeRubberState,
  RubberData,
  contractLabel,
  resultLabel,
  suitIsRed,
} from '../utils/scoring';

const C = {
  felt: '#fdfbf7',
  card: '#ffffff',
  ns: '#2563eb',
  ew: '#dc2626',
  black: '#1f2937',
  subtle: '#64748b',
  white: '#ffffff',
  border: '#cbd5e1',
  gold: '#cbd5e1',
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function RubberCard({ rubber, index }: { rubber: RubberData; index: number }) {
  const rs = computeRubberState(
    rubber.hands,
    rubber.unfinishedNsBonus ?? 0,
    rubber.unfinishedEwBonus ?? 0,
  );

  const winner = rs.rubberWinner;
  const winnerLabel = winner
    ? `${winner} won`
    : rs.nsGames !== rs.ewGames
    ? `${rs.nsGames > rs.ewGames ? 'NS' : 'EW'} ahead (unfinished)`
    : 'Unfinished';

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <Text style={cardStyles.rubberNum}>Rubber #{index + 1}</Text>
        <Text style={cardStyles.date}>{formatDate(rubber.createdAt)}</Text>
      </View>

      {/* Score summary */}
      <View style={cardStyles.scoreRow}>
        <View style={cardStyles.scoreBlock}>
          <Text style={[cardStyles.scoreTeam, { color: C.ns }]}>NS</Text>
          <Text style={[cardStyles.scoreTotal, { color: C.ns }]}>{rs.nsTotal}</Text>
          <Text style={cardStyles.scoreDetail}>
            ▲ {rs.nsTotalAbove}  ▼ {rs.nsTotalBelow}
          </Text>
        </View>
        <View style={cardStyles.scoreSep}>
          <Text style={cardStyles.scoreSepText}>vs</Text>
        </View>
        <View style={cardStyles.scoreBlock}>
          <Text style={[cardStyles.scoreTeam, { color: C.ew }]}>EW</Text>
          <Text style={[cardStyles.scoreTotal, { color: C.ew }]}>{rs.ewTotal}</Text>
          <Text style={cardStyles.scoreDetail}>
            ▲ {rs.ewTotalAbove}  ▼ {rs.ewTotalBelow}
          </Text>
        </View>
      </View>

      {/* Winner / status */}
      <View
        style={[
          cardStyles.statusBadge,
          {
            backgroundColor: winner
              ? winner === 'NS'
                ? '#e3f2fd'
                : '#ffebee'
              : '#f5f5f5',
          },
        ]}
      >
        <Text
          style={[
            cardStyles.statusText,
            {
              color: winner === 'NS' ? C.ns : winner === 'EW' ? C.ew : C.subtle,
            },
          ]}
        >
          {winnerLabel}
          {rs.rubberBonus ? ` (+${rs.rubberBonus} rubber bonus)` : ''}
        </Text>
        <Text style={cardStyles.statusGames}>
          Games: NS {rs.nsGames} — EW {rs.ewGames}
        </Text>
      </View>

      {/* Hand log */}
      {rubber.hands.length > 0 && (
        <View style={cardStyles.handLog}>
          <Text style={cardStyles.handLogTitle}>Hands played: {rubber.hands.length}</Text>
          {rubber.hands.map((hand) => {
            const side = hand.contract.declarer === 'N' || hand.contract.declarer === 'S' ? 'NS' : 'EW';
            const color = side === 'NS' ? C.ns : C.ew;
            const label = contractLabel(hand.contract, hand.doubled);
            const res = resultLabel(hand.result);
            const nsScore = hand.scores.nsAbove + hand.scores.nsBelow;
            const ewScore = hand.scores.ewAbove + hand.scores.ewBelow;
            return (
              <View key={hand.id} style={cardStyles.handRow}>
                <Text style={[cardStyles.handLabel, { color }]}>{label}</Text>
                <Text style={cardStyles.handResult}>{res}</Text>
                <Text style={[cardStyles.handNS, { color: C.ns }]}>
                  {nsScore > 0 ? `NS+${nsScore}` : ''}
                </Text>
                <Text style={[cardStyles.handEW, { color: C.ew }]}>
                  {ewScore > 0 ? `EW+${ewScore}` : ''}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: C.card,
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.gold,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rubberNum: {
    fontSize: 14,
    fontWeight: '700',
    color: C.black,
  },
  date: {
    fontSize: 11,
    color: C.subtle,
  },
  scoreRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
  },
  scoreTeam: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  scoreTotal: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 2,
  },
  scoreDetail: {
    fontSize: 11,
    color: C.subtle,
  },
  scoreSep: {
    paddingHorizontal: 12,
  },
  scoreSepText: {
    fontSize: 13,
    color: C.subtle,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusGames: {
    fontSize: 11,
    color: C.subtle,
    marginTop: 1,
  },
  handLog: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  handLogTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: C.subtle,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  handRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: 8,
  },
  handLabel: {
    fontSize: 12,
    fontWeight: '600',
    width: 90,
  },
  handResult: {
    fontSize: 12,
    color: C.subtle,
    width: 40,
  },
  handNS: {
    fontSize: 12,
    flex: 1,
  },
  handEW: {
    fontSize: 12,
    flex: 1,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const { state } = useRubber();
  const history = state.history;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Completed rubbers will appear here.
          </Text>
        </View>
      ) : (
        history.map((rubber, i) => (
          <RubberCard key={rubber.id} rubber={rubber} index={history.length - 1 - i} />
        ))
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.felt,
  },
  content: {
    padding: 14,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
  },
});
