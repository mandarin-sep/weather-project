// KMA 전용 에러와 에러코드 매핑

import type { OperationName } from '@/entities/weather/types/types';

export const KMA_RESULT_CODE_MESSAGES: Readonly<Record<string, string>> = Object.freeze({
  // 성공
  '00': '정상',
  // 일반/시스템 오류
  '01': '어플리케이션 에러',
  '02': '데이터베이스 에러',
  '03': '데이터 없음(No Data)',
  '04': 'HTTP 에러',
  '05': '서비스 연결 실패',
  // 인증/접근 관련
  '10': '인증 실패',
  '11': '서비스키가 유효하지 않음',
  '12': '요청 서비스가 존재하지 않음',
  '13': '요청 제한(트래픽) 초과',
  '14': '서비스 일시 제한',
  '15': '서비스가 폐기되었거나 존재하지 않음',
  '16': '요청 IP가 제한됨',
  '17': '등록되지 않은 IP',
  '20': '서비스 접근 거부',
  '21': '일시적으로 사용할 수 없음',
  '22': '서비스 요청 제한 횟수 초과',
  // 파라미터/데이터 관련
  '30': '해당 서비스 없음',
  '31': '데이터 없음',
  '32': '유효하지 않은 파라미터 값',
  '33': '요청 범위(날짜/시간)가 너무 큼',
  // 기타
  '99': '기타 오류',
});

export class KmaError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class KmaUnsupportedFormatError extends KmaError {
  readonly name = 'KmaUnsupportedFormatError';
  readonly dataType: string;
  constructor(dataType: string) {
    super(
      `현재 데이터 타입("${dataType}")은 지원되지 않습니다. dataType='JSON'으로 요청하세요.`,
    );
    this.dataType = dataType;
  }
}

export class KmaInvalidParamsError extends KmaError {
  readonly name = 'KmaInvalidParamsError';
  readonly operation: OperationName;
  readonly params: Record<string, unknown>;
  constructor(operation: OperationName, params: Record<string, unknown>, message: string) {
    super(message);
    this.operation = operation;
    this.params = params;
  }
}

export class KmaNetworkError extends KmaError {
  readonly name = 'KmaNetworkError';
  readonly url: string;
  readonly status?: number;
  readonly statusText?: string;
  constructor(url: string, message: string, status?: number, statusText?: string) {
    super(message);
    this.url = url;
    this.status = status;
    this.statusText = statusText;
  }
}

export class KmaApiError extends KmaError {
  readonly name = 'KmaApiError';
  readonly resultCode: string;
  readonly resultMsg: string;
  readonly operation: OperationName;
  readonly url: string;
  readonly mappedMessage?: string;
  constructor(args: {
    resultCode: string;
    resultMsg: string;
    operation: OperationName;
    url: string;
  }) {
    const { resultCode, resultMsg, operation, url } = args;
    const mapped = KMA_RESULT_CODE_MESSAGES[resultCode];
    const msg = `[${operation}] API 오류(${resultCode}): ${mapped ?? resultMsg} - ${resultMsg}`;
    super(msg);
    this.resultCode = resultCode;
    this.resultMsg = resultMsg;
    this.operation = operation;
    this.url = url;
    this.mappedMessage = mapped;
  }
}

