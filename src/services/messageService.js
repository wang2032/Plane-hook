const { handleIssueEvent } = require('./handlers/issueHandler');
const { handleProjectEvent } = require('./handlers/projectHandler');
const { handleIssueCommentEvent } = require('./handlers/commentHandler');
const { WECOM_WEBHOOK_URL_BUS } = require('./wecomService');

// 处理接收到的消息
const handleMessage = async (message, webhookUrl = process.env.WECOM_WEBHOOK_URL) => {
  console.log('收到消息:', JSON.stringify(message, null, 2));
  
  const { event, action, webhook_id, workspace_id, data, activity } = message;
  
  // 根据事件类型处理
  switch (event) {
    case 'issue':
      await handleIssueEvent(action, data, activity, webhookUrl);
      break;
    case 'issue_comment':
      await handleIssueCommentEvent(action, data, activity, webhookUrl);
      break;
    case 'project':
      await handleProjectEvent(action, data, activity, webhookUrl);
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

// 处理业务部消息
const handleBusMessage = async (message) => {
  return await handleMessage(message, WECOM_WEBHOOK_URL_BUS);
};

module.exports = {
  handleMessage,
  handleBusMessage
};
