import type {
    DataType,
    OperationName,
    GetUltraSrtNcstParams,
    GetUltraSrtFcstParams,
    GetVilageFcstParams,
    GetFcstVersionParams,
    UltraSrtNcstItem,
    UltraSrtFcstItem,
    VilageFcstItem,
    FcstVersionItem,
    UltraSrtNcstResponse,
    UltraSrtFcstResponse,
    VilageFcstResponse,
    FcstVersionResponse,
    UltraSrtNcstBody,
    UltraSrtFcstBody,
    VilageFcstBody,
    FcstVersionBody,
  } from '@/entities/weather/types/types';
  import { KMA_RESULT_CODE_MESSAGES, KmaApiError, KmaNetworkError, KmaUnsupportedFormatError } from '@/entities/weather/api/weather.errors';
  
  export interface KmaClientOptions {
    serviceKey: string;
    serviceKeyAlreadyEncoded?: boolean;
    baseUrl?: string;
    defaultDataType?: DataType; // 기본 'JSON' 권장
    defaultPageNo?: number; // 기본 1
    defaultNumOfRows?: number; // 기본 10
  }
  
  const DEFAULT_BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  
  type RequestOptions = {
    raw?: boolean; // true 일 때 body 전체 반환 (JSON 데이터 타입인 경우)
  };
  
  export class KmaClient {
    private readonly serviceKey: string;
    private readonly baseUrl: string;
    private readonly defaultDataType: DataType;
    private readonly defaultPageNo: number;
    private readonly defaultNumOfRows: number;
  
    constructor(options: KmaClientOptions) {
      if (!options?.serviceKey) {
        throw new Error('KmaClient: serviceKey는 필수입니다.');
      }
      // 정책: 항상 "인코딩(Encoding) 키"만 받는다. 따라서 추가 인코딩을 하지 않는다.
      this.serviceKey = options.serviceKey;
      this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
      this.defaultDataType = options.defaultDataType ?? 'JSON';
      this.defaultPageNo = options.defaultPageNo ?? 1;
      this.defaultNumOfRows = options.defaultNumOfRows ?? 10;
    }
  
    // 내부 공통 요청기
    private async request<TItem, TResp extends { response: { header: { resultCode: string; resultMsg: string }; body: { items: { item: TItem[] } } } }>(
      operation: OperationName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: Record<string, any>,
    ): Promise<{ url: string; response: TResp; items: TItem[] }> {
      const dataType: DataType = params.dataType ?? this.defaultDataType;
      // XML은 파싱 미지원: 일관되게 에러를 던짐
      if (dataType === 'XML') {
        throw new KmaUnsupportedFormatError('XML');
      }
      const url = this.buildUrl(operation, { ...params, dataType });
      let res: Response;
      try {
        res = await fetch(url, { method: 'GET' });
      } catch (e) {
        throw new KmaNetworkError(url, `네트워크 요청 실패: ${(e as Error).message}`);
      }
      if (!res.ok) {
        throw new KmaNetworkError(url, `HTTP 오류: ${res.status} ${res.statusText}`, res.status, res.statusText);
      }
      let json: TResp;
      try {
        json = (await res.json()) as TResp;
      } catch (e) {
        throw new KmaNetworkError(url, `JSON 파싱 실패: ${(e as Error).message}`);
      }
      const { response } = json;
      const { resultCode, resultMsg } = response.header;
      if (resultCode !== '00') {
        // 표준 메시지 보강
        if (!resultMsg && KMA_RESULT_CODE_MESSAGES[resultCode]) {
          throw new KmaApiError({
            resultCode,
            resultMsg: KMA_RESULT_CODE_MESSAGES[resultCode],
            operation,
            url,
          });
        }
        throw new KmaApiError({ resultCode, resultMsg, operation, url });
      }
      const items = response.body.items.item as TItem[];
      return { url, response: json, items };
    }
  
    private buildUrl(operation: OperationName, params: Record<string, unknown>): string {
      // 주의: serviceKey는 이미 "인코딩된 값"을 그대로 사용해야 하므로
      // URLSearchParams로 넣으면 %가 다시 %25로 인코딩되어 이중 인코딩이 된다.
      // 따라서 serviceKey는 수동으로 붙이고, 나머지 파라미터만 URLSearchParams로 구성한다.
      const base = `${this.baseUrl}/${operation}`;
      const pageNo = (params.pageNo as number | undefined) ?? this.defaultPageNo;
      const numOfRows = (params.numOfRows as number | undefined) ?? this.defaultNumOfRows;
      const dataType = (params.dataType as DataType | undefined) ?? this.defaultDataType;
      const usp = new URLSearchParams();
      usp.set('pageNo', String(pageNo));
      usp.set('numOfRows', String(numOfRows));
      usp.set('dataType', dataType);
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (key === 'serviceKey' || key === 'pageNo' || key === 'numOfRows' || key === 'dataType') {
          continue;
        }
        usp.set(key, String(value));
      }
      const tail = usp.toString();
      const query = `serviceKey=${this.serviceKey}${tail ? `&${tail}` : ''}`;
      return `${base}?${query}`;
    }
  
    // 초단기실황조회
    async getUltraSrtNcst(
      params: GetUltraSrtNcstParams & { dataType?: DataType },
      options?: RequestOptions & { raw?: false },
    ): Promise<UltraSrtNcstItem[]>;
    async getUltraSrtNcst(
      params: GetUltraSrtNcstParams & { dataType?: DataType },
      options: RequestOptions & { raw: true },
    ): Promise<UltraSrtNcstBody>;
    async getUltraSrtNcst(
      params: GetUltraSrtNcstParams & { dataType?: DataType },
      options?: RequestOptions,
    ): Promise<UltraSrtNcstItem[] | UltraSrtNcstBody> {
      const { response, items } = await this.request<UltraSrtNcstItem, UltraSrtNcstResponse>(
        'getUltraSrtNcst',
        params,
      );
      if (options?.raw) return response.response.body;
      return items;
    }
  
    // 초단기예보조회
    async getUltraSrtFcst(
      params: GetUltraSrtFcstParams & { dataType?: DataType },
      options?: RequestOptions & { raw?: false },
    ): Promise<UltraSrtFcstItem[]>;
    async getUltraSrtFcst(
      params: GetUltraSrtFcstParams & { dataType?: DataType },
      options: RequestOptions & { raw: true },
    ): Promise<UltraSrtFcstBody>;
    async getUltraSrtFcst(
      params: GetUltraSrtFcstParams & { dataType?: DataType },
      options?: RequestOptions,
    ): Promise<UltraSrtFcstItem[] | UltraSrtFcstBody> {
      const { response, items } = await this.request<UltraSrtFcstItem, UltraSrtFcstResponse>(
        'getUltraSrtFcst',
        params,
      );
      if (options?.raw) return response.response.body;
      return items;
    }
  
    // 단기예보조회
    async getVilageFcst(
      params: GetVilageFcstParams & { dataType?: DataType },
      options?: RequestOptions & { raw?: false },
    ): Promise<VilageFcstItem[]>;
    async getVilageFcst(
      params: GetVilageFcstParams & { dataType?: DataType },
      options: RequestOptions & { raw: true },
    ): Promise<VilageFcstBody>;
    async getVilageFcst(
      params: GetVilageFcstParams & { dataType?: DataType },
      options?: RequestOptions,
    ): Promise<VilageFcstItem[] | VilageFcstBody> {
      const { response, items } = await this.request<VilageFcstItem, VilageFcstResponse>(
        'getVilageFcst',
        params,
      );
      if (options?.raw) return response.response.body;
      return items;
    }
  
    // 예보버전조회
    async getFcstVersion(
      params: GetFcstVersionParams & { dataType?: DataType },
      options?: RequestOptions & { raw?: false },
    ): Promise<FcstVersionItem[]>;
    async getFcstVersion(
      params: GetFcstVersionParams & { dataType?: DataType },
      options: RequestOptions & { raw: true },
    ): Promise<FcstVersionBody>;
    async getFcstVersion(
      params: GetFcstVersionParams & { dataType?: DataType },
      options?: RequestOptions,
    ): Promise<FcstVersionItem[] | FcstVersionBody> {
      const { response, items } = await this.request<FcstVersionItem, FcstVersionResponse>(
        'getFcstVersion',
        params,
      );
      if (options?.raw) return response.response.body;
      return items;
    }
  }
  
  