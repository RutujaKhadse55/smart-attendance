
// screens/auth/LoginScreen.tsx
import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { lightTheme } from '../../theme/light';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!username.trim()) {
      return Alert.alert('Validation Error', 'Please enter your username');
    }
    if (!password) {
      return Alert.alert('Validation Error', 'Please enter your password');
    }

    try {
      setLoading(true);
      const ok = await login(username.trim(), password);
      setLoading(false);
      
      if (!ok) {
        Alert.alert(
          'Login Failed', 
          'Invalid username or password. Please check your credentials and try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'An error occurred during login. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="finger-print" size={48} color="#fff" />
            </View>
          </View>
          <Text style={styles.title}>Smart Attendance</Text>
          <Text style={styles.subtitle}>Welcome back! Please login to continue</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          {/* Username Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="person-outline" 
                size={20} 
                color={s.colors.subtext} 
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter your username"
                placeholderTextColor={s.colors.subtext}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons 
                name="lock-closed-outline" 
                size={20} 
                color={s.colors.subtext} 
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor={s.colors.subtext}
                editable={!loading}
              />
              <Pressable 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={s.colors.subtext}
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={s.colors.primary} />
          <Text style={styles.infoText}>
            Use your admin credentials to access the system
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Smart Attendance System v1.0</Text>
          <Text style={styles.footerSubtext}>Secure • Reliable • Efficient</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: s.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: s.spacing(3),
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: s.spacing(4),
  },
  logoContainer: {
    marginBottom: s.spacing(2),
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: s.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: s.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: s.colors.text,
    marginBottom: s.spacing(1),
  },
  subtitle: {
    fontSize: 14,
    color: s.colors.subtext,
    textAlign: 'center',
  },
  card: { 
    backgroundColor: s.colors.card, 
    borderRadius: s.radius.lg, 
    padding: s.spacing(3),
    shadowColor: s.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: s.spacing(2),
  },
  inputContainer: {
    marginBottom: s.spacing(2.5),
  },
  label: { 
    color: s.colors.text,
    fontWeight: '600',
    marginBottom: s.spacing(1),
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: s.colors.border,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.background,
    paddingHorizontal: s.spacing(1.5),
  },
  inputIcon: {
    marginRight: s.spacing(1),
  },
  input: { 
    flex: 1,
    padding: s.spacing(1.5),
    fontSize: 15,
    color: s.colors.text,
  },
  passwordInput: {
    paddingRight: s.spacing(5),
  },
  eyeIcon: {
    position: 'absolute',
    right: s.spacing(1.5),
    padding: s.spacing(1),
  },
  button: { 
    backgroundColor: s.colors.primary,
    borderRadius: s.radius.md,
    padding: s.spacing(2.5),
    marginTop: s.spacing(2),
    shadowColor: s.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
  },
  buttonText: { 
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: s.colors.primary + '15',
    padding: s.spacing(2),
    borderRadius: s.radius.md,
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: s.colors.text,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: s.spacing(3),
  },
  footerText: {
    fontSize: 12,
    color: s.colors.subtext,
    fontWeight: '500',
  },
  footerSubtext: {
    fontSize: 11,
    color: s.colors.subtext,
    marginTop: s.spacing(0.5),
    opacity: 0.7,
  },
});