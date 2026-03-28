<script setup lang="ts">
import { ref, computed } from "vue";
import {
    NModal,
    NButton,
    NInput,
    NSwitch,
    NTabs,
    NTabPane,
    NSelect,
    useMessage,
} from "naive-ui";
import { useLeetCode } from "../composables/useLeetCode";
import IconFont from "../components/IconFont.vue";
import type { LeetCodeProblem, LeetCodeAttempt, LeetCodeGoal } from "../types";

const message = useMessage();
const {
    list,
    stats,
    add,
    update,
    remove,
    goalList,
    goalProgress,
    addGoal,
    updateGoal,
    removeGoal,
} = useLeetCode();

// ─── Tab ────────────────────────────────────────────────
const activeTab = ref<"list" | "calendar">("list");

// ─── 筛选 ───────────────────────────────────────────────
const search = ref("");
const filter = ref<"all" | "mastered" | "pending">("all");

const filteredList = computed(() => {
    let result = list.value;
    if (search.value.trim()) {
        const q = search.value.trim().toLowerCase();
        result = result.filter(
            (p) =>
                p.title.toLowerCase().includes(q) || String(p.no).includes(q),
        );
    }
    if (filter.value === "mastered") {
        result = result.filter((p) => lastStatus(p) === true);
    } else if (filter.value === "pending") {
        result = result.filter((p) => lastStatus(p) !== true);
    }
    return result;
});

// ─── 日期工具 ────────────────────────────────────────────
/** "2026.03.17" → "2026-03-17" */
function lcToISO(d: string): string {
    return d.replace(/\./g, "-");
}

/** "2026-03-17" → "2026.03.17" */
function isoToLc(d: string): string {
    return d.replace(/-/g, ".");
}

