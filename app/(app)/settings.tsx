/**
 * WalkWithMe — Settings Screen
 *
 * Language, Voice, Dark Mode, and app info.
 *
 * Design intent: Clean, minimal, switches and toggles.
 * The user should be able to configure everything in under 30 seconds.
 */

import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, textStyles, spacing, borderRadius, shadow } from '@/theme';
import { useUserStore } from '@/store/useUserStore';
import { SUPPORTED_LANGUAGES, APP_NAME, APP_VERSION } from '@/constants';
import type { Language } from '@/types';

// ── Setting Row ───────────────────────────────────────────────────────────

interface SettingRowProps {
  icon: string;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
}

function SettingRow({ icon, label, sublabel, right, onPress, isLast }: SettingRowProps) {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      style={[styles.settingRow, !isLast && styles.settingRowBorder]}
      accessibilityRole={onPress ? 'button' : 'none'}
      accessibilityLabel={label}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconEmoji}>{icon}</Text>
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingLabel}>{label}</Text>
        {sublabel && <Text style={styles.settingSubLabel}>{sublabel}</Text>}
      </View>
      {right && <View style={styles.settingRight}>{right}</View>}
    </Wrapper>
  );
}

// ── Section ───────────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// ── Settings Screen ───────────────────────────────────────────────────────

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, updateLanguage, toggleVoice, toggleDarkMode } = useUserStore();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[colors.dark.background, colors.dark.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your experience</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Language */}
        <Section title="Language">
          {SUPPORTED_LANGUAGES.map((lang, index) => (
            <SettingRow
              key={lang.code}
              icon={
                lang.code === 'auto' ? '🌐' :
                lang.code === 'en' ? '🇬🇧' :
                lang.code === 'hi' ? '🇮🇳' : '🤝'
              }
              label={lang.label}
              sublabel={lang.nativeLabel !== lang.label ? lang.nativeLabel : undefined}
              isLast={index === SUPPORTED_LANGUAGES.length - 1}
              right={
                <View
                  style={[
                    styles.languageRadio,
                    profile.languagePreference === lang.code && styles.languageRadioActive,
                  ]}
                >
                  {profile.languagePreference === lang.code && (
                    <View style={styles.languageRadioDot} />
                  )}
                </View>
              }
              onPress={() => updateLanguage(lang.code as Language)}
            />
          ))}
        </Section>

        {/* Voice & Display */}
        <Section title="Voice & Display">
          <SettingRow
            icon="🔊"
            label="AI Voice"
            sublabel={profile.voiceEnabled ? 'AI speaks instructions aloud' : 'Silent mode'}
            right={
              <Switch
                value={profile.voiceEnabled}
                onValueChange={toggleVoice}
                trackColor={{ false: colors.dark.border, true: colors.primary }}
                thumbColor={profile.voiceEnabled ? '#FFFFFF' : colors.dark.textTertiary}
                accessibilityLabel="Toggle AI voice"
              />
            }
          />
          <SettingRow
            icon="🌙"
            label="Dark Mode"
            sublabel="Easier to read outdoors"
            isLast
            right={
              <Switch
                value={profile.darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: colors.dark.border, true: colors.primary }}
                thumbColor={profile.darkMode ? '#FFFFFF' : colors.dark.textTertiary}
                accessibilityLabel="Toggle dark mode"
              />
            }
          />
        </Section>

        {/* About */}
        <Section title="About">
          <SettingRow
            icon="🚶‍♀️"
            label={APP_NAME}
            sublabel={`Version ${APP_VERSION}`}
            isLast
          />
        </Section>

        {/* Mission card */}
        <View style={styles.missionCard}>
          <LinearGradient
            colors={['rgba(99,102,241,0.15)', 'rgba(139,92,246,0.08)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.missionIcon}>💜</Text>
          <Text style={styles.missionTitle}>Built with love</Text>
          <Text style={styles.missionText}>
            WalkWithMe was built for people who find navigation stressful.
            You're never alone. I'm always walking beside you.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },

  // ── Header ──────────────────────────────────────────────────────────────

  header: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },

  headerTitle: {
    ...textStyles.screenTitle,
    color: colors.dark.text,
    marginBottom: spacing[1],
  },

  headerSubtitle: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
  },

  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
  },

  // ── Section ──────────────────────────────────────────────────────────────

  section: {
    marginBottom: spacing[6],
  },

  sectionTitle: {
    ...textStyles.label,
    color: colors.dark.textTertiary,
    marginBottom: spacing[3],
    marginLeft: spacing[1],
  },

  sectionCard: {
    backgroundColor: colors.dark.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.dark.border,
    overflow: 'hidden',
    ...shadow.sm,
  },

  // ── Setting row ───────────────────────────────────────────────────────────

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },

  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.borderSubtle,
  },

  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  settingIconEmoji: { fontSize: 18 },

  settingText: {
    flex: 1,
  },

  settingLabel: {
    ...textStyles.bodyMedium,
    color: colors.dark.text,
  },

  settingSubLabel: {
    ...textStyles.caption,
    color: colors.dark.textSecondary,
    marginTop: 2,
  },

  settingRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Language radio ────────────────────────────────────────────────────────

  languageRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  languageRadioActive: {
    borderColor: colors.primary,
  },

  languageRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },

  // ── Mission card ──────────────────────────────────────────────────────────

  missionCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    overflow: 'hidden',
    marginTop: spacing[2],
  },

  missionIcon: {
    fontSize: 36,
    marginBottom: spacing[3],
  },

  missionTitle: {
    ...textStyles.sectionHeader,
    color: colors.dark.text,
    marginBottom: spacing[3],
  },

  missionText: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
