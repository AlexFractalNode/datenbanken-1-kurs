/** Topic filter via the `?thema=tNN` URL parameter (shared by the learning islands). */

export interface TopicOption {
  id: string;
  title: string;
}

export function topicFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('thema') ?? '';
  } catch {
    return '';
  }
}

export function writeTopicToUrl(topic: string): void {
  try {
    const url = new URL(window.location.href);
    if (topic) url.searchParams.set('thema', topic);
    else url.searchParams.delete('thema');
    window.history.replaceState(window.history.state, '', url);
  } catch {
    // Without the history API the filter still works, it is just not reflected in the URL.
  }
}
