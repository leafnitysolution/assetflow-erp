import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreHorizontal, Send } from 'lucide-react-native';
import { ticketsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open:           { bg: '#00bc7d', text: '#09090b' },
  'in-progress':  { bg: '#00bc7d', text: '#09090b' },
  resolved:       { bg: '#00bc7d', text: '#09090b' },
  closed:         { bg: '#3f3f46', text: '#a1a1a1' },
  assigned:       { bg: '#3b82f6', text: '#fafafa' },
};

const PRIORITY_COLOR: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#ff2056', text: '#09090b' },
  high:   { bg: '#ff2056', text: '#09090b' },
  medium: { bg: '#fe9a00', text: '#09090b' },
  low:    { bg: '#00bc7d', text: '#09090b' },
};

const AVATAR_COLORS = ['#262626', '#1d4ed8', '#00bc7d', '#ad46ff', '#fe9a00'];

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await ticketsApi.getById(id!);
        setTicket(data);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load ticket');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const sendComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const updated = await ticketsApi.addComment(id!, comment.trim());
      setTicket(updated);
      setComment('');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send comment');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#00bc7d" /></View>;
  }

  if (!ticket) return null;

  const st = STATUS_COLOR[ticket.status] ?? STATUS_COLOR.open;
  const pr = PRIORITY_COLOR[ticket.priority] ?? PRIORITY_COLOR.medium;
  const ticketNumber = ticket.ticketNumber || `#TKT-${ticket.id?.slice(0, 4)}`;

  const metaFields = [
    { label: 'Assigned To', value: ticket.assignedToName || 'Unassigned', initials: ticket.assignedToName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '?' },
    { label: 'Created By', value: ticket.createdByName || '—' },
    { label: 'Branch', value: ticket.branch || '—' },
    { label: 'Asset', value: ticket.assetName || 'None' },
    { label: 'Created', value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
    { label: 'Due Date', value: ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—' },
  ];

  const renderMetaCell = (f: any, i: number) => (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{f.label}</Text>
      {f.initials ? (
        <View style={styles.metaUserRow}>
          <View style={[styles.metaAvatar, { backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length] }]}>
            <Text style={styles.metaAvatarText}>{f.initials}</Text>
          </View>
          <Text style={styles.metaValue} numberOfLines={1}>{f.value}</Text>
        </View>
      ) : (
        <Text style={styles.metaValue} numberOfLines={1}>{f.value}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#fafafa" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Ticket Detail</Text>
        <TouchableOpacity style={styles.navBtn}>
          <MoreHorizontal size={20} color="#fafafa" />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <View style={styles.mainCardLeft}>
              <Text style={styles.mainTitle}>{ticket.title}</Text>
              <Text style={styles.mainCode}>{ticketNumber}</Text>
            </View>
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: st.bg }]}>
                <Text style={[styles.badgeText, { color: st.text }]}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1).replace('-', ' ')}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: pr.bg }]}>
                <Text style={[styles.badgeText, { color: pr.text }]}>
                  {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)} Priority
                </Text>
              </View>
            </View>
          </View>

          {/* Meta Grid */}
          <View style={styles.metaGrid}>
            <View style={styles.metaRow}>
              {renderMetaCell(metaFields[0], 0)}
              {renderMetaCell(metaFields[1], 1)}
            </View>
            <View style={styles.metaRow}>
              {renderMetaCell(metaFields[2], 2)}
              {renderMetaCell(metaFields[3], 3)}
            </View>
            <View style={styles.metaRow}>
              {renderMetaCell(metaFields[4], 4)}
              {renderMetaCell(metaFields[5], 5)}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{ticket.description || 'No description provided.'}</Text>
          </View>
        </View>

        {/* Attachments Gallery */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <View style={styles.attachmentsRow}>
              {ticket.attachments.map((url: string, index: number) => (
                <View key={index} style={styles.attachmentWrapper}>
                  <Image source={{ uri: url }} style={styles.attachmentImg} resizeMode="cover" />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Comments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Activity and Comments</Text>
            <Text style={styles.commentsCount}>{ticket.comments?.length ?? 0} updates</Text>
          </View>
          <View style={styles.commentsCard}>
            {(ticket.comments ?? []).map((c: any, i: number) => {
              const initials = c.userName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
              const bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <View key={c.id || i}>
                  <View style={styles.commentRow}>
                    <View style={[styles.commentAvatar, { backgroundColor: bg }]}>
                      <Text style={styles.commentAvatarText}>{initials}</Text>
                    </View>
                    <View style={styles.commentBody}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentName}>{c.userName}</Text>
                        <Text style={styles.commentTime}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                  </View>
                  {i < (ticket.comments?.length ?? 0) - 1 && <View style={styles.commentDivider} />}
                </View>
              );
            })}
            {(!ticket.comments || ticket.comments.length === 0) && (
              <Text style={styles.noComments}>No comments yet.</Text>
            )}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment…"
          placeholderTextColor="#525252"
          value={comment}
          onChangeText={setComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !comment.trim() && styles.sendBtnDisabled]}
          onPress={sendComment}
          disabled={!comment.trim() || sending}
        >
          {sending ? <ActivityIndicator size="small" color="#09090b" /> : <Send size={16} color="#09090b" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09090b' },
  center: { flex: 1, backgroundColor: '#09090b', justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#262626', justifyContent: 'center', alignItems: 'center' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#fafafa', letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingBottom: 20 },

  mainCard: { backgroundColor: '#171717', borderRadius: 24, padding: 20, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: 16 },
  mainCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  mainCardLeft: { flex: 1, gap: 4 },
  mainTitle: { fontSize: 22, fontWeight: '800', color: '#fafafa', letterSpacing: -0.4 },
  mainCode: { fontSize: 14, fontWeight: '600', color: '#00bc7d' },
  badges: { gap: 6, alignItems: 'flex-end' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  metaGrid: { gap: 10 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaCell: { flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, gap: 6 },
  metaLabel: { fontSize: 11, fontWeight: '600', color: '#a1a1a1' },
  metaUserRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaAvatar: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  metaAvatarText: { fontSize: 11, fontWeight: '700', color: '#fafafa' },
  metaValue: { fontSize: 13, fontWeight: '600', color: '#fafafa', flex: 1 },

  attachmentsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  attachmentWrapper: { width: 100, height: 100, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  attachmentImg: { width: '100%', height: '100%' },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fafafa', marginBottom: 10 },
  commentsCount: { fontSize: 13, fontWeight: '600', color: '#00bc7d' },

  descCard: { backgroundColor: '#171717', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  descText: { fontSize: 14, color: '#a1a1a1', lineHeight: 22 },

  commentsCard: { backgroundColor: '#171717', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  commentRow: { flexDirection: 'row', gap: 12, paddingVertical: 6 },
  commentAvatar: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  commentAvatarText: { fontSize: 13, fontWeight: '700', color: '#fafafa' },
  commentBody: { flex: 1, gap: 4 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentName: { fontSize: 14, fontWeight: '600', color: '#fafafa' },
  commentTime: { fontSize: 11, color: '#a1a1a1' },
  commentText: { fontSize: 13, color: '#a1a1a1', lineHeight: 20 },
  commentDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 8 },
  noComments: { textAlign: 'center', color: '#525252', paddingVertical: 16, fontSize: 14 },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#171717',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: { flex: 1, backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#fafafa', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#00bc7d', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
