import Taro from '@tarojs/taro';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

const TOKEN_KEY = 'sb-access-token';
const USER_ID_KEY = 'sb-user-id';

type Filter = { column: string; operator: string; value: string | number | boolean };
type Order = { column: string; ascending: boolean };
type RequestMethod = Taro.request.Option['method'];

type QueryResult = {
  data: any;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

function getAuthToken() {
  return Taro.getStorageSync(TOKEN_KEY) || getSupabaseAnonKey();
}

function getCurrentUserId() {
  return Taro.getStorageSync(USER_ID_KEY) || null;
}

function buildHeaders(extra?: Record<string, string>) {
  const token = getAuthToken();
  return {
    apikey: getSupabaseAnonKey(),
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function encodeFilter(filter: Filter) {
  return `${filter.operator}.${encodeURIComponent(String(filter.value))}`;
}

function getHeaderValue(headers: Record<string, unknown> | undefined, name: string) {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === target);
  return entry ? String(entry[1]) : undefined;
}

function parseCount(headers: Record<string, unknown> | undefined) {
  const contentRange = getHeaderValue(headers, 'content-range');
  const total = contentRange?.split('/')[1];
  if (!total || total === '*') return null;
  const parsed = Number(total);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeError(data: unknown, fallback: string) {
  if (data && typeof data === 'object' && 'message' in data) {
    return { message: String((data as { message?: unknown }).message || fallback) };
  }
  return { message: fallback };
}

async function requestSupabase(options: {
  path: string;
  method?: RequestMethod;
  query?: Record<string, string>;
  body?: unknown;
  headers?: Record<string, string>;
}): Promise<QueryResult> {
  const query = new URLSearchParams(options.query || {}).toString();
  const url = `${getSupabaseUrl()}${options.path}${query ? `?${query}` : ''}`;

  try {
    const res = await Taro.request({
      url,
      method: options.method || 'GET',
      header: buildHeaders(options.headers),
      data: options.body,
      timeout: 20000,
    });

    if (res.statusCode < 200 || res.statusCode >= 300) {
      return {
        data: null,
        error: normalizeError(res.data, `Supabase request failed: ${res.statusCode}`),
        count: parseCount(res.header),
      };
    }

    return { data: res.data, error: null, count: parseCount(res.header) };
  } catch (err: any) {
    return { data: null, error: { message: String(err?.errMsg || err?.message || err) } };
  }
}

class MiniappQueryBuilder implements PromiseLike<QueryResult> {
  private selectColumns = '*';
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private requestBody: unknown;
  private requestMethod: RequestMethod = 'GET';
  private shouldReturnSingle = false;
  private allowEmptySingle = false;
  private maxRows?: number;
  private countMode?: 'exact';
  private headOnly = false;
  private wantsRepresentation = false;

  constructor(private readonly table: string) {}

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.selectColumns = columns;
    this.countMode = options?.count;
    this.headOnly = Boolean(options?.head);
    if (this.requestMethod !== 'GET' && !this.headOnly) {
      this.wantsRepresentation = true;
    }
    return this;
  }

  eq(column: string, value: string | number | boolean) {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  gte(column: string, value: string | number | boolean) {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lt(column: string, value: string | number | boolean) {
    this.filters.push({ column, operator: 'lt', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.shouldReturnSingle = true;
    this.allowEmptySingle = false;
    return this;
  }

  maybeSingle() {
    this.shouldReturnSingle = true;
    this.allowEmptySingle = true;
    return this;
  }

  insert(body: unknown) {
    this.requestMethod = 'POST';
    this.requestBody = body;
    return this;
  }

  update(body: unknown) {
    this.requestMethod = 'PATCH';
    this.requestBody = body;
    return this;
  }

  private buildQuery() {
    const query: Record<string, string> = { select: this.selectColumns };
    this.filters.forEach((filter) => {
      query[filter.column] = encodeFilter(filter);
    });
    if (this.orders.length > 0) {
      query.order = this.orders.map((item) => `${item.column}.${item.ascending ? 'asc' : 'desc'}`).join(',');
    }
    if (typeof this.maxRows === 'number') {
      query.limit = String(this.maxRows);
    }
    return query;
  }

  private buildPreferHeader() {
    const preferences: string[] = [];
    if (this.countMode) preferences.push(`count=${this.countMode}`);
    if (this.wantsRepresentation) preferences.push('return=representation');
    return preferences.length > 0 ? { Prefer: preferences.join(',') } : undefined;
  }

  private async execute(): Promise<QueryResult> {
    const result = await requestSupabase({
      path: `/rest/v1/${this.table}`,
      method: this.headOnly ? 'HEAD' : this.requestMethod,
      query: this.buildQuery(),
      body: this.requestBody,
      headers: this.buildPreferHeader(),
    });

    if (result.error) return result;
    if (!this.shouldReturnSingle) return result;

    const rows = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    if (rows.length === 0 && this.allowEmptySingle) {
      return { ...result, data: null, error: null };
    }
    if (rows.length !== 1) {
      return { ...result, data: null, error: { message: `Expected single row, received ${rows.length}` } };
    }
    return { ...result, data: rows[0], error: null };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}

class MiniappSupabaseClient {
  auth = {
    getUser: async () => ({ data: { user: getCurrentUserId() ? { id: getCurrentUserId() } : null }, error: null }),
    signOut: async () => ({ error: null }),
  };

  from(table: string) {
    return new MiniappQueryBuilder(table);
  }

  async rpc(functionName: string, params?: Record<string, unknown>) {
    return requestSupabase({
      path: `/rest/v1/rpc/${functionName}`,
      method: 'POST',
      body: params || {},
    });
  }
}

let client: MiniappSupabaseClient | null = null;

export function getSupabaseClient() {
  if (!client) client = new MiniappSupabaseClient();
  return client;
}
