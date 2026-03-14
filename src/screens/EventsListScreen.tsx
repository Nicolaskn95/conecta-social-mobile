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

export function EventsListScreen() {
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<IEvent[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const withEmbed = await getEventsRecentWithInstagram(10)
      setEvents(withEmbed.length > 0 ? withEmbed : await getEventsActive())
    } catch {
      const list = await getEventsActive()
      setEvents(list)
    } finally {
      setLoading(false)
    }
  }, [])

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

  if (events.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
                />
                {item.name || item.date ? (
                  <View style={styles.cardCaption}>
                    {item.name ? <Text style={styles.cardTitle}>{item.name}</Text> : null}
                    {item.date ? <Text style={styles.cardDate}>{item.date}</Text> : null}
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
              <Text style={styles.cardDate}>{item.date}</Text>
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
  listContent: { paddingBottom: 24 },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    color: colors.mutedText,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
  },
  embedCard: {
    marginHorizontal: 16,
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
