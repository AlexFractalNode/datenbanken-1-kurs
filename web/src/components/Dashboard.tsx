import { useEffect, useState } from 'preact/hooks';
import { computeDashboard, type DashboardStats, type DashboardTopic } from '../lib/dashboard';
import { onLocalMidnight } from '../lib/day';
import { withBase } from '../lib/nav';
import { RECOVERED_NOTICE, progress, storageNotice } from '../lib/progress';
import { readIntroducedToday, readNewCardLimit } from '../lib/settings';

interface Props {
  /** Content structure from the build (ids per topic); the progress comes from the browser. */
  topics: DashboardTopic[];
}

type UnitState = 'loading' | 'empty' | 'ready';

interface Loaded {
  stats: DashboardStats;
  limit: number;
  introducedToday: number;
  notice: string | null;
  recovered: boolean;
}

function load(topics: DashboardTopic[]): Loaded {
  const result = progress.loadDetailed();
  const now = new Date();
  const limit = readNewCardLimit();
  const introducedToday = readIntroducedToday(now).length;
  return {
    stats: computeDashboard(topics, result.progress, now, { limit, introducedToday }),
    limit,
    introducedToday,
    notice: storageNotice(result),
    recovered: result.recovered.length > 0,
  };
}

const cardsLabel = (n: number) => (n === 1 ? '1 Karte' : `${n} Karten`);

export default function Dashboard({ topics }: Props) {
  const [data, setData] = useState<Loaded | null>(null);

  useEffect(() => {
    setData(load(topics));
    // The data changes in other tabs (storage event, or seen when the tab returns) and with the day:
    // at local midnight the streak and the new-card allowance move on.
    const reload = () => setData(load(topics));
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('db1:')) reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    const stopMidnight = onLocalMidnight(reload);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
      stopMidnight();
    };
    // Mount only: the topics are static build output.
  }, []);

  const state: UnitState = !data ? 'loading' : data.stats.hasProgress ? 'ready' : 'empty';
  const stats = data?.stats;
  const open = data ? Math.max(0, data.limit - data.introducedToday) : 0;

  return (
    <div class="dash" data-verify-unit="dashboard-progress" data-verify-state={state} data-verify-count={state === 'ready' ? topics.length : 0}>
      {data?.notice && <p class="notice notice--warn">{data.notice}</p>}
      {data?.recovered && <p class="notice notice--warn">{RECOVERED_NOTICE}</p>}

      {!stats ? (
        <p class="meta">Lade deinen Stand …</p>
      ) : (
        <>
          <dl class="dash__stats">
            <div data-stat="due">
              <dt>Heute fällig</dt>
              <dd>
                <strong>{cardsLabel(stats.due.total)}</strong>
                <span>
                  {stats.due.reviews} Wiederholungen, {stats.due.fresh} neu
                </span>
              </dd>
            </div>
            <div data-stat="coverage">
              <dt>Abdeckung</dt>
              <dd>
                <strong>{stats.coverage} %</strong>
                <span>der Karten schon einmal bewertet</span>
              </dd>
            </div>
            <div data-stat="streak">
              <dt>Lernserie</dt>
              <dd>
                <strong>{stats.streak === 1 ? '1 Tag' : `${stats.streak} Tage`}</strong>
                <span>{stats.streak > 0 ? 'in Folge aktiv' : 'Übe heute, um eine Serie zu starten'}</span>
              </dd>
            </div>
          </dl>

          <p class="button-row">
            <a class="button" href={withBase('karten/')}>
              {stats.due.total > 0 ? 'Karten üben' : 'Zu den Karten'}
            </a>
          </p>

          {state === 'empty' ? (
            <p>
              Noch kein Lernfortschritt gespeichert. Fortschritt pro Thema und deine Lernserie erscheinen hier, sobald du mit Karten
              und Quiz übst.
            </p>
          ) : (
            <ol class="dash__topics" aria-label="Fortschritt pro Thema">
              {stats.topics.map((t) => (
                <li class="dash__topic" data-topic={t.id}>
                  <h3 class="dash__title">
                    <span class="key">{t.id}</span> <a href={withBase(`themen/${t.id}/`)}>{t.title}</a>
                  </h3>
                  <dl class="dash__facts">
                    <div>
                      <dt>Karten gelernt</dt>
                      <dd>
                        {t.cards.total === 0 ? (
                          'keine Karten'
                        ) : (
                          <>
                            <progress max={t.cards.total} value={t.cards.learned} aria-label={`${t.title}: gelernte Karten`}>
                              {t.cards.percent} %
                            </progress>
                            <span>
                              {t.cards.learned} von {t.cards.total} ({t.cards.percent} %)
                            </span>
                          </>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Quiz-Quote</dt>
                      <dd>{t.quiz.percent === null ? 'noch nichts beantwortet' : `${t.quiz.correct} von ${t.quiz.seen} richtig (${t.quiz.percent} %)`}</dd>
                    </div>
                    <div>
                      <dt>Aufgabenpunkte</dt>
                      <dd>
                        {t.tasks.total === 0
                          ? 'keine Aufgaben'
                          : t.tasks.max === 0
                            ? `noch nichts bewertet (${t.tasks.total} Punkte möglich)`
                            : `${t.tasks.score} von ${t.tasks.max} Punkten (${t.tasks.percent} %)`}
                      </dd>
                    </div>
                    <div>
                      <dt>Heute fällig</dt>
                      <dd>{cardsLabel(t.due)}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ol>
          )}

          <p class="meta">
            Tageslimit für neue Karten: {data.limit} (heute {Math.min(data.introducedToday, data.limit)} begonnen
            {data.limit > 0 ? `, noch ${open} möglich` : ''}). Du änderst es in den{' '}
            <a href={withBase('einstellungen/')}>Einstellungen</a>.
          </p>
        </>
      )}
    </div>
  );
}
