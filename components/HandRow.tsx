import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandEntry, contractLabel, resultLabel } from '../utils/scoring';

const C = {
  ns: '#2563eb',
  ew: '#dc2626',
  subtext: '#64748b',
  divider: '#cbd5e1',
};

interface HandRowProps {
  hand: HandEntry;
  nsValue: number;
  ewValue: number;
}

export function HandRow({ hand, nsValue, ewValue }: HandRowProps) {
  if (nsValue === 0 && ewValue === 0) return null;

  const label = contractLabel(hand.contract, hand.doubled);
  const res = resultLabel(hand.result);

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
        <Text style={styles.result}> ({res})</Text>
      </Text>
      <View style={styles.nsCell}>
        <Text style={[styles.value, { color: C.ns }]}>
          {nsValue > 0 ? String(nsValue) : ''}
        </Text>
      </View>
      <View style={styles.ewCell}>
        <Text style={[styles.value, { color: C.ew }]}>
          {ewValue > 0 ? String(ewValue) : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    flex: 2,
    fontSize: 14,
    color: C.subtext,
  },
  result: {
    fontSize: 14,
    color: C.subtext,
  },
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
  value: {
    fontSize: 19,
    fontWeight: '600',
  },
});
