const { handleIssueEvent } = require('./handlers/issueHandler');
const { handleProjectEvent } = require('./handlers/projectHandler');
const { handleIssueCommentEvent } = require('./handlers/commentHandler');
const { WECOM_WEBHOOK_URL_BUS } = require('./wecomService');

// 获取项目对应的 webhook URL
const getWebhookUrlByProject = (projectId) => {
  try {
    const mapping = JSON.parse(process.env.PROJECT_WEBHOOK_MAPPING || '{}');
    return mapping[projectId] || process.env.WECOM_WEBHOOK_URL;
  } catch (error) {
    console.error('解析 PROJECT_WEBHOOK_MAPPING 失败:', error.message);
    return process.env.WECOM_WEBHOOK_URL;
  }
};

// 处理接收到的消息
const handleMessage = async (message, webhookUrl = null) => {
  console.log('收到消息:', JSON.stringify(message, null, 2));
  
  const { event, action, webhook_id, workspace_id, data, activity } = message;
  
  // 如果没有指定 webhookUrl，根据项目 ID 自动选择
  if (!webhookUrl && data && data.project) {
    webhookUrl = getWebhookUrlByProject(data.project);
    console.log(`项目 ${data.project} 使用 webhook:`, webhookUrl);
  }
  
  // 如果还是没有，使用默认的
  if (!webhookUrl) {
    webhookUrl = process.env.WECOM_WEBHOOK_URL;
  }
  
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