function todayDateStr(): string {
    const d = new Date();
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 热力图数据 ─────────────────────────────────────────
/** 按 ISO 日期聚合：统计当日总尝试数 + 通过数 */
const attemptsByDate = computed(() => {
    const map: Record<string, { total: number; passed: number }> = {};
    list.value.forEach((p) => {
        p.attempts.forEach((a) => {
            const iso = lcToISO(a.date);
            if (!map[iso]) map[iso] = { total: 0, passed: 0 };
            map[iso].total += 1;
            if (a.passed) map[iso].passed += 1;
        });
    });
    return map;
});

/** 生成今年所有月份的格子（同 Stats 页面逻辑） */
const calendarMonths = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const todayISO = `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const months = [];
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(year, m, 1);
        const lastDay = new Date(year, m + 1, 0);
        // 周一=1 … 周日=7
        let firstWeekday = firstDay.getDay(); // 0=Sun
        if (firstWeekday === 0) firstWeekday = 7;
        const padStart = firstWeekday - 1;

        const cells: (null | {
            iso: string;
            total: number;
            passed: number;
            isFuture: boolean;
        })[] = [];
        for (let i = 0; i < padStart; i++) cells.push(null);

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const iso = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const info = attemptsByDate.value[iso] || { total: 0, passed: 0 };
            cells.push({ iso, ...info, isFuture: iso > todayISO });
        }

        const padEnd = (7 - (cells.length % 7)) % 7;
        for (let i = 0; i < padEnd; i++) cells.push(null);

        // 转置：7行(周一到周日) × N列(周)
        const numWeeks = cells.length / 7;
        const rows: (typeof cells)[] = Array.from({ length: 7 }, () => []);
        for (let wi = 0; wi < numWeeks; wi++) {
            for (let wd = 0; wd < 7; wd++) {
                rows[wd].push(cells[wi * 7 + wd]);
            }
        }
        months.push({ key: `${year}-${m}`, label: `${m + 1}月`, rows });
    }
    return months;
});

function cellLevel(total: number, isFuture: boolean): number {
    if (isFuture || total === 0) return 0;
    if (total === 1) return 1;
    if (total <= 3) return 2;
    return 3;
}

const levelColors = [
    "var(--cell-empty)",
    "rgba(59,130,246,0.30)",
    "rgba(59,130,246,0.58)",
    "rgba(59,130,246,0.88)",
];

// ─── 日历点击 ────────────────────────────────────────────
const selectedISO = ref("");

function clickCell(iso: string, isFuture: boolean) {
    if (isFuture) return;
    selectedISO.value = selectedISO.value === iso ? "" : iso;
}

/** 当天被尝试的题目列表（含当天的那些 attempt） */
const selectedDayProblems = computed(() => {
    if (!selectedISO.value) return [];
    const lcDate = isoToLc(selectedISO.value);
    return list.value
        .map((p) => {
            const dayAttempts = p.attempts.filter((a) => a.date === lcDate);
            if (!dayAttempts.length) return null;
            return { problem: p, dayAttempts };
        })
        .filter(Boolean) as {
        problem: LeetCodeProblem;
        dayAttempts: LeetCodeAttempt[];
    }[];
});

// ─── 月度柱状图数据 ──────────────────────────────────────
const BCW = 720; // bar chart width
const BCH = 100; // bar chart height
const BAR_W = 20;
const BAR_GAP = 5;
const GROUP_W = BCW / 12;
const BAR_PAD = (GROUP_W - BAR_W * 2 - BAR_GAP) / 2;

const monthlyChartData = computed(() => {
    const today = new Date();
    const year = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-indexed
    return Array.from({ length: currentMonth + 1 }, (_, m) => {
        let passed = 0, failed = 0;
        const lastDay = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= lastDay; d++) {
            const iso = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const info = attemptsByDate.value[iso];
            if (info) { passed += info.passed; failed += info.total - info.passed; }
        }
        return { month: m + 1, label: `${m + 1}月`, passed, failed };
    });
});

const barChartData = computed(() => {
    const data = monthlyChartData.value;
    const max = Math.max(...data.map((d) => Math.max(d.passed, d.failed)), 1);
    const toH = (v: number) => (v / max) * BCH * 0.9;
    const bars = data.map((d, i) => {
        const gx = i * GROUP_W;
        return {
            label: d.label,
            labelX: gx + GROUP_W / 2,
            passX: gx + BAR_PAD,
            failX: gx + BAR_PAD + BAR_W + BAR_GAP,
            passH: toH(d.passed),
            failH: toH(d.failed),
            passed: d.passed,
            failed: d.failed,
        };
    });
    const midLabel = String(Math.round(max / 2));
    return { bars, max: String(max), midLabel };
});

// ─── CRUD 弹窗 ───────────────────────────────────────────
const showModal = ref(false);
const editingId = ref<string | null>(null);
const formNo = ref<string>("");
const formTitle = ref("");
const formAttempts = ref<LeetCodeAttempt[]>([]);

function openAdd() {
    editingId.value = null;
    formNo.value = "";
    formTitle.value = "";
    formAttempts.value = [{ date: todayDateStr(), passed: true, note: "" }];
    showModal.value = true;
}

function openEdit(p: LeetCodeProblem) {
    editingId.value = p.id;
    formNo.value = String(p.no);
    formTitle.value = p.title;
    formAttempts.value = p.attempts.map((a) => ({ ...a }));
    showModal.value = true;
}

function addAttempt() {
    formAttempts.value.push({ date: todayDateStr(), passed: true, note: "" });
}

function removeAttempt(idx: number) {
    formAttempts.value.splice(idx, 1);
}

/** 校验日期格式是否为 YYYY.MM.DD 且是合法日期 */
function isValidLcDate(s: string): boolean {
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(s)) return false;
    const [y, m, d] = s.split(".").map(Number);
    const date = new Date(y, m - 1, d);
    return (
        date.getFullYear() === y &&
        date.getMonth() === m - 1 &&
        date.getDate() === d
    );
}

function handleSave() {
    const no = Number(formNo.value);
    if (!no || !formTitle.value.trim()) {
        message.warning("请填写题目编号和标题");
        return;
    }
    const badDate = formAttempts.value.find((a) => !isValidLcDate(a.date));
    if (badDate) {
        message.error(
            `日期格式有误：「${badDate.date}」，请使用 YYYY.MM.DD 格式，如 2026.03.28`,
        );
        return;
    }
    if (editingId.value) {
        update(editingId.value, {
            no,
            title: formTitle.value.trim(),
            attempts: formAttempts.value,
        });
        message.success("已更新");
    } else {
        add({
            no,
            title: formTitle.value.trim(),
            attempts: formAttempts.value,
        });
        message.success("已添加");
    }
    showModal.value = false;
}

function handleDelete() {
    if (!editingId.value) return;
    remove(editingId.value);
    message.success("已删除");
    showModal.value = false;
}

// ─── 题目辅助 ─────────────────────────────────────────────
function lastStatus(p: LeetCodeProblem): boolean | null {
    const last = p.attempts[p.attempts.length - 1];
    return last ? last.passed : null;
}

function lastNote(p: LeetCodeProblem): string {
    const last = p.attempts[p.attempts.length - 1];
    return last?.note || "";
}

const weekLabels = ["一", "二", "三", "四", "五", "六", "日"];

// ─── 目标弹窗 ─────────────────────────────────────────────
const showGoalModal = ref(false);
const editingGoalId = ref<string | null>(null);
const goalFormYear = ref(new Date().getFullYear());
const goalFormTarget = ref(100);

const yearOptions = computed(() =>
    [2025, 2026, 2027].map((y) => ({ label: `${y} 年`, value: y })),
);

function openAddGoal() {
    editingGoalId.value = null;
    goalFormYear.value = new Date().getFullYear();
    goalFormTarget.value = 100;
    showGoalModal.value = true;
}

function openEditGoal(g: LeetCodeGoal) {
    editingGoalId.value = g.id;
    goalFormYear.value = g.year;
    goalFormTarget.value = g.target;
    showGoalModal.value = true;
}

function handleSaveGoal() {
    if (!goalFormTarget.value || goalFormTarget.value <= 0) {
        message.warning("请填写大于 0 的目标题数");
        return;
    }
    const payload: Omit<LeetCodeGoal, "id"> = {
        year: goalFormYear.value,
        target: goalFormTarget.value,
    };
    if (editingGoalId.value) {
        updateGoal(editingGoalId.value, payload);
        message.success("目标已更新");
    } else {
        addGoal(payload);
        message.success("目标已添加");
    }
    showGoalModal.value = false;
}

function handleDeleteGoal() {
    if (!editingGoalId.value) return;
    removeGoal(editingGoalId.value);
    message.success("目标已删除");
    showGoalModal.value = false;
}
</script>

<template>
    <div class="page-lc">
        <!-- 统计 -->
        <section class="stats-row">
            <div class="stat-card">
                <span class="stat-num primary">{{ stats.total }}</span>
                <span class="stat-label">总题数</span>
            </div>
            <div class="stat-card">
                <span class="stat-num green">{{ stats.mastered }}</span>
                <span class="stat-label">已掌握</span>
            </div>
            <div class="stat-card">
                <span class="stat-num red">{{ stats.pending }}</span>
                <span class="stat-label">待复习</span>
            </div>
            <div class="stat-card">
                <span class="stat-num gradient">
                    {{
                        stats.total
                            ? Math.round((stats.mastered / stats.total) * 100)
                            : 0
                    }}%
                </span>
                <span class="stat-label">掌握率</span>
            </div>
        </section>

        <!-- 目标进度 -->
        <section class="goals-section">
            <div class="goals-header">
                <span class="goals-title">目标进度</span>
                <button class="btn-add-goal" @click="openAddGoal">
                    + 添加目标
                </button>
            </div>
            <div v-if="goalList.length === 0" class="goals-empty">
                暂无目标，点击「添加目标」设置年度计划
            </div>
            <div v-else class="goals-list">
                <div
                    v-for="g in goalList"
                    :key="g.id"
                    class="goal-card"
                    @click="openEditGoal(g)"
                >
                    <div class="goal-card-top">
                        <div class="goal-info">
                            <span class="goal-tag">年度</span>
                            <span class="goal-period">{{ g.year }} 年</span>
                        </div>
                        <div class="goal-count">
                            <span class="goal-done">{{
                                goalProgress(g).done
                            }}</span>
                            <span class="goal-sep">/</span>
                            <span class="goal-target">{{ g.target }}</span>
                            <span class="goal-unit">题</span>
                        </div>
                    </div>
                    <div class="goal-bar-wrap">
                        <div
                            class="goal-bar-fill"
                            :style="{ width: goalProgress(g).pct + '%' }"
                            :class="
                                goalProgress(g).pct >= 100 ? 'bar-done' : ''
                            "
                        />
                    </div>
                    <div class="goal-card-bottom">
                        <span class="goal-pct">{{ goalProgress(g).pct }}%</span>
                        <span
                            v-if="goalProgress(g).pct >= 100"
                            class="goal-badge-done"
                            >已达成 🎉</span
                        >
                        <span v-else class="goal-remain"
                            >还差 {{ g.target - goalProgress(g).done }} 题</span
                        >
                    </div>
                </div>
            </div>
        </section>

        <!-- Tab -->
        <NTabs
            v-model:value="activeTab"
            type="segment"
            size="small"
            class="main-tabs"
        >
            <NTabPane name="list" tab="题目列表" />
            <NTabPane name="calendar" tab="日历视图" />
        </NTabs>

        <!-- ── 题目列表 ──────────────────────────────────── -->
        <template v-if="activeTab === 'list'">
            <div class="toolbar">
                <NInput
                    v-model:value="search"
                    placeholder="搜索题号或标题…"
                    clearable
                    class="search-input"
                />
                <div class="filter-group">
                    <button
                        class="chip"
                        :class="{ active: filter === 'all' }"
                        @click="filter = 'all'"
                    >
                        全部
                    </button>
                    <button
                        class="chip chip-green"
                        :class="{ active: filter === 'mastered' }"
                        @click="filter = 'mastered'"
                    >
                        已掌握
                    </button>
                    <button
                        class="chip chip-red"
                        :class="{ active: filter === 'pending' }"
                        @click="filter = 'pending'"
                    >
                        待复习
                    </button>
                </div>
                <button class="btn-primary-add" @click="openAdd">+ 添加</button>
            </div>

            <div class="problem-list">
                <div
                    v-for="p in filteredList"
                    :key="p.id"
                    class="problem-card"
                    :class="{
                        passed: lastStatus(p) === true,
                        failed: lastStatus(p) === false,
                    }"
                    @click="openEdit(p)"
                >
                    <!-- 编号 -->
                    <div
                        class="card-no-badge"
                        :class="{
                            'badge-pass': lastStatus(p) === true,
                            'badge-fail': lastStatus(p) === false,
                        }"
                    >
                        {{ p.no }}
                    </div>

                    <!-- 主体 -->
                    <div class="card-body">
                        <div class="card-header-row">
                            <span class="card-title">{{ p.title }}</span>
                            <div class="card-actions">
                                <span
                                    class="last-badge"
                                    :class="
                                        lastStatus(p) === true
                                            ? 'badge-ok'
                                            : 'badge-no'
                                    "
                                >
                                    {{
                                        lastStatus(p) === true
                                            ? "✅"
                                            : lastStatus(p) === false
                                              ? "❌"
                                              : "—"
                                    }}
                                </span>
                                <a
                                    :href="
                                        `https://leetcode.cn/search/?q=` + p.no
                                    "
                                    target="_blank"
                                    rel="noopener"
                                    class="lc-link"
                                    title="在 LeetCode 打开"
                                    @click.stop
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                        />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                        <span v-if="lastNote(p)" class="card-note">{{
                            lastNote(p)
                        }}</span>
                        <div v-if="p.attempts.length" class="attempt-track">
                            <span
                                v-for="(a, i) in p.attempts"
                                :key="i"
                                class="dot"
                                :class="a.passed ? 'dot-pass' : 'dot-fail'"
                                :title="`${a.date}  ${a.passed ? '通过' : '未过'}${a.note ? ' · ' + a.note : ''}`"
                            />
                        </div>
                    </div>
                </div>

                <div v-if="filteredList.length === 0" class="empty-hint">
                    <p>没有找到相关题目</p>
                </div>
            </div>
        </template>

        <!-- ── 日历视图 ──────────────────────────────────── -->
        <template v-if="activeTab === 'calendar'">
            <div class="calendar-card">
                <div class="cal-header">
                    <span class="cal-title"
                        >{{ new Date().getFullYear() }} 年练习热力图</span
                    >
                    <div class="cal-legend">
                        <span
                            class="legend-dot"
                            :style="{ background: levelColors[0] }"
                        />
                        0次
                        <span
                            class="legend-dot"
                            :style="{ background: levelColors[1] }"
                        />
                        1次
                        <span
                            class="legend-dot"
                            :style="{ background: levelColors[2] }"
                        />
                        2-3次
                        <span
                            class="legend-dot"
                            :style="{ background: levelColors[3] }"
                        />
                        4+次
                    </div>
                </div>

                <div class="cal-grid-wrap">
                    <!-- 周标签 -->
                    <div class="week-col">
                        <div class="week-spacer" />
                        <div
                            v-for="wl in weekLabels"
                            :key="wl"
                            class="week-label"
                        >
                            {{ wl }}
                        </div>
                    </div>

                    <!-- 月份格子 -->
                    <div class="cal-grid">
                        <div
                            v-for="month in calendarMonths"
                            :key="month.key"
                            class="month-col"
                        >
                            <div class="month-label">{{ month.label }}</div>
                            <div class="month-rows">
                                <div
                                    v-for="(row, ri) in month.rows"
                                    :key="ri"
                                    class="cal-row"
                                >
                                    <div
                                        v-for="(cell, ci) in row"
                                        :key="ci"
                                        class="cal-cell"
                                        :class="{
                                            'cell-empty': !cell,
                                            'cell-future': cell?.isFuture,
                                            'cell-selected':
                                                cell &&
                                                cell.iso === selectedISO,
                                        }"
                                        :style="
                                            cell
                                                ? {
                                                      background:
                                                          levelColors[
                                                              cellLevel(
                                                                  cell.total,
                                                                  cell.isFuture,
                                                              )
                                                          ],
                                                  }
                                                : {}
                                        "
                                        :title="
                                            cell
                                                ? `${cell.iso}  尝试${cell.total}次，通过${cell.passed}次`
                                                : ''
                                        "
                                        @click="
                                            cell &&
                                            clickCell(cell.iso, cell.isFuture)
                                        "
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 选中日期的题目 -->
                <transition name="slide-down">
                    <div
                        v-if="selectedISO && selectedDayProblems.length"
                        class="day-detail"
                    >
                        <div class="day-detail-header">
                            <span class="day-detail-date"
                                >{{ selectedISO }} 的练习记录</span
                            >
                            <button class="close-btn" @click="selectedISO = ''">
                                ×
                            </button>
                        </div>
                        <div class="day-problem-list">
                            <div
                                v-for="item in selectedDayProblems"
                                :key="item.problem.id"
                                class="day-problem-row"
                                @click="openEdit(item.problem)"
                            >
                                <span class="day-prob-no"
                                    ># {{ item.problem.no }}</span
                                >
                                <span class="day-prob-title">{{
                                    item.problem.title
                                }}</span>
                                <a
                                    :href="
                                        `https://leetcode.cn/search/?q=` +
                                        item.problem.no
                                    "
                                    target="_blank"
                                    rel="noopener"
                                    class="lc-link day-lc-link"
                                    title="在 LeetCode 打开"
                                    @click.stop
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="2"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                    >
                                        <path
                                            d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                                        />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                    </svg>
                                </a>
                                <div class="day-prob-attempts">
                                    <span
                                        v-for="(a, i) in item.dayAttempts"
                                        :key="i"
                                        class="day-attempt-tag"
                                        :class="
                                            a.passed ? 'tag-pass' : 'tag-fail'
                                        "
                                    >
                                        {{ a.passed ? "✅" : "❌" }}
                                        <span
                                            v-if="a.note"
                                            class="day-attempt-note"
                                            >{{ a.note }}</span
                                        >
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- 月度柱状图 -->
            <div class="chart-card">
                <div class="chart-header">
                    <span class="chart-title">月度练习统计（{{ new Date().getFullYear() }} 年）</span>
                    <div class="chart-legend">
                        <span class="legend-item">
                            <span class="legend-bar" style="background:#3b82f6" />通过
                        </span>
                        <span class="legend-item">
                            <span class="legend-bar" style="background:#f97316" />未过
                        </span>
                    </div>
                </div>
                <div class="chart-wrap">
                    <svg
                        :viewBox="`-28 -10 ${BCW + 36} ${BCH + 32}`"
                        width="100%"
                        :height="BCH + 42"
                        class="bar-chart"
                    >
                        <!-- 横向参考线 -->
                        <line x1="0" :y1="BCH * 0.1" :x2="BCW" :y2="BCH * 0.1"
                            stroke="var(--border-soft)" stroke-width="0.8" stroke-dasharray="4,4" />
                        <line x1="0" :y1="BCH * 0.55" :x2="BCW" :y2="BCH * 0.55"
                            stroke="var(--border-soft)" stroke-width="0.8" stroke-dasharray="4,4" />
                        <!-- 基线 -->
                        <line x1="0" :y1="BCH" :x2="BCW" :y2="BCH"
                            stroke="var(--border-soft)" stroke-width="1" />

                        <!-- Y轴标签 -->
                        <text x="-4" :y="BCH * 0.1 + 4" font-size="9" fill="var(--text-tertiary)" text-anchor="end">{{ barChartData.max }}</text>
                        <text x="-4" :y="BCH * 0.55 + 4" font-size="9" fill="var(--text-tertiary)" text-anchor="end">{{ barChartData.midLabel }}</text>
                        <text x="-4" :y="BCH + 4" font-size="9" fill="var(--text-tertiary)" text-anchor="end">0</text>

                        <!-- 柱子组 -->
                        <g v-for="b in barChartData.bars" :key="b.label">
                            <!-- 通过（蓝） -->
                            <rect
                                v-if="b.passH > 0"
                                :x="b.passX" :y="BCH - b.passH"
                                :width="BAR_W" :height="b.passH"
                                fill="#3b82f6" rx="3" ry="3"
                                style="cursor:pointer"
                            >
                                <title>{{ b.label }} 通过：{{ b.passed }} 次</title>
                            </rect>
                            <!-- 未过（橙） -->
                            <rect
                                v-if="b.failH > 0"
                                :x="b.failX" :y="BCH - b.failH"
                                :width="BAR_W" :height="b.failH"
                                fill="#f97316" rx="3" ry="3"
                                style="cursor:pointer"
                            >
                                <title>{{ b.label }} 未过：{{ b.failed }} 次</title>
                            </rect>
                            <!-- 无数据占位线 -->
                            <line
                                v-if="b.passH === 0 && b.failH === 0"
                                :x1="b.passX" :y1="BCH - 1"
                                :x2="b.failX + BAR_W" :y2="BCH - 1"
                                stroke="var(--border-soft)" stroke-width="1.5"
                            />
                            <!-- 月份标签 -->
                            <text :x="b.labelX" :y="BCH + 16" font-size="9"
                                fill="var(--text-tertiary)" text-anchor="middle">{{ b.label }}</text>
                            <!-- 数值标签（有数据时才显示） -->
                            <text
                                v-if="b.passed > 0"
                                :x="b.passX + BAR_W / 2" :y="BCH - b.passH - 3"
                                font-size="8" fill="#3b82f6" text-anchor="middle">{{ b.passed }}</text>
                            <text
                                v-if="b.failed > 0"
                                :x="b.failX + BAR_W / 2" :y="BCH - b.failH - 3"
                                font-size="8" fill="#f97316" text-anchor="middle">{{ b.failed }}</text>
                        </g>
                    </svg>
                </div>
            </div>
        </template>

        <!-- ── 编辑/新增弹窗 ─────────────────────────────── -->
        <NModal
            v-model:show="showModal"
            preset="card"
            :title="editingId ? `编辑：#${formNo} ${formTitle}` : '添加新题目'"
            style="max-width: 540px; width: 92vw"
        >
            <div class="modal-body">
                <div class="form-grid">
                    <div class="field">
                        <label class="field-label">题号</label>
                        <NInput
                            v-model:value="formNo"
                            placeholder="283"
                            type="text"
                        />
                    </div>
                    <div class="field field-wide">
                        <label class="field-label">标题</label>
                        <NInput
                            v-model:value="formTitle"
                            placeholder="移动零"
                        />
                    </div>
                </div>

                <div class="field-label attempts-label">练习记录</div>
                <div class="attempts-scroll">
                    <div
                        v-for="(a, idx) in formAttempts"
                        :key="idx"
                        class="attempt-row"
                    >
                        <div class="attempt-top">
                            <NInput
                                v-model:value="a.date"
                                placeholder="2026.03.28"
                                class="input-date"
                                :status="
                                    a.date && !isValidLcDate(a.date)
                                        ? 'error'
                                        : undefined
                                "
                            />
                            <div class="switch-wrap">
                                <NSwitch
                                    v-model:value="a.passed"
                                    :rail-style="
                                        () =>
                                            a.passed
                                                ? 'background:#18a058'
                                                : 'background:#d03050'
                                    "
                                />
                                <span class="switch-label">{{
                                    a.passed ? "✅ 通过" : "❌ 未过"
                                }}</span>
                            </div>
                            <button
                                class="btn-del-attempt"
                                @click="removeAttempt(idx)"
                            >
                                ×
                            </button>
                        </div>
                        <NInput
                            v-model:value="a.note"
                            placeholder="笔记（可选）"
                            class="input-note"
                        />
                    </div>
                </div>

                <button class="btn-add-attempt" @click="addAttempt">
                    + 添加一次练习
                </button>
            </div>

            <template #footer>
                <div class="modal-footer">
                    <NButton
                        v-if="editingId"
                        type="error"
                        ghost
                        size="small"
                        @click="handleDelete"
                        >删除题目</NButton
                    >
                    <div class="footer-actions">
                        <NButton size="small" @click="showModal = false"
                            >取消</NButton
                        >
                        <NButton type="primary" size="small" @click="handleSave"
                            >保存</NButton
                        >
                    </div>
                </div>
            </template>
        </NModal>

        <!-- ── 目标弹窗 ───────────────────────────────────── -->
        <NModal
            v-model:show="showGoalModal"
            preset="card"
            :title="editingGoalId ? '编辑目标' : '添加目标'"
            style="max-width: 380px; width: 90vw"
        >
            <div class="goal-form">
                <div class="goal-field-row">
                    <div class="goal-field">
                        <label class="goal-field-label">年份</label>
                        <NSelect
                            v-model:value="goalFormYear"
                            :options="yearOptions"
                        />
                    </div>
                    <div class="goal-field">
                        <label class="goal-field-label">目标题数</label>
                        <NInput
                            :value="String(goalFormTarget)"
                            type="text"
                            placeholder="如 200"
                            @update:value="
                                (v) => (goalFormTarget = Number(v) || 0)
                            "
                        />
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="modal-footer">
                    <NButton
                        v-if="editingGoalId"
                        type="error"
                        ghost
                        size="small"
                        @click="handleDeleteGoal"
                        >删除目标</NButton
                    >
                    <div class="footer-actions">
                        <NButton size="small" @click="showGoalModal = false"
                            >取消</NButton
                        >
                        <NButton
                            type="primary"
                            size="small"
                            @click="handleSaveGoal"
                            >保存</NButton
                        >
                    </div>
                </div>
            </template>
        </NModal>
    </div>
