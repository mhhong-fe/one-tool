import { ref, computed } from 'vue'
import { createStorage } from '../utils/storage'
import { DataType } from '../types'
import type { LeetCodeData, LeetCodeProblem, LeetCodeGoal } from '../types'

const DEFAULT_PROBLEMS: LeetCodeProblem[] = [
  { id: '1', no: 283, title: '移动零', attempts: [{ date: '2026.02.11', passed: false, note: '' }, { date: '2026.02.14', passed: true, note: '' }, { date: '2026.02.27', passed: true, note: '' }, { date: '2026.03.17', passed: true, note: '' }] },
  { id: '2', no: 49, title: '字母异位词分组', attempts: [{ date: '2026.03.17', passed: true, note: '简单，但也需要动手做才行' }] },
  { id: '3', no: 128, title: '最长连续序列', attempts: [{ date: '2026.03.17', passed: true, note: 'O(n)复杂度未实现' }, { date: '2026.03.17', passed: false, note: '用set实现O(n)' }] },
  { id: '4', no: 11, title: '盛水最多的容器', attempts: [{ date: '2026.03.19', passed: true, note: '' }] },
  { id: '5', no: 15, title: '三数之和', attempts: [{ date: '2026.02.12', passed: false, note: '双指针 + 三次去重' }, { date: '2026.03.20', passed: true, note: '' }] },
  { id: '6', no: 42, title: '接雨水', attempts: [{ date: '2026.02.12', passed: false, note: 'height[i] = min(leftMax, rightMax)' }, { date: '2026.03.20', passed: true, note: '写出来了，但边界不需要特殊判断' }] },
  { id: '7', no: 438, title: '找到字符串中所有字母的异位词', attempts: [{ date: '2026.02.13', passed: false, note: '' }, { date: '2026.02.14', passed: true, note: '用26位数组存异位词，怎么构建滑动窗口' }, { date: '2026.03.20', passed: false, note: '完全忘记。怎么比较两个字符串是否相等，用26位数组表示一个字符串，窗口大小满足时，进行比较。窗口滑动，右边添加，左边收缩' }, { date: '2026.03.22', passed: true, note: '' }] },
  { id: '8', no: 3, title: '无重复字符的最长子串', attempts: [{ date: '2026.02.13', passed: false, note: '' }, { date: '2026.03.20', passed: true, note: '能写出来，但不够优雅，记忆不够熟练' }, { date: '2026.03.22', passed: true, note: '' }] },
  { id: '9', no: 560, title: '和为 K 的子数组', attempts: [{ date: '2026.02.13', passed: false, note: '前缀和' }, { date: '2026.03.23', passed: false, note: 'map存此前所有前缀和sum[0,i]的数量，preSum存当前前缀和sum[0,j]，map里preSum-k的数量即以j为结尾的' }] },
  { id: '10', no: 239, title: '滑动窗口最大值', attempts: [{ date: '2026.02.14', passed: false, note: '' }, { date: '2026.02.17', passed: false, note: '边界不明' }, { date: '2026.03.23', passed: false, note: '维护一个最大值的递减队列，队列里存索引，便于判断是否在窗口外' }] },
  { id: '11', no: 53, title: '最大子数组和', attempts: [{ date: '2026.02.17', passed: true, note: '' }, { date: '2026.03.24', passed: false, note: '' }] },
  { id: '12', no: 56, title: '合并区间', attempts: [{ date: '2026.02.17', passed: false, note: '' }, { date: '2026.02.18', passed: true, note: '' }, { date: '2026.03.24', passed: false, note: '每次比较res最后一个和当前遍历值即可，区间分割后就加入res' }] },
  { id: '13', no: 189, title: '轮转数组', attempts: [{ date: '2026.02.20', passed: false, note: '三次反转' }, { date: '2026.03.24', passed: false, note: '整体反转、单独转左边，单独转右边' }] },
  { id: '14', no: 238, title: '除自身以外的乘积', attempts: [{ date: '2026.02.21', passed: true, note: '没有考虑空间O(1)，可以用一个数表示前缀、后缀' }, { date: '2026.03.24', passed: false, note: '用数组存左边乘积，用一个变量存右边乘积' }] },
  { id: '15', no: 41, title: '缺失的第一个正数', attempts: [{ date: '2026.02.21', passed: true, note: '空间O(1)未实现' }, { date: '2026.03.24', passed: true, note: '空间O(1)依旧不会' }] },
  { id: '16', no: 121, title: '买卖股票的最佳时机', attempts: [{ date: '2026.02.21', passed: true, note: '' }, { date: '2026.03.12', passed: true, note: '' }, { date: '2026.03.24', passed: true, note: '维护此前最小值，和全局最大利润' }] },
  { id: '17', no: 122, title: '买卖股票的最佳时机 II', attempts: [{ date: '2026.03.12', passed: true, note: '' }, { date: '2026.03.24', passed: true, note: '只要有第二天有利润，当天就卖入，第二天卖出' }] },
  { id: '18', no: 55, title: '跳跃游戏', attempts: [{ date: '2026.02.23', passed: false, note: '' }, { date: '2026.02.26', passed: false, note: '边界判断有问题，先判断这一步能不能到，再更新最远距离' }, { date: '2026.03.24', passed: true, note: '' }] },
  { id: '19', no: 45, title: '跳跃游戏 二', attempts: [{ date: '2026.02.23', passed: false, note: '' }, { date: '2026.02.26', passed: false, note: 'bfs + 贪心的思想，依旧没想出来' }, { date: '2026.03.24', passed: true, note: '维护当前最远 + 下一步最远，类似bfs' }] },
  { id: '20', no: 763, title: '划分字母区间', attempts: [{ date: '2026.02.24', passed: false, note: '维护每个字母最后位置的索引' }, { date: '2026.03.24', passed: true, note: '不熟练' }] },
  { id: '21', no: 73, title: '矩阵置零', attempts: [{ date: '2026.02.24', passed: false, note: '体力活，遍历记录零的位置，再遍历置零' }, { date: '2026.03.24', passed: true, note: '用第一行、第一列存，再用两个变量存第一行、第一列' }] },
  { id: '22', no: 54, title: '螺旋矩阵', attempts: [{ date: '2026.02.25', passed: false, note: '四个方向遍历 + 最后一行/最后一列单独处理' }, { date: '2026.03.25', passed: true, note: '' }] },
  { id: '23', no: 59, title: '螺旋矩阵 2', attempts: [{ date: '2026.02.25', passed: false, note: '四个方向遍历生成，直到num = n * n' }, { date: '2026.03.25', passed: true, note: '' }] },
  { id: '24', no: 48, title: '旋转数组', attempts: [{ date: '2026.02.25', passed: false, note: '两次翻转实现旋转90度' }] },
  { id: '25', no: 240, title: '搜索二维矩阵 二', attempts: [{ date: '2026.02.25', passed: false, note: '每次对比矩阵右上角的值和目标值' }, { date: '2026.03.26', passed: true, note: '' }] },
  { id: '26', no: 160, title: '相交链表', attempts: [{ date: '2026.02.26', passed: true, note: 'a链表长度 a+m；b链表长度 b+m；两段链表都走了 a+b+m时，就会相遇' }] },
  { id: '27', no: 206, title: '反转链表', attempts: [{ date: '2026.02.26', passed: false, note: '反转的顺序没搞清楚' }, { date: '2026.02.28', passed: true, note: '' }, { date: '2026.03.26', passed: true, note: '' }] },
  { id: '28', no: 234, title: '回文链表', attempts: [{ date: '2026.02.26', passed: false, note: '找中点、反转右后段的链表、比较，细节还挺多的' }, { date: '2026.03.26', passed: true, note: '' }] },
  { id: '29', no: 141, title: '环形链表', attempts: [{ date: '2026.02.27', passed: true, note: '快慢指针' }] },
  { id: '30', no: 142, title: '环形链表 2', attempts: [{ date: '2026.02.27', passed: false, note: '需要一点点数学证明' }] },
  { id: '31', no: 21, title: '合并两个有序列表', attempts: [{ date: '2026.02.27', passed: false, note: '' }] },
  { id: '32', no: 2, title: '两数相加', attempts: [{ date: '2026.02.27', passed: true, note: '不存在的节点就当成0处理，方便很多' }] },
  { id: '33', no: 19, title: '删除倒数第n个节点', attempts: [{ date: '2026.02.28', passed: false, note: '考虑删除头节点的情况，增加虚拟节点preHead' }] },
  { id: '34', no: 24, title: '两两交换链表中的节点', attempts: [{ date: '2026.02.28', passed: false, note: '没交换明白' }] },
  { id: '35', no: 148, title: '排序链表', attempts: [{ date: '2026.02.28', passed: false, note: '归并排序，找中点，划分两段，自底向上合并有序链表' }] },
  { id: '36', no: 94, title: '二叉树的中序遍历', attempts: [{ date: '2026.03.01', passed: false, note: '压左 → 弹出 → 转右' }] },
  { id: '37', no: 144, title: '二叉树的前序遍历', attempts: [{ date: '2026.03.02', passed: false, note: '压右再压左' }] },
  { id: '38', no: 145, title: '二叉树的后序遍历', attempts: [{ date: '2026.03.02', passed: false, note: '左-右-根，可以用根-右-左+反转实现，是前序遍历的变形' }] },
  { id: '39', no: 102, title: '二叉树的层序遍历', attempts: [{ date: '2026.03.02', passed: false, note: '' }] },
  { id: '40', no: 104, title: '二叉树的最大深度', attempts: [{ date: '2026.03.02', passed: true, note: '这道题可以递归，也可以用层序遍历来做' }] },
  { id: '41', no: 226, title: '翻转二叉树', attempts: [{ date: '2026.03.03', passed: false, note: '没搞清楚怎么递归' }] },
  { id: '42', no: 101, title: '对称二叉树', attempts: [{ date: '2026.03.03', passed: false, note: '递归判断两颗子树是否对称' }] },
  { id: '43', no: 543, title: '二叉树的直径', attempts: [{ date: '2026.03.03', passed: false, note: '直径 = 左子树深度 + 右子树深度' }] },
  { id: '44', no: 108, title: '将有序数组转为二叉搜索树', attempts: [{ date: '2026.03.03', passed: false, note: '不知道二叉搜索树是啥' }] },
  { id: '45', no: 98, title: '验证二叉搜索树', attempts: [{ date: '2026.03.04', passed: false, note: '当前节点满足 + 左子树满足 + 右子树满足' }] },
  { id: '46', no: 230, title: '二叉搜索树中第k小的元素', attempts: [{ date: '2026.03.04', passed: false, note: '二叉搜索树的中序遍历结果，就是升序数组' }] },
  { id: '47', no: 199, title: '二叉树的右视图', attempts: [{ date: '2026.03.04', passed: false, note: 'bfs，收集当层最后一个元素；dfs，收集第一个到达本层的最右边元素' }] },
  { id: '48', no: 114, title: '二叉树展开为链表', attempts: [{ date: '2026.03.04', passed: false, note: 'dfs含义，把当前树，展开为节点，并让prev指向头节点' }] },
  { id: '49', no: 236, title: '二叉树最近的公共祖先', attempts: [{ date: '2026.03.04', passed: false, note: '' }] },
  { id: '50', no: 200, title: '岛屿数量', attempts: [{ date: '2026.03.05', passed: false, note: '应该还算比较简单' }] },
  { id: '51', no: 994, title: '腐烂的橘子', attempts: [{ date: '2026.03.05', passed: false, note: 'bfs存腐烂的橘子坐标，每分钟向四周扩散' }] },
  { id: '52', no: 207, title: '课程表', attempts: [{ date: '2026.03.05', passed: false, note: '理解图论，点 + 边' }] },
  { id: '53', no: 46, title: '全排列', attempts: [{ date: '2026.03.06', passed: false, note: 'dfs，当前位置要加入哪个元素，因此dfs里需要遍历' }, { date: '2026.03.09', passed: true, note: '' }] },
  { id: '54', no: 78, title: '子集', attempts: [{ date: '2026.03.06', passed: false, note: 'dfs，加入或者不加入当前元素' }, { date: '2026.03.09', passed: false, note: '' }] },
  { id: '55', no: 17, title: '电话号码的字母组合', attempts: [{ date: '2026.03.06', passed: false, note: 'dfs，当前位置要拼一个字母' }, { date: '2026.03.09', passed: true, note: '' }] },
  { id: '56', no: 39, title: '组合总数', attempts: [{ date: '2026.03.09', passed: false, note: '' }, { date: '2026.03.10', passed: false, note: '' }] },
  { id: '57', no: 22, title: '括号生成', attempts: [{ date: '2026.03.09', passed: false, note: '' }] },
  { id: '58', no: 79, title: '单词搜索', attempts: [{ date: '2026.03.09', passed: false, note: '' }] },
  { id: '59', no: 75, title: '颜色分类', attempts: [{ date: '2026.03.09', passed: true, note: '三指针做法没写出来' }] },
  { id: '60', no: 35, title: '搜索插入位置', attempts: [{ date: '2026.03.10', passed: true, note: '简单二分法' }] },
  { id: '61', no: 74, title: '搜索二维矩阵', attempts: [{ date: '2026.03.10', passed: true, note: '' }] },
  { id: '62', no: 34, title: '在排序数组中查找元素的第一个和最后一个位置', attempts: [{ date: '2026.03.10', passed: true, note: '不满足logN的要求，应该用两次二分法' }] },
  { id: '63', no: 33, title: '搜索旋转排序数组', attempts: [{ date: '2026.03.10', passed: false, note: '一定有一半是有序的' }] },
  { id: '64', no: 153, title: '寻找旋转排序数组中的最小值', attempts: [{ date: '2026.03.10', passed: false, note: '断点即最小值，比较mid和right可知断点在哪一部分' }] },
  { id: '65', no: 20, title: '有效的括号', attempts: [{ date: '2026.03.10', passed: true, note: '' }] },
  { id: '66', no: 155, title: '最小栈', attempts: [{ date: '2026.03.11', passed: false, note: '' }] },
  { id: '67', no: 394, title: '字符串解码', attempts: [{ date: '2026.03.11', passed: false, note: '' }] },
  { id: '68', no: 739, title: '每日温度', attempts: [{ date: '2026.03.11', passed: false, note: '维护一个递减栈' }] },
  { id: '69', no: 70, title: '爬楼梯', attempts: [{ date: '2026.03.12', passed: false, note: '不用数组，用两个变量就行' }] },
  { id: '70', no: 118, title: '杨辉三角', attempts: [{ date: '2026.03.12', passed: true, note: '怎么优雅处理第一行/第二行数据，可以不特殊处理' }] },
  { id: '71', no: 198, title: '打家劫舍', attempts: [{ date: '2026.03.12', passed: false, note: '' }] },
  { id: '72', no: 279, title: '完全平方数', attempts: [{ date: '2026.03.13', passed: false, note: 'dp[i]，拼成i，需要的平方数数量' }] },
  { id: '73', no: 322, title: '零钱兑换', attempts: [{ date: '2026.03.13', passed: false, note: 'dp[i]，兑换i，需要的零钱数量' }] },
  { id: '74', no: 139, title: '单词拆分', attempts: [{ date: '2026.03.13', passed: false, note: 'dp[i]，拼接s[0,i]能否拼成' }] },
  { id: '75', no: 152, title: '乘积最大子数组', attempts: [{ date: '2026.03.13', passed: false, note: '最大、最小' }] },
  { id: '76', no: 416, title: '分割等和子集', attempts: [{ date: '2026.03.13', passed: false, note: '本题等价于，是否有子序列和=sum/2' }] },
  { id: '77', no: 136, title: '只出现一次的数字', attempts: [{ date: '2026.03.16', passed: false, note: '位运算' }] },
  { id: '78', no: 62, title: '不同路径', attempts: [{ date: '2026.03.16', passed: false, note: '排列组合' }] },
  { id: '79', no: 64, title: '最小路径和', attempts: [{ date: '2026.03.16', passed: false, note: '最小路径和，可以原地改' }] },
  { id: '80', no: 5, title: '最长回文子串', attempts: [{ date: '2026.03.16', passed: false, note: '中心扩散' }] },
  { id: '81', no: 1143, title: '最长公共子序列', attempts: [{ date: '2026.03.16', passed: false, note: 'dp[i][j]，text1的前i的字符，text2的前j个字符的最长公共子序列' }] },
  { id: '82', no: 72, title: '编辑距离', attempts: [{ date: '2026.03.16', passed: false, note: 'dp[i][j]' }] },
  { id: '83', no: 169, title: '多数元素', attempts: [{ date: '2026.03.16', passed: false, note: '摩尔投票，技巧性很强' }] },
]

