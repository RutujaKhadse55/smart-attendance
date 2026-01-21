// screens/admin/DashboardScreen.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl } from 'react-native';
import Card from '../../components/Card';
import { lightTheme } from '../../theme/light';
import dayjs from 'dayjs';
import { getAttendanceSummaryByDate } from '../../db/queries';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';

export default function DashboardScreen() {
  const s = lightTheme;
  const { user, logout } = useContext(AuthContext);
  const [date, setDate] = useState(new Date());
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0 });
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = dayjs(date).format('YYYY-MM-DD');
      const res = await getAttendanceSummaryByDate(d, user?.id, user?.role);
      
      setSummary({
        total: res.total || 0,
        present: res.present || 0,
        absent: res.absent || 0
      });
    } catch (error) {
      console.error('Error loading attendance summary:', error);
      Alert.alert('Error', 'Failed to load attendance data');
      setSummary({ total: 0, present: 0, absent: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    load(); 
  }, [date]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => await logout()
        },
      ]
    );
  };

  const percent = summary.total ? Math.round((summary.present / summary.total) * 100) : 0;
  const isToday = dayjs(date).isSame(dayjs(), 'day');

  const navigateDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setDate(newDate);
  };

  return (
    <View style={{ flex: 1, backgroundColor: s.colors.background }}>
      {/* Top Bar with Logo and Logout */}
      <View style={styles.topBar}>
        <View style={styles.userSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="finger-print" size={28} color={s.colors.primary} />
          </View>
          <View>
            <Text style={styles.appTitle}>Smart Attendance</Text>
            <Text style={styles.userInfo}>{user?.username} • {user?.role}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={s.colors.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[s.colors.primary]}
          />
        }
      >
        {/* Date Selector Card */}
        <Card style={styles.dateCard}>
          <View style={styles.dateHeader}>
            <View style={styles.dateInfo}>
              <Ionicons name="calendar" size={24} color={s.colors.primary} />
              <View>
                <Text style={styles.dateLabel}>Attendance Date</Text>
                <Text style={styles.dateText}>{dayjs(date).format('DD MMM YYYY')}</Text>
                {isToday && <Text style={styles.todayBadge}>Today</Text>}
              </View>
            </View>
          </View>

          <View style={styles.dateNavigation}>
            <Pressable style={styles.navButton} onPress={() => navigateDate(-1)}>
              <Ionicons name="chevron-back" size={20} color={s.colors.text} />
              <Text style={styles.navButtonText}>Previous</Text>
            </Pressable>
            
            <Pressable style={styles.todayButton} onPress={() => setDate(new Date())}>
              <Ionicons name="today" size={18} color={s.colors.primary} />
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
            
            <Pressable style={styles.navButton} onPress={() => navigateDate(1)}>
              <Text style={styles.navButtonText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color={s.colors.text} />
            </Pressable>
          </View>

          <Pressable style={styles.customDateButton} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={s.colors.primary} />
            <Text style={styles.customDateText}>Select Custom Date</Text>
          </Pressable>
        </Card>

        {/* Stats Cards Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="hourglass-outline" size={48} color={s.colors.primary} />
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <Card style={[styles.statCard, styles.totalCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="people" size={40} color={s.colors.primary} />
              </View>
              <Text style={styles.statNumber}>{summary.total}</Text>
              <Text style={styles.statLabel}>Total Students</Text>
            </Card>

            <Card style={[styles.statCard, styles.presentCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={40} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{summary.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </Card>

            <Card style={[styles.statCard, styles.absentCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="close-circle" size={40} color={s.colors.danger} />
              </View>
              <Text style={styles.statNumber}>{summary.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </Card>

            <Card style={[styles.statCard, styles.percentCard]}>
              <View style={styles.statIcon}>
                <Ionicons name="analytics" size={40} color="#8B5CF6" />
              </View>
              <Text style={styles.statNumber}>{percent}%</Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </Card>
          </View>
        )}

        {/* No Data Message */}
        {!loading && summary.total === 0 && (
          <Card style={styles.noDataCard}>
            <Ionicons name="information-circle-outline" size={48} color={s.colors.subtext} />
            <Text style={styles.noDataTitle}>No Students Found</Text>
            <Text style={styles.noDataText}>Import students to get started with attendance tracking</Text>
          </Card>
        )}

        {showPicker && (
          <DateTimePicker 
            value={date} 
            mode="date" 
            onChange={(_, d) => { 
              setShowPicker(false); 
              if (d) setDate(d); 
            }} 
          />
        )}
      </ScrollView>
    </View>
  );
}