</template>

<style scoped>
/* ── 整体 ─────────────────────────── */
.page-lc {
    max-width: 100%;
}

/* ── 页头 ─────────────────────────── */
.lc-header {
    margin-bottom: 24px;
}
.lc-header-inner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px 28px;
    background: linear-gradient(
        135deg,
        rgba(99, 102, 241, 0.09) 0%,
        rgba(34, 197, 94, 0.06) 100%
    );
    border-radius: var(--radius-xl);
    border: 1px solid rgba(99, 102, 241, 0.12);
    box-shadow: var(--shadow-sm);
}
.lc-header-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #6366f1, #22c55e);
    border-radius: var(--radius-lg);
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}
.lc-title {
    margin: 0 0 4px;
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.3px;
}
.lc-subtitle {
    margin: 0;
    font-size: 14px;
    color: var(--text-secondary);
}

/* ── 统计 ─────────────────────────── */
.stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
}
.stat-card {
    flex: 1;
    padding: 16px 10px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border-soft);
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.stat-num {
    font-size: 24px;
    font-weight: 700;
    line-height: 1;
}
.stat-num.primary {
    color: var(--primary-color);
}
.stat-num.green {
    color: #3b82f6;
}
.stat-num.red {
    color: #f97316;
}
.stat-num.gradient {
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
.stat-label {
    font-size: 12px;
    color: var(--text-tertiary);
}

/* ── 目标 ─────────────────────────── */
.goals-section {
    margin-bottom: 20px;
}
.goals-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}
.goals-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}
.btn-add-goal {
    padding: 4px 14px;
    border-radius: 16px;
    border: 1px dashed var(--primary-color);
    background: none;
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}
.btn-add-goal:hover {
    background: var(--primary-soft);
}