const DEFAULT_DATA: LeetCodeData = {
  detail: '',
  problems: DEFAULT_PROBLEMS,
  goals: [],
}

const store = createStorage<LeetCodeData>(DataType.LEETCODE, DEFAULT_DATA)

// 模块级响应式状态
const data = ref<LeetCodeData>({ ...DEFAULT_DATA, problems: [...DEFAULT_PROBLEMS] })
const loading = ref(false)

async function load(): Promise<void> {
  loading.value = true
  try {
    const d = await store.get()
    data.value = d
  } finally {
    loading.value = false
  }
}

async function persist(): Promise<void> {
  await store.set(data.value)
}

export function useLeetCode() {
  const list = computed(() => data.value.problems)
  const detail = computed(() => data.value.detail)

  const stats = computed(() => {
    const total = data.value.problems.length
    const mastered = data.value.problems.filter((p) => {
      const last = p.attempts[p.attempts.length - 1]
      return last?.passed === true
    }).length
    return { total, mastered, pending: total - mastered }
  })

  async function updateDetail(val: string): Promise<void> {
    data.value = { ...data.value, detail: val }
    await persist()
  }

  function add(problem: Omit<LeetCodeProblem, 'id'>): void {
    const id = `lc_${Date.now()}`
    data.value = { ...data.value, problems: [...data.value.problems, { ...problem, id }] }
    persist()
  }

  function update(id: string, patch: Partial<Omit<LeetCodeProblem, 'id'>>): void {
    data.value = {
      ...data.value,
      problems: data.value.problems.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }
    persist()
  }

  function remove(id: string): void {
    data.value = { ...data.value, problems: data.value.problems.filter((p) => p.id !== id) }
    persist()
  }

  // ── 目标 CRUD ──────────────────────────────────────────
  const goalList = computed(() => data.value.goals)

  function goalProgress(goal: LeetCodeGoal) {
    const prefix = `${goal.year}.`
    const seen = new Set<string>()
    data.value.problems.forEach((p) => {
      p.attempts.forEach((a) => {
        if (a.date.startsWith(prefix)) seen.add(p.id)
      })
    })
    const done = seen.size
    const pct = goal.target > 0 ? Math.min(100, Math.round((done / goal.target) * 100)) : 0
    return { done, pct }
  }

  function addGoal(g: Omit<LeetCodeGoal, 'id'>): void {
    data.value = {
      ...data.value,
      goals: [...data.value.goals, { ...g, id: `goal_${Date.now()}` }],
    }
    persist()
  }

  function updateGoal(id: string, patch: Partial<Omit<LeetCodeGoal, 'id'>>): void {
    data.value = {
      ...data.value,
      goals: data.value.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    }
    persist()
  }

  function removeGoal(id: string): void {
    data.value = { ...data.value, goals: data.value.goals.filter((g) => g.id !== id) }
    persist()
  }

  function exportData(): void {
    const json = JSON.stringify(data.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `LEETCODE-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    list, stats, detail, loading,
    load, updateDetail, exportData,
    add, update, remove,
    goalList, goalProgress, addGoal, updateGoal, removeGoal,
  }
}
