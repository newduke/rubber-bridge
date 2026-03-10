import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HandEntry, contractLabel, resultLabel } from '../utils/scoring';

const C = {
  ns: '#60a5fa',
  ew: '#f87171',
  subtext: '#6b7280',
  divider: '#2d3148',
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
      <View style={styles.divider} />
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
    borderBottomColor: '#1e2235',
  },
  label: {
    flex: 2,
    fontSize: 11,
    color: C.subtext,
  },
  result: {
    fontSize: 11,
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
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: C.divider,
  },
});
