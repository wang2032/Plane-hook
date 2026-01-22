const wecomService = require('./wecomService');

const PLANE_URL = 'https://plane.10rig.com:8443';

// 处理接收到的消息
const handleMessage = async (message) => {
  console.log('收到消息:', JSON.stringify(message, null, 2));
  
  const { event, action, webhook_id, workspace_id, data, activity } = message;
  
  // 根据事件类型处理
  switch (event) {
    case 'issue':
      await handleIssueEvent(action, data, activity);
      break;
    case 'issue_comment':
      await handleIssueCommentEvent(action, data, activity);
      break;
    case 'project':
      await handleProjectEvent(action, data, activity);
      break;
    default:
      console.log(`未处理的事件类型: ${event}`);
  }
  
  return {
    received: true,
    timestamp: new Date().toISOString(),
    event,
    action,
    webhook_id,
    workspace_id
  };
};

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
      'labels': '标签'
    };
    
    const fieldName = fieldMap[activity?.field] || activity?.field;
    
    content = `### ✏️ 更新 Issue\n` +
              `> **标题**: <font color="info">${data.name}</font>\n` +
              `> **序列号**: #${data.sequence_id}\n` +
              `> **变更字段**: <font color="warning">${fieldName}</font>\n` +
              `> **当前状态**: <font color="comment">${data.state?.name}</font>\n` +
              `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
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

// 处理 Issue Comment 事件
const handleIssueCommentEvent = async (action, data, activity) => {
  const content = `### 💬 Issue 评论 ${action === 'created' ? '新增' : '更新'}\n` +
                  `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
                  `[查看详情](${PLANE_URL})`;
  
  await wecomService.sendMarkdownMessage(content);
};

// 处理 Project 事件
const handleProjectEvent = async (action, data, activity) => {
  const actionText = action === 'created' ? '创建' : action === 'updated' ? '更新' : '删除';
  const content = `### 📁 项目 ${actionText}\n` +
                  `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
                  `[查看详情](${PLANE_URL})`;
  
  await wecomService.sendMarkdownMessage(content);
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

module.exports = {
  handleMessage
};