.goals-empty {
    padding: 16px 20px;
    background: var(--bg-card);
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
    font-size: 13px;
    color: var(--text-tertiary);
    text-align: center;
}

.goals-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.goal-card {
    padding: 16px 18px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.goal-card:hover {
    box-shadow: var(--shadow-md);
    border-color: rgba(99, 102, 241, 0.25);
    transform: translateY(-1px);
}

.goal-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.goal-info {
    display: flex;
    align-items: center;
    gap: 8px;
}
.goal-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(99, 102, 241, 0.12);
    color: var(--primary-color);
}
.goal-period {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}

.goal-count {
    display: flex;
    align-items: baseline;
    gap: 2px;
}
.goal-done {
    font-size: 22px;
    font-weight: 700;
    color: var(--primary-color);
    line-height: 1;
}
.goal-sep,
.goal-unit {
    font-size: 13px;
    color: var(--text-tertiary);
}
.goal-target {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-secondary);
}

.goal-bar-wrap {
    height: 8px;
    background: var(--border-soft);
    border-radius: 4px;
    overflow: hidden;
}
.goal-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: var(--primary-gradient);
    transition: width 0.4s ease;
    min-width: 4px;
}
.goal-bar-fill.bar-done {
    background: linear-gradient(90deg, #3b82f6, #6366f1);
}

.goal-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.goal-card-right {
    display: flex;
    align-items: center;
    gap: 8px;
}
.goal-del-btn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid var(--border-soft);
    background: none;
    color: var(--text-tertiary);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
}
.goal-del-btn:hover {
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    border-color: #f97316;
}
.goal-pct {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-color);
}
.goal-remain {
    font-size: 12px;
    color: var(--text-tertiary);
}
.goal-badge-done {
    font-size: 13px;
    font-weight: 600;
    color: #3b82f6;
}

