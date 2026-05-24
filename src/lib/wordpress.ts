const WORDPRESS_API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  'https://darkturquoise-scorpion-549588.hostingersite.com/wp-json/wp/v2';

interface WPRestPost {
  id: number;
  slug: string;
  link: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  meta?: Record<string, unknown>;
  acf?: Record<string, unknown>;
}

async function fetchWP<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<{ data: T; headers: Headers }> {
  const url = new URL(`${WORDPRESS_API_URL}/${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`WordPress REST request failed: ${response.statusText} (${response.status})`);
  }

  return {
    data: (await response.json()) as T,
    headers: response.headers,
  };
}

async function fetchWPList(
  endpoint: string,
  params?: Record<string, string>
): Promise<{ data: WPRestPost[]; headers: Headers }> {
  try {
    return await fetchWP<WPRestPost[]>(endpoint, params);
  } catch {
    return { data: [], headers: new Headers() };
  }
}

// Experiment Types
export interface ExperimentNode {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  uri: string;
  experimentNumber?: number;
}

function toExperimentNode(post: WPRestPost): ExperimentNode {
  return {
    id: String(post.id),
    title: post.title.rendered,
    excerpt: post.excerpt.rendered,
    content: post.content.rendered,
    uri: `/experiments/${post.slug}/`,
  };
}

export async function getExperiments(): Promise<ExperimentNode[]> {
  const { data } = await fetchWPList('experiments', { per_page: '100' });
  return data.map(toExperimentNode);
}

export async function getExperimentBySlug(slug: string): Promise<ExperimentNode | null> {
  const { data } = await fetchWPList('experiments', { slug });
  return data[0] ? toExperimentNode(data[0]) : null;
}

export async function getExperimentByUri(uri: string): Promise<ExperimentNode | null> {
  const slug = uri.split('/').filter(Boolean).pop() || '';
  return getExperimentBySlug(slug);
}

export async function getLatestExperiment(): Promise<ExperimentNode | null> {
  const { data, headers } = await fetchWPList('experiments', {
    per_page: '1',
    orderby: 'date',
    order: 'desc',
  });

  if (!data[0]) return null;

  const total = Number(headers.get('X-WP-Total'));
  return {
    ...toExperimentNode(data[0]),
    experimentNumber: total || undefined,
  };
}

// Notes Types
export interface NoteMetaNode {
  mood?: string;
}

export interface NoteNode {
  id: string;
  title: string;
  content: string;
  noteMeta?: NoteMetaNode;
  uri: string;
}

function toNoteNode(post: WPRestPost): NoteNode {
  const fields = (post.meta ?? {}) as Record<string, unknown>;
  return {
    id: String(post.id),
    title: post.title.rendered,
    content: post.content.rendered,
    uri: `/notes/${post.slug}/`,
    noteMeta: {
      mood: fields.mood as string | undefined,
    },
  };
}

export async function getNotes(): Promise<NoteNode[]> {
  const { data } = await fetchWPList('notes', { per_page: '100' });
  return data.map(toNoteNode);
}

export async function getNoteBySlug(slug: string): Promise<NoteNode | null> {
  const { data } = await fetchWPList('notes', { slug });
  return data[0] ? toNoteNode(data[0]) : null;
}

// Releases Types
export interface ReleaseMetaNode {
  externalLink?: string;
  releaseDate?: string;
  releaseType?: string;
}

export interface ReleaseNode {
  id: string;
  releaseMeta?: ReleaseMetaNode;
  title: string;
  uri: string;
  content: string;
}

function toReleaseNode(post: WPRestPost): ReleaseNode {
  const fields = (post.meta ?? {}) as Record<string, unknown>;
  return {
    id: String(post.id),
    title: post.title.rendered,
    content: post.content.rendered,
    uri: `/releases/${post.slug}/`,
    releaseMeta: {
      externalLink: fields.external_link as string | undefined,
      releaseDate: fields.release_date as string | undefined,
      releaseType: fields.release_type as string | undefined,
    },
  };
}

export async function getReleases(): Promise<ReleaseNode[]> {
  const { data } = await fetchWPList('releases', { per_page: '100' });
  return data.map(toReleaseNode);
}

export async function getReleaseBySlug(slug: string): Promise<ReleaseNode | null> {
  const { data } = await fetchWPList('releases', { slug });
  return data[0] ? toReleaseNode(data[0]) : null;
}

// Instruments Types
export interface InstrumentMetaNode {
  type?: string;
  stack?: string;
  role?: string;
}

export interface InstrumentNode {
  id: string;
  title: string;
  content: string;
  instrumentMeta?: InstrumentMetaNode;
  uri: string;
}

function toInstrumentNode(post: WPRestPost): InstrumentNode {
  const fields = (post.meta ?? {}) as Record<string, unknown>;
  return {
    id: String(post.id),
    title: post.title.rendered,
    content: post.content.rendered,
    uri: `/instruments/${post.slug}/`,
    instrumentMeta: {
      type: fields.type as string | undefined,
      stack: fields.stack as string | undefined,
      role: fields.role as string | undefined,
    },
  };
}

export async function getInstruments(): Promise<InstrumentNode[]> {
  const { data } = await fetchWPList('instruments', { per_page: '100' });
  return data.map(toInstrumentNode);
}

export async function getInstrumentBySlug(slug: string): Promise<InstrumentNode | null> {
  const { data } = await fetchWPList('instruments', { slug });
  return data[0] ? toInstrumentNode(data[0]) : null;
}

// Latest post across all CPTs
export type PostType = 'experiment' | 'note' | 'release' | 'instrument';

export interface LatestPostNode {
  id: string;
  title: string;
  uri: string;
  type: PostType;
  date: string;
}

const POST_TYPE_LABELS: Record<PostType, string> = {
  experiment: 'Experiment',
  note: 'Note',
  release: 'Release',
  instrument: 'Instrument',
};

export function getPostTypeLabel(type: PostType): string {
  return POST_TYPE_LABELS[type];
}

export async function getLatestPost(): Promise<LatestPostNode | null> {
  const params = { per_page: '1', orderby: 'date', order: 'desc' };

  const results = await Promise.allSettled([
    fetchWPList('experiments', params),
    fetchWPList('notes', params),
    fetchWPList('releases', params),
    fetchWPList('instruments', params),
  ]);

  const candidates: LatestPostNode[] = [];

  const push = (result: PromiseSettledResult<{ data: WPRestPost[] }>, type: PostType, base: string) => {
    if (result.status === 'fulfilled' && result.value.data[0]) {
      const post = result.value.data[0];
      candidates.push({
        id: String(post.id),
        title: post.title.rendered,
        uri: `/${base}/${post.slug}/`,
        type,
        date: post.date,
      });
    }
  };

  push(results[0], 'experiment', 'experiments');
  push(results[1], 'note', 'notes');
  push(results[2], 'release', 'releases');
  push(results[3], 'instrument', 'instruments');

  if (candidates.length === 0) return null;

  return candidates.reduce((latest, c) => c.date > latest.date ? c : latest);
}
