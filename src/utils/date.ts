import dayjs, { type Dayjs } from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

/** 今日日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  return dayjs().format('YYYY-MM-DD')
}

/** 本周一 00:00:00（ISO 周） */
export function weekStart(): Dayjs {
  return dayjs().startOf('isoWeek')
}

export { dayjs }
export type { Dayjs }
