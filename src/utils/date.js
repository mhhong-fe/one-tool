import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

/** 今日日期字符串 YYYY-MM-DD */
export function todayStr() {
  return dayjs().format('YYYY-MM-DD')
}

/** 本周一 00:00:00（ISO 周） */
export function weekStart() {
  return dayjs().startOf('isoWeek')
}

export { dayjs }
