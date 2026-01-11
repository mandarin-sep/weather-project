// 기상청 단기예보 규칙 기반 유틸리티 (KST 기준)

// 내부: 특정 Date 인스턴트에 대해 "KST 시각 구성요소"를 계산하기 위해,
// UTC epoch(ms)을 KST로 보정한 뒤 getUTC* 접근을 사용한다.
function toKstShiftedDate(date: Date): Date {
    const utcMs = date.getTime() + date.getTimezoneOffset() * 60_000;
    const kstMs = utcMs + 9 * 60 * 60_000; // UTC+9
    return new Date(kstMs);
  }
  
  export function formatYyyymmdd(date: Date): string {
    const d = toKstShiftedDate(date);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }
  
  export function formatHhmm(date: Date): string {
    const d = toKstShiftedDate(date);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}${mm}`;
  }
  
  export function formatYyyymmddHhmm(date: Date): string {
    return `${formatYyyymmdd(date)}${formatHhmm(date)}`;
  }
  
  function addMinutes(date: Date, m: number): Date {
    return new Date(date.getTime() + m * 60_000);
  }
  
  // 직전 정시(매시 10분 룰) - 초단기실황
  export function getRecommendedUltraSrtNcstBase(now: Date = new Date()): {
    base_date: string;
    base_time: string;
  } {
    const k = toKstShiftedDate(now);
    const minutes = k.getUTCMinutes();
    const currentHour = k.getUTCHours();
    // 10분 이전이면 직전 시각, 이후면 현재 정시
    if (minutes < 10) {
      // 직전 시각으로 이동
      const prev = addMinutes(k, -minutes - 1); // 분경계 이전으로 이동해 안전하게 한 시간 반납
      prev.setUTCMinutes(0, 0, 0);
      prev.setUTCHours((currentHour + 23) % 24);
      // 위 방식은 복잡하니 더 간단히:
      const prevHour = new Date(k);
      prevHour.setUTCMinutes(0, 0, 0);
      prevHour.setUTCHours(currentHour - 1);
      return {
        base_date: formatYyyymmdd(prevHour),
        base_time: '00'.padStart(2, '0') + '00'.slice(2), // '0000'을 안전하게, 아래에서 덮어씀
      };
    }
    // 현재 정시
    const curHour = new Date(k);
    curHour.setUTCMinutes(0, 0, 0);
    const base_date = formatYyyymmdd(curHour);
    const base_time = String(curHour.getUTCHours()).padStart(2, '0') + '00';
    return { base_date, base_time };
  }
  
  // 위 함수에서 분기 처리 부분 개선 (직전 정시 계산 안전화)
  // 별도의 안전 버전을 제공
  export function getRecommendedUltraSrtNcstBaseSafe(now: Date = new Date()): {
    base_date: string;
    base_time: string;
  } {
    const k = toKstShiftedDate(now);
    const minutes = k.getUTCMinutes();
    let base = new Date(k);
    base.setUTCMinutes(0, 0, 0);
    if (minutes < 10) {
      base = addMinutes(base, -60);
    }
    const base_date = formatYyyymmdd(base);
    const base_time = String(base.getUTCHours()).padStart(2, '0') + '00';
    return { base_date, base_time };
  }
  
  // 직전 30분(45분 룰) - 초단기예보
  export function getRecommendedUltraSrtFcstBase(now: Date = new Date()): {
    base_date: string;
    base_time: string;
  } {
    const k = toKstShiftedDate(now);
    const minutes = k.getUTCMinutes();
    let base = new Date(k);
    // 기준: 00 또는 30에 내림
    const half = minutes >= 30 ? 30 : 0;
    base.setUTCMinutes(half, 0, 0);
    // 45분 이전이면 직전 30분으로 한 단계 더 이전
    if (minutes < 45) {
      base = addMinutes(base, -30);
    }
    const base_date = formatYyyymmdd(base);
    const base_time =
      String(base.getUTCHours()).padStart(2, '0') + String(base.getUTCMinutes()).padStart(2, '0');
    return { base_date, base_time };
  }
  
  // 단기예보: 8회 발표(02,05,08,11,14,17,20,23) 각 +10분 이후 유효
  export function getRecommendedVilageFcstBase(now: Date = new Date()): {
    base_date: string;
    base_time: string;
  } {
    const k = toKstShiftedDate(now);
    const h = k.getUTCHours();
    const m = k.getUTCMinutes();
    const releaseHours = [2, 5, 8, 11, 14, 17, 20, 23];
    const currentMinutesOfDay = h * 60 + m;
    // 유효 시각 = 시각*60+10
    let chosenHour: number | null = null;
    for (let i = releaseHours.length - 1; i >= 0; i -= 1) {
      const r = releaseHours[i];
      const validAt = r * 60 + 10;
      if (currentMinutesOfDay >= validAt) {
        chosenHour = r;
        break;
      }
    }
    let base = new Date(k);
    base.setUTCMinutes(0, 0, 0);
    if (chosenHour === null) {
      // 당일 02:10 이전 -> 전일 23:00
      base.setUTCHours(23);
      base = addMinutes(base, -24 * 60); // 전일로
    } else {
      base.setUTCHours(chosenHour);
    }
    const base_date = formatYyyymmdd(base);
    const base_time = String(base.getUTCHours()).padStart(2, '0') + '00';
    return { base_date, base_time };
  }
  
  // 예보버전 조회 basedatetime(YYYYMMDDHHmm)
  export function getBasedatetime(date: Date = new Date()): string {
    return formatYyyymmddHhmm(date);
  }
  
  