/* ── 目标弹窗 ─────────────────────── */
.goal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.goal-field-row {
    display: flex;
    gap: 10px;
}
.goal-field {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.goal-field-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
}

/* ── Tab ─────────────────────────── */
.main-tabs {
    margin-bottom: 20px;
}

/* ── 工具栏 ──────────────────────── */
.toolbar {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 14px;
    flex-wrap: wrap;
}
.search-input {
    flex: 1;
    min-width: 130px;
}
.filter-group {
    display: flex;
    gap: 6px;
}
.chip {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid var(--border-soft);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.18s;
    white-space: nowrap;
}
.chip.active {
    background: var(--primary-soft);
    color: var(--primary-color);
    border-color: var(--primary-color);
    font-weight: 600;
}
.chip-green.active {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border-color: #3b82f6;
}
.chip-red.active {
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    border-color: #f97316;
}

.btn-primary-add {
    padding: 6px 18px;
    border-radius: 20px;
    border: none;
    background: var(--primary-gradient);
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.28);
    transition: all 0.2s;
}
.btn-primary-add:hover {
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
}

/* ── 题目卡片 ─────────────────────── */
.problem-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.problem-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--bg-card);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow-sm);
    cursor: pointer;
    transition: all 0.15s ease;
    border-left: 3px solid transparent;
}
.problem-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
}
.problem-card.passed {
    border-left-color: #3b82f6;
}
.problem-card.failed {
    border-left-color: #f97316;
}

