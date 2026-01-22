const wecomService = require('../wecomService');

const PLANE_URL = 'https://plane.10rig.com:8443';

// 处理 Issue Comment 事件
const handleIssueCommentEvent = async (action, data, activity) => {
  const content = `### 💬 Issue 评论 ${action === 'created' ? '新增' : '更新'}\n` +
                  `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
                  `[查看详情](${PLANE_URL})`;
  
  await wecomService.sendMarkdownMessage(content);
};

module.exports = {
  handleIssueCommentEvent
};
