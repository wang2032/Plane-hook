const wecomService = require('./wecomService');

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
  let message = '';
  let mentionAll = false; // 是否 @所有人
  
  if (action === 'created') {
    message = `📝 新建 Issue\n` +
              `标题: ${data.name}\n` +
              `状态: ${data.state?.name}\n` +
              `优先级: ${data.priority}\n` +
              `序列号: #${data.sequence_id}\n` +
              `创建者: ${activity?.actor?.display_name || '未知'}`;
    // 新建 Issue 时 @所有人
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
    
    message = `✏️ 更新 Issue\n` +
              `标题: ${data.name}\n` +
              `序列号: #${data.sequence_id}\n` +
              `变更字段: ${fieldName}\n` +
              `当前状态: ${data.state?.name}\n` +
              `操作者: ${activity?.actor?.display_name || '未知'}`;
  } else if (action === 'deleted') {
    message = `🗑️ 删除 Issue\n` +
              `标题: ${data.name}\n` +
              `序列号: #${data.sequence_id}\n` +
              `操作者: ${activity?.actor?.display_name || '未知'}`;
  }
  
  // 发送到企业微信
  if (message) {
    const mentionedList = mentionAll ? ['@all'] : [];
    await wecomService.sendTextMessage(message, mentionedList);
  }
};

// 处理 Issue Comment 事件
const handleIssueCommentEvent = async (action, data, activity) => {
  const message = `💬 Issue 评论 ${action === 'created' ? '新增' : '更新'}\n` +
                  `操作者: ${activity?.actor?.display_name || '未知'}`;
  
  await wecomService.sendTextMessage(message);
};

// 处理 Project 事件
const handleProjectEvent = async (action, data, activity) => {
  const message = `� 项目 ${action === 'created' ? '创建' : action === 'updated' ? '更新' : '删除'}\n` +
                  `操作者: ${activity?.actor?.display_name || '未知'}`;
  
  await wecomService.sendTextMessage(message);
};

module.exports = {
  handleMessage
};