.card-no-badge {
    width: 44px;
    height: 44px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    flex-shrink: 0;
    background: var(--bg-page);
    border: 1px solid var(--border-soft);
    color: var(--text-secondary);
}
.card-no-badge.badge-pass {
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
}
.card-no-badge.badge-fail {
    background: rgba(249, 115, 22, 0.1);
    border-color: rgba(249, 115, 22, 0.3);
    color: #f97316;
}

.card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.card-header-row {
    display: flex;
    align-items: center;
    gap: 8px;
}
.card-title {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.card-note {
    font-size: 12px;
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* ── attempt track ─────────────────── */
.attempt-track {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    margin-top: 2px;
}
/* 连接线 */
.attempt-track::before {
    content: "";
    position: absolute;
    left: 5px;
    right: 5px;
    top: 50%;
    height: 2px;
    background: var(--border-soft);
    border-radius: 1px;
    z-index: 0;
}
.dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
    transition: transform 0.15s;
}
.dot:hover {
    transform: scale(1.35);
}
.dot-pass {
    background: #3b82f6;
    box-shadow:
        0 0 0 2px rgba(59, 130, 246, 0.22),
        0 0 7px rgba(59, 130, 246, 0.45);
}
.dot-fail {
    background: #f97316;
    box-shadow:
        0 0 0 2px rgba(249, 115, 22, 0.2),
        0 0 7px rgba(249, 115, 22, 0.4);
}

.card-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
}
.last-badge {
    font-size: 15px;
    line-height: 1;
}
.lc-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    color: var(--text-tertiary);
    text-decoration: none;
    transition: all 0.15s;
    flex-shrink: 0;
}
.lc-link svg {
    width: 14px;
    height: 14px;
}
.lc-link:hover {
    background: var(--primary-soft);
    color: var(--primary-color);
}
.day-lc-link {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
}

