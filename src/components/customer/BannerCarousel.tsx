import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import { Banner } from '../../db/types';

interface Props {
  banners: Banner[];
}

export function BannerCarousel({ banners }: Props) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((i) => {
        const next = (i + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (width - Spacing.xl * 2), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(t);
  }, [banners.length, width]);

  if (!banners.length) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          setIndex(Math.round(e.nativeEvent.contentOffset.x / (width - Spacing.xl * 2)));
        }}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg }}
      >
        {banners.map((b) => (
          <View
            key={b.id}
            style={[
              styles.slide,
              { backgroundColor: b.color, width: width - Spacing.xl * 2, marginRight: 0 },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{b.title}</Text>
              <Text style={styles.subtitle}>{b.subtitle}</Text>
            </View>
            <View style={styles.emojiBox}>
              <Text style={{ fontSize: 56 }}>{b.image}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    height: 140,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: { color: Colors.white, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '500' },
  emojiBox: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gray300, marginHorizontal: 3 },
  dotActive: { backgroundColor: Colors.primary, width: 18 },
});
