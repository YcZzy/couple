/**
 * @typedef {Object} Argument
 * @property {string} id - 唯一标识符
 * @property {string} date - 争吵日期
 * @property {string} category - 分类ID
 * @property {number} severity - 严重程度，1: Minor, 2: Moderate, 3: Severe
 * @property {('ongoing'|'resolved')} status - 状态，ongoing或resolved
 * @property {string} [resolution] - 解决方案
 * @property {string} [reflection] - 反思
 */

/**
 * @typedef {Object} Category
 * @property {string} id - 唯一标识符
 * @property {string} name - 分类名称
 * @property {string} color - 颜色值，如'#4F46E5'
 */

/**
 * @typedef {Object} Reward
 * @property {string} id - 唯一标识符
 * @property {string} name - 奖励名称
 * @property {string} description - 奖励描述
 * @property {('reward'|'punishment')} type - 类型，reward或punishment
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - 唯一标识符
 * @property {string} title - 成就标题
 * @property {string} description - 成就描述
 * @property {number} progress - 当前进度
 * @property {number} total - 总进度
 * @property {boolean} completed - 是否完成
 */

export default {}; 