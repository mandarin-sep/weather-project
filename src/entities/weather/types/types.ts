export type DataType = 'XML' | 'JSON';

// 공통 응답 헤더
export interface KmaResponseHeader {
  resultCode: string;
  resultMsg: string;
}

// 공통 응답 바디
export interface KmaItems<TItem> {
  item: TItem[];
}

export interface KmaResponseBody<TItem> {
  dataType?: DataType | string;
  pageNo?: number;
  numOfRows?: number;
  totalCount?: number;
  items: KmaItems<TItem>;
}

// 최상위 응답 래퍼
export interface KmaApiResponse<TItem> {
  response: {
    header: KmaResponseHeader;
    body: KmaResponseBody<TItem>;
  };
}

// 공통 필드 (격자, 기준일시, 카테고리)
export interface KmaBaseFields {
  baseDate: string; // YYYYMMDD
  baseTime: string; // HHmm
  nx: number;
  ny: number;
  category: string;
}

// 실황 항목
export interface UltraSrtNcstItem extends KmaBaseFields {
  obsrValue: string;
}

// 예보 항목 (초단기/단기 공통)
export interface ForecastItemBase extends KmaBaseFields {
  fcstDate: string; // YYYYMMDD
  fcstTime: string; // HHmm
  fcstValue: string;
}

export type UltraSrtFcstItem = ForecastItemBase;
export type VilageFcstItem = ForecastItemBase;

// 예보 버전 항목
export interface FcstVersionItem {
  version: string;
  filetype: 'ODAM' | 'VSRT' | 'SHRT' | string;
  basedatetime?: string; // YYYYMMDDHHmm (문서에 따라 있을 수 있음)
}

// 공통 쿼리 파라미터
export interface CommonQuery {
  pageNo?: number; // 기본 1
  numOfRows?: number; // 기본 10
  dataType?: DataType; // 기본 XML(문서), 본 클라이언트는 기본 JSON 권장
}

// 각 오퍼레이션별 요청 파라미터
export interface GetUltraSrtNcstParams extends CommonQuery {
  base_date: string; // YYYYMMDD
  base_time: string; // HHmm (정시)
  nx: number;
  ny: number;
}

export interface GetUltraSrtFcstParams extends CommonQuery {
  base_date: string; // YYYYMMDD
  base_time: string; // HHmm (00/30)
  nx: number;
  ny: number;
}

export interface GetVilageFcstParams extends CommonQuery {
  base_date: string; // YYYYMMDD
  base_time: string; // HHmm (02/05/08/11/14/17/20/23 시 정각)
  nx: number;
  ny: number;
}

export interface GetFcstVersionParams extends CommonQuery {
  ftype: 'ODAM' | 'VSRT' | 'SHRT';
  basedatetime: string; // YYYYMMDDHHmm
}

// 바디 타입
export type UltraSrtNcstBody = KmaResponseBody<UltraSrtNcstItem>;
export type UltraSrtFcstBody = KmaResponseBody<UltraSrtFcstItem>;
export type VilageFcstBody = KmaResponseBody<VilageFcstItem>;
export type FcstVersionBody = KmaResponseBody<FcstVersionItem>;

// 전체 응답 타입
export type UltraSrtNcstResponse = KmaApiResponse<UltraSrtNcstItem>;
export type UltraSrtFcstResponse = KmaApiResponse<UltraSrtFcstItem>;
export type VilageFcstResponse = KmaApiResponse<VilageFcstItem>;
export type FcstVersionResponse = KmaApiResponse<FcstVersionItem>;

export type OperationName =
  | 'getUltraSrtNcst'
  | 'getUltraSrtFcst'
  | 'getVilageFcst'
  | 'getFcstVersion';

