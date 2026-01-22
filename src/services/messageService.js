const { handleIssueEvent } = require('./handlers/issueHandler');
const { handleProjectEvent } = require('./handlers/projectHandler');
const { handleIssueCommentEvent } = require('./handlers/commentHandler');

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

module.exports = {
  handleMessage
};
