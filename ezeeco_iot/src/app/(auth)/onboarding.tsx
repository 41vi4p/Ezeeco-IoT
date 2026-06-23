import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Cpu, Shield, BarChart2, ArrowRight, CheckCircle } from 'lucide-react-native';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: Cpu,
    title: 'Control Your Devices',
    description: 'Manage all your IoT devices from one place. Toggle, schedule, and monitor in real-time.',
    color: '#6366F1',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and protected. Control who has access to your devices and rooms.',
    color: '#10B981',
  },
  {
    icon: BarChart2,
    title: 'Smart Insights',
    description: 'Get detailed reports on energy usage, device activity, and automation logs.',
    color: '#F59E0B',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { darkMode } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const darkGrad: [string, string, string] = ['#2D2D2D', '#333333', '#2D2D2D'];
  const lightGrad: [string, string, string] = ['#F0F4FF', '#E8F0FE', '#F0F4FF'];
  const gradientColors = darkMode ? darkGrad : lightGrad;
  const textColor = darkMode ? '#F9FAFB' : '#111827';
  const subtextColor = darkMode ? '#9CA3AF' : '#6B7280';

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      const next = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
      setCurrentIndex(next);
    } else {
      router.replace('/(tabs)');
    }
  };

  const skip = () => router.replace('/(tabs)');

  return (
    <LinearGradient colors={gradientColors} style={styles.container}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      <TouchableOpacity onPress={skip} style={styles.skipBtn}>
        <Text style={[styles.skipText, { color: subtextColor }]}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      >
        {slides.map((slide, i) => {
          const Icon = slide.icon;
          return (
            <View key={i} style={[styles.slide, { width }]}>
              <View style={[styles.iconCircle, { backgroundColor: `${slide.color}20`, borderColor: `${slide.color}40` }]}>
                <Icon size={64} color={slide.color} strokeWidth={1.5} />
              </View>
              <Text style={[styles.slideTitle, { color: textColor }]}>{slide.title}</Text>
              <Text style={[styles.slideDesc, { color: subtextColor }]}>{slide.description}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, {
              backgroundColor: i === currentIndex ? '#6366F1' : (darkMode ? '#374151' : '#D1D5DB'),
              width: i === currentIndex ? 24 : 8,
            }]}
          />
        ))}
      </View>

      {/* Next / Done */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={goNext} activeOpacity={0.85} style={styles.nextBtnWrap}>
          <LinearGradient colors={['#6366F1', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
            {currentIndex === slides.length - 1 ? (
              <>
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.nextBtnText}>Get Started</Text>
              </>
            ) : (
              <>
                <Text style={styles.nextBtnText}>Next</Text>
                <ArrowRight size={20} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10 },
  skipText: { fontSize: 15, fontWeight: '600' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 80 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 40, borderWidth: 1 },
  slideTitle: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  slideDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 48 },
  nextBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  nextBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
