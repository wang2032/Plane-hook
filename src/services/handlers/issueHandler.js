const wecomService = require('../wecomService');

const PLANE_URL = 'https://plane.10rig.com:8443';

// 处理 Issue 事件
const handleIssueEvent = async (action, data, activity) => {
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
    
    const fieldName = fieldMap[activity?.field] || activity?.field;
    
    // 格式化变更值
    const changeDetail = formatChangeDetail(activity?.field, activity?.old_value, activity?.new_value, data);
    
    // 检查是否需要 @负责人
    let mentionedList = [];
    if (activity?.field === 'assignee_ids' && data.assignees && data.assignees.length > 0) {
      // 提取新增的负责人（用于 @提醒）
      const newAssigneeIds = Array.isArray(activity?.new_value) ? activity.new_value : [];
      const oldAssigneeIds = Array.isArray(activity?.old_value) ? activity.old_value : [];
      const addedAssigneeIds = newAssigneeIds.filter(id => !oldAssigneeIds.includes(id));
      
      // 使用负责人的 display_name 进行 @提醒
      mentionedList = data.assignees
        .filter(assignee => addedAssigneeIds.includes(assignee.id))
        .map(assignee => assignee.display_name);
    }
    
    content = `### ✏️ 更新 Issue\n` +
              `> **标题**: <font color="info">${data.name}</font>\n` +
              `> **序列号**: #${data.sequence_id}\n` +
              `> **变更字段**: <font color="warning">${fieldName}</font>\n` +
              changeDetail +
              `> **当前状态**: <font color="comment">${data.state?.name}</font>\n` +
              `> **优先级**: ${getPriorityText(data.priority)}\n` +
              `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
    
    // 发送消息并 @负责人
    if (content) {
      await wecomService.sendMarkdownMessage(content, mentionedList);
    }
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
    await wecomService.sendMarkdownMessage(content, mentionedList);
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
