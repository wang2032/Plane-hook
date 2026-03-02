const axios = require('axios');

const WECOM_WEBHOOK_URL = process.env.WECOM_WEBHOOK_URL;
const WECOM_WEBHOOK_URL_BUS = process.env.WECOM_WEBHOOK_URL_BUS;

// 调试日志
console.log('=== 环境变量调试 ===');
console.log('WECOM_WEBHOOK_URL:', WECOM_WEBHOOK_URL);
console.log('WECOM_WEBHOOK_URL_BUS:', WECOM_WEBHOOK_URL_BUS);
console.log('所有环境变量 WECOM 相关:', Object.keys(process.env).filter(k => k.includes('WECOM')));
console.log('==================');

// 发送文本消息到企业微信
const sendTextMessage = async (content, mentionedList = [], mentionedMobileList = [], webhookUrl = WECOM_WEBHOOK_URL) => {
  if (!webhookUrl) {
    console.error('企业微信 Webhook URL 未配置');
    return false;
  }

  try {
    const payload = {
      msgtype: 'text',
      text: {
        content
      }
    };

    // 如果有 @提醒，添加到消息中
    if (mentionedList.length > 0) {
      payload.text.mentioned_list = mentionedList;
    }
    if (mentionedMobileList.length > 0) {
      payload.text.mentioned_mobile_list = mentionedMobileList;
    }

    const response = await axios.post(webhookUrl, payload);

    if (response.data.errcode === 0) {
      console.log('企业微信消息发送成功');
      return true;
    } else {
      console.error('企业微信消息发送失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('发送企业微信消息出错:', error.message);
    return false;
  }
};

// 发送 Markdown 消息到企业微信
const sendMarkdownMessage = async (content, mentionedList = [], webhookUrl = WECOM_WEBHOOK_URL) => {
  if (!webhookUrl) {
    console.error('企业微信 Webhook URL 未配置');
    return false;
  }

  try {
    // 如果需要 @提醒，在内容末尾添加
    let finalContent = content;
    if (mentionedList.length > 0) {
      const mentions = mentionedList.map(user => `<@${user}>`).join(' ');
      finalContent = `${content}\n\n${mentions}`;
    }

    const response = await axios.post(webhookUrl, {
      msgtype: 'markdown',
      markdown: {
        content: finalContent
      }
    });

    if (response.data.errcode === 0) {
      console.log('企业微信消息发送成功');
      return true;
    } else {
      console.error('企业微信消息发送失败:', response.data);
      return false;
    }
  } catch (error) {
    console.error('发送企业微信消息出错:', error.message);
    return false;
  }
};

module.exports = {
  sendTextMessage,
  sendMarkdownMessage,
  WECOM_WEBHOOK_URL_BUS
};
