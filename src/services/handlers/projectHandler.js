const wecomService = require('../wecomService');

const PLANE_URL = 'https://plane.10rig.com:8443';

// 处理 Project 事件
const handleProjectEvent = async (action, data, activity, webhookUrl = null) => {
  let content = '';
  
  if (action === 'created') {
    content = `### 📁 新建项目\n` +
              `> **项目名称**: <font color="info">${data.name}</font>\n` +
              `> **标识符**: ${data.identifier}\n` +
              `> **描述**: ${data.description || '无'}\n` +
              `> **创建者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
  } else if (action === 'updated') {
    content = `### ✏️ 更新项目\n` +
              `> **项目名称**: <font color="info">${data.name}</font>\n` +
              `> **标识符**: ${data.identifier}\n` +
              `> **描述**: ${data.description || '无'}\n` +
              `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
  } else if (action === 'deleted') {
    content = `### 🗑️ 删除项目\n` +
              `> **项目名称**: <font color="info">${data.name}</font>\n` +
              `> **操作者**: ${activity?.actor?.display_name || '未知'}\n\n` +
              `[查看详情](${PLANE_URL})`;
  }
  
  if (content) {
    await wecomService.sendMarkdownMessage(content, [], webhookUrl);
  }
};

module.exports = {
  handleProjectEvent
};
