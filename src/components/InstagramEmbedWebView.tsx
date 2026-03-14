import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'

const EMBED_HEIGHT = 480

/**
 * Exibe o embed do Instagram. Preferência: URL oficial do embed (mais estável).
 * Fallback: HTML injetado com embed.js (igual ao site).
 */
function buildEmbedHtml(embedHtml: string): string {
  const safe = embedHtml.replace(/<\/script>/gi, '<\\/script>')
  return [
    '<!DOCTYPE html><html><head>',
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">',
    '<script async src="https://www.instagram.com/embed.js"></script>',
    '<style>*{margin:0;padding:0;box-sizing:border-box;}',
    'body{padding:12px;background:#fff;min-height:100%;}',
    '#embed{min-height:340px;}',
    '.instagram-media{margin:0 auto!important;max-width:100%!important;}',
    'blockquote.instagram-media{margin:0!important;}</style>',
    '</head><body><div id="embed">',
    safe,
    '</div><script>',
    'function run(){if(window.instgrm&&window.instgrm.Embeds&&typeof window.instgrm.Embeds.process==="function"){window.instgrm.Embeds.process();}else{setTimeout(run,200);}}',
    'if(document.readyState==="complete")run();else window.onload=run;',
    'setTimeout(run,600);setTimeout(run,1200);',
    '</script></body></html>',
  ].join('')
}

interface InstagramEmbedWebViewProps {
  embedHtml: string
  /** Shortcode do post (ex.: ABC123). Quando informado, carrega a URL oficial do embed. */
  postId?: string | null
  style?: object
}

export function InstagramEmbedWebView({ embedHtml, postId, style }: InstagramEmbedWebViewProps) {
  const useEmbedUrl = Boolean(postId)
  const source = useMemo(
    () =>
      useEmbedUrl
        ? { uri: `https://www.instagram.com/p/${postId}/embed/` }
        : { html: buildEmbedHtml(embedHtml), baseUrl: 'https://www.instagram.com/' },
    [useEmbedUrl, postId, embedHtml]
  )

  return (
    <View style={[styles.wrapper, style]}>
      <WebView
        source={source}
        originWhitelist={['*']}
        scrollEnabled={false}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="compatibility"
        startInLoadingState
        scalesPageToFit
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: EMBED_HEIGHT,
  },
  webview: {
    flex: 1,
    height: EMBED_HEIGHT,
    backgroundColor: '#fff',
  },
})