const s = lightTheme;
const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: s.colors.card,
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(2),
    paddingTop: s.spacing(6),
    borderBottomWidth: 1,
    borderBottomColor: s.colors.border,
    shadowColor: s.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: s.radius.md,
    backgroundColor: s.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: s.colors.text,
  },
  userInfo: {
    fontSize: 11,
    color: s.colors.subtext,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(0.75),
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(1.25),
    backgroundColor: s.colors.danger + '15',
    borderRadius: s.radius.md,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.danger,
  },
  container: { 
    flex: 1, 
    backgroundColor: s.colors.background,
  },
  dateCard: {
    margin: s.spacing(2),
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.spacing(2),
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.spacing(1.5),
  },
  dateLabel: {
    fontSize: 12,
    color: s.colors.subtext,
  },
  dateText: {
    fontSize: 20,
    fontWeight: '700',
    color: s.colors.text,
    marginTop: 2,
  },
  todayBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: s.colors.primary,
    backgroundColor: s.colors.primary + '20',
    paddingHorizontal: s.spacing(1),
    paddingVertical: 2,
    borderRadius: s.radius.sm,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  dateNavigation: {
    flexDirection: 'row',
    gap: s.spacing(1),
    marginBottom: s.spacing(1.5),
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(0.5),
    padding: s.spacing(1.5),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    borderWidth: 1,
    borderColor: s.colors.border,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: s.colors.text,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(0.5),
    paddingHorizontal: s.spacing(2),
    paddingVertical: s.spacing(1.5),
    backgroundColor: s.colors.primary + '15',
    borderRadius: s.radius.md,
    borderWidth: 1,
    borderColor: s.colors.primary + '40',
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: s.colors.primary,
  },
  customDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.spacing(1),
    padding: s.spacing(1.5),
    backgroundColor: s.colors.background,
    borderRadius: s.radius.md,
    borderWidth: 1,
    borderColor: s.colors.border,
  },
  customDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: s.colors.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: s.spacing(4),
    marginTop: s.spacing(4),
  },
  loadingText: {
    fontSize: 14,
    color: s.colors.subtext,
    marginTop: s.spacing(2),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: s.spacing(2),
    gap: s.spacing(1.5),
    marginBottom: s.spacing(2),
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    alignItems: 'center',
    padding: s.spacing(3),
  },
  totalCard: {
    borderLeftWidth: 4,
    borderLeftColor: s.colors.primary,
  },
  presentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  absentCard: {
    borderLeftWidth: 4,
    borderLeftColor: s.colors.danger,
  },
  percentCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  statIcon: {
    marginBottom: s.spacing(1.5),
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: s.colors.text,
    marginBottom: s.spacing(0.5),
  },
  statLabel: {
    fontSize: 13,
    color: s.colors.subtext,
    textAlign: 'center',
  },
  noDataCard: {
    margin: s.spacing(2),
    alignItems: 'center',
    padding: s.spacing(4),
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: s.colors.text,
    marginTop: s.spacing(2),
  },
  noDataText: {
    fontSize: 14,
    color: s.colors.subtext,
    textAlign: 'center',
    marginTop: s.spacing(1),
    lineHeight: 20,
  },
});