.empty-hint {
    text-align: center;
    padding: 48px;
    color: var(--text-tertiary);
    font-size: 15px;
}

/* ── 日历视图 ─────────────────────── */
.calendar-card {
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow-sm);
    padding: 24px;
}

/* ── 折线图 ────────────────────────── */
.chart-card {
    margin-top: 16px;
    background: var(--bg-card);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-soft);
    box-shadow: var(--shadow-sm);
    padding: 20px 24px 16px;
}
.chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    flex-wrap: wrap;
    gap: 8px;
}
.chart-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}
.chart-legend {
    display: flex;
    align-items: center;
    gap: 14px;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: var(--text-tertiary);
}
.legend-bar {
    display: inline-block;
    width: 12px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
}
.chart-wrap {
    width: 100%;
    overflow-x: auto;
}
.bar-chart {
    display: block;
    overflow: visible;
}

.cal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    flex-wrap: wrap;
    gap: 10px;
}
.cal-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-primary);
}
.cal-legend {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-tertiary);
}
.legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    display: inline-block;
    border: 1px solid rgba(0, 0, 0, 0.08);
}

.cal-grid-wrap {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 6px;
}

.week-col {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex-shrink: 0;
}
.week-spacer {
    height: 18px;
}
.week-label {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--text-tertiary);
}

