/**
 * Pure dashboard calculations: progress per topic, due cards (with the daily new-card limit),
 * coverage and the current streak. The page passes the build-time content structure
 * (`DashboardTopic`), the browser passes the stored progress; nothing here touches storage.
 */
import { localDay, previousLocalDay } from './day';
import { newCardAllowance } from './settings';
import { isDue } from './srs';
import type { ProgressV1, Streak } from './progress';

/** Content structure of one topic as far as the dashboard needs it. */
export interface DashboardTopic {
  id: string;
  title: string;
  cardIds: string[];
  quizIds: string[];
  tasks: { id: string; points: number }[];
}

export interface TopicStats {
  id: string;
  title: string;
  /** `learned`: cards that reached the FSRS review state; `seen`: cards rated at least once. */
  cards: { total: number; seen: number; learned: number; percent: number };
  /** Answers over all quiz questions of the topic; `percent` is null until something was answered. */
  quiz: { seen: number; correct: number; percent: number | null };
  /** `score`/`max` of the self-graded tasks done so far, `total` is the sum of all task points. */
  tasks: { score: number; max: number; total: number; percent: number | null };
  /** Due reviews plus the new cards allowed today that belong to this topic. */
  due: number;
}

export interface DashboardStats {
  topics: TopicStats[];
  due: { reviews: number; fresh: number; total: number };
  /** Share of all cards that were rated at least once, in percent. */
  coverage: number;
  streak: number;
  hasProgress: boolean;
}

export interface DailyLimit {
  limit: number;
  introducedToday: number;
}

/** FSRS review state (ts-fsrs `State.Review`). */
const REVIEW_STATE = 2;

const percentOf = (part: number, whole: number): number => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export function computeDashboard(topics: DashboardTopic[], p: ProgressV1, now: Date, daily: DailyLimit): DashboardStats {
  let allowance = newCardAllowance(daily.limit, daily.introducedToday);
  let totalCards = 0;
  let seenCards = 0;
  let reviews = 0;
  let fresh = 0;

  const stats = topics.map((topic): TopicStats => {
    const stored = topic.cardIds.filter((id) => Object.hasOwn(p.cards, id));
    const learned = stored.filter((id) => p.cards[id].state === REVIEW_STATE).length;
    const topicReviews = stored.filter((id) => isDue(p.cards[id], now)).length;
    const newInTopic = topic.cardIds.length - stored.length;
    const topicFresh = Math.min(newInTopic, allowance);
    allowance -= topicFresh;

    let quizSeen = 0;
    let quizCorrect = 0;
    for (const id of topic.quizIds) {
      if (Object.hasOwn(p.quiz, id)) {
        quizSeen += p.quiz[id].seen;
        quizCorrect += p.quiz[id].correct;
      }
    }

    let score = 0;
    let max = 0;
    let total = 0;
    for (const task of topic.tasks) {
      total += task.points;
      if (Object.hasOwn(p.tasks, task.id)) {
        score += p.tasks[task.id].score;
        max += p.tasks[task.id].max;
      }
    }

    totalCards += topic.cardIds.length;
    seenCards += stored.length;
    reviews += topicReviews;
    fresh += topicFresh;

    return {
      id: topic.id,
      title: topic.title,
      cards: { total: topic.cardIds.length, seen: stored.length, learned, percent: percentOf(learned, topic.cardIds.length) },
      quiz: { seen: quizSeen, correct: quizCorrect, percent: quizSeen === 0 ? null : percentOf(quizCorrect, quizSeen) },
      tasks: { score, max, total, percent: max === 0 ? null : percentOf(score, max) },
      due: topicReviews + topicFresh,
    };
  });

  const hasProgress =
    stats.some((t) => t.cards.seen > 0 || t.quiz.seen > 0 || t.tasks.max > 0) || Object.keys(p.exams).length > 0 || p.streak.days > 0;

  return {
    topics: stats,
    due: { reviews, fresh, total: reviews + fresh },
    coverage: percentOf(seenCards, totalCards),
    streak: currentStreak(p.streak, now),
    hasProgress,
  };
}

/**
 * The streak that is still alive: it counts while the last activity was today or yesterday (today
 * can still be used to continue it); after a skipped day it is 0.
 */
export function currentStreak(streak: Streak, now: Date): number {
  if (streak.last === '' || streak.days <= 0) return 0;
  return streak.last === localDay(now) || streak.last === previousLocalDay(now) ? streak.days : 0;
}
