import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { InstagramEmbedWebView } from '../components/InstagramEmbedWebView'
import type { IEvent } from '../types/event'
import { getEventsActive, getEventsRecentWithInstagram } from '../services/eventService'
import { colors } from '../theme/colors'
import { fontFamilies } from '../theme/typography'
import {
  getInstagramPostIdFromEmbedHtml,
  getInstagramPostUrlFromEmbedHtml,
} from '../utils/instagramEmbed'

function formatEventDate(value: string): string {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const day = String(date.getDate()).padStart(2, '0')
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(date)
    .replace(/\.$/, '')
  return `${day}/${month}/${date.getFullYear()}`
}

export function EventsListScreen() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [events, setEvents] = useState<IEvent[]>([])
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      const withEmbed = await getEventsRecentWithInstagram(10)
      setEvents(withEmbed.length > 0 ? withEmbed : await getEventsActive())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await load()
    } finally {
      setRefreshing(false)
    }
  }, [load])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {error && events.length > 0 ? (
        <Text style={styles.emptyText}>Não foi possível atualizar os eventos. Tente novamente.</Text>
      ) : null}
      <FlatList
        data={events}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshing={refreshing}
        onRefresh={onRefresh}
        alwaysBounceVertical
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, events.length === 0 && styles.emptyList]}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {error ? 'Não foi possível carregar os eventos. Puxe para tentar novamente.' : 'Nenhum evento encontrado.'}
          </Text>
        }
        renderItem={({ item }) => {
          const hasEmbed = item.embedded_instagram && item.embedded_instagram.trim().length > 0
          if (hasEmbed) {
            const postId = getInstagramPostIdFromEmbedHtml(item.embedded_instagram!)
            const postUrl = getInstagramPostUrlFromEmbedHtml(item.embedded_instagram!)
            return (
              <View style={styles.embedCard}>
                <InstagramEmbedWebView
                  embedHtml={item.embedded_instagram!}
                  postId={postId}
                  style={styles.embed}
                  compact
                />
                {item.name || item.date ? (
                  <View style={styles.cardCaption}>
                    {item.name ? <Text style={styles.cardTitle}>{item.name}</Text> : null}
                    {item.date ? <Text style={styles.cardDate}>{formatEventDate(item.date)}</Text> : null}
                  </View>
                ) : null}
                {postUrl ? (
                  <TouchableOpacity
                    style={styles.instagramLink}
                    onPress={() => Linking.openURL(postUrl)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.instagramLinkText}>Ver no Instagram</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          }
          return (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDate}>{item.date ? formatEventDate(item.date) : ''}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24, paddingHorizontal: 8 },
  row: { alignItems: 'flex-start' },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
  },
  card: {
    flex: 1,
    maxWidth: '50%',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 6,
  },
  embedCard: {
    flex: 1,
    maxWidth: '50%',
    marginHorizontal: 4,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  embed: {},
  instagramLink: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  instagramLinkText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 14,
    color: '#E4405F',
  },
  cardCaption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 16,
    color: colors.text,
  },
  cardDate: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    marginTop: 4,
  },
  cardDesc: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.text,
    marginTop: 4,
  },
})
