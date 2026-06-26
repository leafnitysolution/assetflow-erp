import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MessageSquare, Send, Check } from 'lucide-react-native';
import { ticketsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

export default function AdminTicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [ticket, setTicket] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadTicketData = async () => {
    try {
      const data = await ticketsApi.getById(id!);
      setTicket(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load ticket details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    setLoading(true);
    try {
      await ticketsApi.update(ticket.id, { status });
      Alert.alert('Success', `Ticket marked as ${status}.`);
      loadTicketData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update ticket status.');
      setLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await ticketsApi.addComment(ticket.id, newComment.trim());
      setNewComment('');
      loadTicketData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!ticket) return null;

  return (
    <View style={styles.root}>
      {/* Nav */}
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <ChevronLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.navTitle} numberOfLines={1}>Ticket #{ticket.ticketNumber || ticket.id?.slice(0, 4)}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ticket Header Card */}
        <View style={styles.ticketCard}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: ticket.status === 'resolved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: ticket.status === 'resolved' ? '#10b981' : '#ef4444' }]}>
                {ticket.status}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Text style={[styles.badgeText, { color: '#3b82f6' }]}>{ticket.priority} Priority</Text>
            </View>
          </View>
          <Text style={styles.ticketDesc}>{ticket.description}</Text>
        </View>

        {/* Status Transition Control */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transition Status</Text>
          <View style={styles.actionsRow}>
            {ticket.status === 'open' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => handleUpdateStatus('in-progress')}>
                <Text style={styles.actionBtnText}>Mark In Progress</Text>
              </TouchableOpacity>
            )}

            {ticket.status !== 'resolved' && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => handleUpdateStatus('resolved')}>
                <Check size={16} color="#0f172a" style={{ marginRight: 4 }} />
                <Text style={styles.actionBtnText}>Resolve Ticket</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Comment Thread Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity & Discussion</Text>
          <View style={styles.commentsList}>
            {ticket.comments && ticket.comments.length > 0 ? (
              ticket.comments.map((c: any, index: number) => {
                const isMe = c.userName === currentUser?.name;
                return (
                  <View key={c.id || index} style={[styles.commentBubble, isMe ? styles.commentBubbleMe : styles.commentBubbleOther]}>
                    <Text style={styles.commentUser}>{c.userName}</Text>
                    <Text style={styles.commentText}>{c.content}</Text>
                    <Text style={styles.commentTime}>
                      {new Date(c.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyComments}>
                <MessageSquare size={20} color="#64748b" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyCommentsText}>No activity logged. Type below to comment.</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Add update or resolution note..."
          placeholderTextColor="#64748b"
          value={newComment}
          onChangeText={setNewComment}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendComment} disabled={submittingComment}>
          {submittingComment ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <Send size={16} color="#0f172a" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  navTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.3 },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 20 },

  ticketCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' },
  ticketTitle: { fontSize: 20, fontWeight: '800', color: '#f8fafc', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  ticketDesc: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },

  section: {},
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 12, paddingLeft: 4 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14 },
  actionBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 14 },

  commentsList: { gap: 12 },
  commentBubble: { padding: 12, borderRadius: 16, maxWidth: '85%' },
  commentBubbleOther: { backgroundColor: '#1e293b', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#334155' },
  commentBubbleMe: { backgroundColor: '#10b981', alignSelf: 'flex-end' },
  commentUser: { fontSize: 11, fontWeight: '600', color: '#94a3b8', marginBottom: 4 },
  commentText: { fontSize: 14, color: '#f8fafc', lineHeight: 20 },
  commentTime: { fontSize: 9, color: '#64748b', alignSelf: 'flex-end', marginTop: 4 },

  emptyComments: { padding: 32, alignItems: 'center' },
  emptyCommentsText: { color: '#64748b', fontSize: 13, textAlign: 'center' },

  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center', gap: 12 },
  textInput: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 16, height: 44, color: '#f8fafc', borderWidth: 1, borderColor: '#334155' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
});