.cal-grid {
    display: flex;
    gap: 10px;
}
.month-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.month-label {
    height: 18px;
    font-size: 11px;
    color: var(--text-tertiary);
    text-align: center;
}
.month-rows {
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.cal-row {
    display: flex;
    gap: 3px;
}

.cal-cell {
    width: 14px;
    height: 14px;
    min-width: 14px;
    border-radius: 3px;
    cursor: pointer;
    transition:
        transform 0.1s,
        box-shadow 0.1s;
    border: 1px solid rgba(0, 0, 0, 0.06);
}
.cal-cell.cell-empty {
    background: transparent !important;
    border-color: transparent;
    cursor: default;
    pointer-events: none;
}
.cal-cell.cell-future {
    opacity: 0.4;
    cursor: default;
}
.cal-cell.cell-selected {
    box-shadow: 0 0 0 2px var(--primary-color);
    transform: scale(1.2);
    z-index: 1;
}
.cal-cell:not(.cell-empty):not(.cell-future):hover {
    transform: scale(1.18);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* ── 日期详情 ─────────────────────── */
.day-detail {
    margin-top: 20px;
    border-top: 1px solid var(--border-soft);
    padding-top: 16px;
}
.day-detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}
.day-detail-date {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}
.close-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-soft);
    background: none;
    color: var(--text-tertiary);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    transition: all 0.15s;
}
.close-btn:hover {
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    border-color: #f97316;
}

.day-problem-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.day-problem-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 14px;
    background: var(--bg-page);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-soft);
    cursor: pointer;
    transition: all 0.15s;
    flex-wrap: wrap;
}
.day-problem-row:hover {
    border-color: var(--primary-color);
    background: var(--primary-soft);
}
.day-prob-no {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-tertiary);
    white-space: nowrap;
    padding-top: 2px;
}
.day-prob-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}
.day-prob-attempts {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.day-attempt-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
}
.day-attempt-tag.tag-pass {
    background: rgba(59, 130, 246, 0.12);
    color: #3b82f6;
}
.day-attempt-tag.tag-fail {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
}
.day-attempt-note {
    color: var(--text-secondary);
}

/* ── 过渡 ─────────────────────────── */
.slide-down-enter-active {
    transition: all 0.25s ease;
}
.slide-down-leave-active {
    transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* ── 弹窗 ─────────────────────────── */
.modal-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-grid {
    display: grid;
    grid-template-columns: 90px 1fr;
    gap: 10px;
    align-items: end;
}
.field {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.field-wide {
    grid-column: span 1;
}

.field-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
}
.attempts-label {
    margin-top: 4px;
}

.attempts-scroll {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 280px;
    overflow-y: auto;
    padding-right: 2px;
}

.attempt-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background: var(--bg-page);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-soft);
}
.attempt-top {
    display: flex;
    align-items: center;
    gap: 8px;
}
.input-date {
    width: 120px;
    flex-shrink: 0;
}
.switch-wrap {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
}
.switch-label {
    font-size: 13px;
    color: var(--text-secondary);
    white-space: nowrap;
}
.btn-del-attempt {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-soft);
    background: none;
    color: var(--text-tertiary);
    font-size: 15px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
}
.btn-del-attempt:hover {
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    border-color: #f97316;
}

.btn-add-attempt {
    align-self: flex-start;
    padding: 7px 14px;
    border-radius: var(--radius-md);
    border: 1px dashed var(--border-color);
    background: none;
    color: var(--primary-color);
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
}
.btn-add-attempt:hover {
    background: var(--primary-soft);
    border-color: var(--primary-color);
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.footer-actions {
    display: flex;
    gap: 8px;
}
</style>
