import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Coupon } from '../../db/types';

interface Props {
  coupon: Coupon;
  onApply?: () => void;
  applied?: boolean;
}

export function CouponCard({ coupon, onApply, applied }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.value}>
          {coupon.type === 'flat' ? `₹${coupon.value}` : `${coupon.value}%`}
        </Text>
        <Text style={styles.offLabel}>OFF</Text>
      </View>
      <View style={styles.divider}>
        <View style={[styles.dot, { top: -6 }]} />
        <View style={styles.dashedLine} />
        <View style={[styles.dot, { bottom: -6 }]} />
      </View>
      <View style={styles.right}>
        <Text style={styles.desc} numberOfLines={2}>{coupon.description}</Text>
        <View style={styles.row}>
          <View style={styles.codeBox}>
            <Text style={styles.code}>{coupon.code}</Text>
          </View>
          {onApply && (
            <Text onPress={onApply} style={[styles.apply, applied && { color: Colors.success }]}>
              {applied ? '✓ Applied' : 'Apply'}
            </Text>
          )}
        </View>
        <Text style={styles.minOrder}>Min order ₹{coupon.minOrder}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    minHeight: 110,
  },
  left: {
    width: 100,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  value: { color: Colors.white, fontSize: 26, fontWeight: '800' },
  offLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  divider: { width: 1, backgroundColor: Colors.border, position: 'relative' },
  dashedLine: { flex: 1, width: 1, backgroundColor: Colors.border, borderStyle: 'dashed' },
  dot: { position: 'absolute', left: -6, width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.gray50 },
  right: { flex: 1, padding: Spacing.md },
  desc: { ...Typography.bodyBold, color: Colors.text, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeBox: {
    backgroundColor: Colors.gray100,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
  },
  code: { color: Colors.primary, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 },
  apply: { color: Colors.primary, fontWeight: '700', fontSize: 13 },
  minOrder: { fontSize: 11, color: Colors.textSecondary, marginTop: Spacing.xs },
});
