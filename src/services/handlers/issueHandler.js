const wecomService = require('../wecomService');

const PLANE_URL = 'https://plane.10rig.com:8443';

// 防抖配置
const DEBOUNCE_TIME = 30000; // 30秒
const pendingNotifications = new Map(); // 存储待发送的通知

// 需要忽略的字段（这些字段变更不通知）
const IGNORED_FIELDS = new Set([
  'sort_order',
  'updated_at'
]);

// 防抖发送通知
const debouncedSendNotification = (issueId, latestData, latestActivity, webhookUrl) => {
  // 忽略不重要的字段
  if (IGNORED_FIELDS.has(latestActivity?.field)) {
    console.log(`忽略字段变更: ${latestActivity?.field}`);
    return;
  }
  
  // 获取或创建该 Issue 的变更记录
  let notification = pendingNotifications.get(issueId);
  
  if (notification) {
    // 已有待发送的通知，清除旧定时器，累积变更
    clearTimeout(notification.timer);
    console.log(`取消 Issue ${issueId} 的旧通知，累积变更并重新计时`);
    
    // 累积变更记录（去重：同一字段只保留最新的）
    const existingChangeIndex = notification.changes.findIndex(c => c.field === latestActivity?.field);
    if (existingChangeIndex >= 0) {
      // 更新已有字段的变更
      notification.changes[existingChangeIndex] = {
        field: latestActivity?.field,
        oldValue: notification.changes[existingChangeIndex].oldValue, // 保留最初的旧值
        newValue: latestActivity?.new_value, // 使用最新的新值
        actor: latestActivity?.actor
      };
    } else {
      // 新增字段变更
      notification.changes.push({
        field: latestActivity?.field,
        oldValue: latestActivity?.old_value,
        newValue: latestActivity?.new_value,
        actor: latestActivity?.actor
      });
    }
    notification.data = latestData; // 更新为最新数据
  } else {
    // 首次变更
    notification = {
      data: latestData,
      changes: [{
        field: latestActivity?.field,
        oldValue: latestActivity?.old_value,
        newValue: latestActivity?.new_value,
        actor: latestActivity?.actor
      }],
      webhookUrl
    };
  }
  
  // 创建新的定时器
  notification.timer = setTimeout(async () => {
    console.log(`30秒内无新更新，发送 Issue ${issueId} 的通知，共 ${notification.changes.length} 个变更`);
    
    const fieldMap = {
      'state_id': '状态',
      'priority': '优先级',
      'name': '标题',
      'assignees': '负责人',
      'assignee_ids': '负责人',
      'labels': '标签',
      'description': '描述',
      'description_html': '描述',
      'description_stripped': '描述',
      'target_date': '截止日期',
      'start_date': '开始日期',
      'estimate_point': '预估工时',
      'parent': '父任务',
      'archived_at': '归档状态'
    };
    
    // 生成变更摘要
    const changesSummary = notification.changes
      .map(change => {
        const fieldName = fieldMap[change.field] || change.field;
        return `• ${fieldName}`;
      })
      .join('\n');
    
    const lastChange = notification.changes[notification.changes.length - 1];
    
    const content = `### ✏️ 更新 Issue\n` +
              `> **标题**: <font color="info">${notification.data.name}</font>\n` +
              `> **序列号**: #${notification.data.sequence_id}\n` +
              `> **变更字段**:\n${changesSummary}\n` +
              `> **当前状态**: <font color="comment">${notification.data.state?.name}</font>\n` +
              `> **优先级**: ${getPriorityText(notification.data.priority)}\n` +
              `> **操作者**: ${lastChange?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
    
    // 检查是否有负责人变更需要 @提醒
    let mentionedList = [];
    const assigneeChange = notification.changes.find(c => c.field === 'assignee_ids');
    if (assigneeChange && notification.data.assignees && notification.data.assignees.length > 0) {
      const newAssigneeIds = Array.isArray(assigneeChange.newValue) ? assigneeChange.newValue : [];
      const oldAssigneeIds = Array.isArray(assigneeChange.oldValue) ? assigneeChange.oldValue : [];
      const addedAssigneeIds = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
      mentionedList = notification.data.assignees
        .filter(assignee => addedAssigneeIds.includes(assignee.id))
        .map(assignee => assignee.display_name);
    }
    
    await wecomService.sendMarkdownMessage(content, mentionedList, notification.webhookUrl);
    pendingNotifications.delete(issueId);
  }, DEBOUNCE_TIME);
  
  pendingNotifications.set(issueId, notification);
  console.log(`Issue ${issueId} 将在 30 秒后发送通知（如无新更新），当前累积 ${notification.changes.length} 个变更`);
};

// 处理 Issue 事件
const handleIssueEvent = async (action, data, activity, webhookUrl = null) => {
  let content = '';
  let mentionAll = false;
  
  if (action === 'created') {
    content = `### 📝 新建 Issue\n` +
              `> **标题**: <font color="info">${data.name}</font>\n` +
              `> **状态**: <font color="comment">${data.state?.name}</font>\n` +
              `> **优先级**: ${getPriorityText(data.priority)}\n` +
              `> **序列号**: #${data.sequence_id}\n` +
              `> **创建者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
    mentionAll = true;
  } else if (action === 'updated') {
    // 使用防抖发送消息（保存最新的数据）
    debouncedSendNotification(data.id, data, activity, webhookUrl);
    return; // 提前返回，避免重复发送
  } else if (action === 'deleted') {
    content = `### 🗑️ 删除 Issue\n` +
              `> **标题**: <font color="info">${data.name}</font>\n` +
              `> **序列号**: #${data.sequence_id}\n` +
              `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
  }
  
  // 发送到企业微信
  if (content) {
    const mentionedList = mentionAll ? ['@all'] : [];
    await wecomService.sendMarkdownMessage(content, mentionedList, webhookUrl);
  }
};

// 获取优先级文本（带颜色）
const getPriorityText = (priority) => {
  const priorityMap = {
    'urgent': '<font color="warning">紧急</font>',
    'high': '<font color="warning">高</font>',
    'medium': '<font color="comment">中</font>',
    'low': '<font color="comment">低</font>',
    'none': '<font color="comment">无</font>'
  };
  return priorityMap[priority] || priority;
};

// 格式化变更详情
const formatChangeDetail = (field, oldValue, newValue, data) => {
  // 如果是描述类字段，显示简化信息
  if (field === 'description_html' || field === 'description_stripped' || field === 'description') {
    const oldText = oldValue === '<p></p>' || !oldValue ? '空' : '已有内容';
    const newText = data.description_stripped || '空';
    return `> **变更**: ${oldText} → ${newText.substring(0, 20)}${newText.length > 20 ? '...' : ''}\n`;
  }
  
  // 负责人字段
  if (field === 'assignee_ids' || field === 'assignees') {
    const oldAssignees = Array.isArray(oldValue) && oldValue.length > 0 ? '已有负责人' : '无';
    const newAssignees = data.assignees && data.assignees.length > 0 
      ? data.assignees.map(a => a.display_name).join(', ') 
      : '无';
    return `> **变更**: ${oldAssignees} → ${newAssignees}\n`;
  }
  
  // 日期字段
  if (field === 'start_date' || field === 'target_date') {
    const oldDate = oldValue ? oldValue : '未设置';
    const newDate = newValue ? newValue : '未设置';
    return `> **变更**: ${oldDate} → ${newDate}\n`;
  }
  
  // 优先级字段
  if (field === 'priority') {
    const priorityMap = {
      'urgent': '紧急',
      'high': '高',
      'medium': '中',
      'low': '低',
      'none': '无'
    };
    const oldPriority = priorityMap[oldValue] || oldValue || '未设置';
    const newPriority = priorityMap[newValue] || newValue || '未设置';
    return `> **变更**: ${oldPriority} → ${newPriority}\n`;
  }
  
  // 状态字段
  if (field === 'state_id') {
    // 状态变更已经在"当前状态"中显示，这里可以简化
    return '';
  }
  
  // 其他字段
  if (oldValue || newValue) {
    const old = oldValue || '空';
    const newVal = newValue || '空';
    return `> **变更**: ${old} → ${newVal}\n`;
  }
  
  return '';
};

module.exports = {
  handleIssueEvent
};
