// 处理接收到的消息
const handleMessage = async (message) => {
  console.log('收到消息:', JSON.stringify(message, null, 2));
  
  // 在这里处理你的业务逻辑
  
  return {
    received: true,
    timestamp: new Date().toISOString(),
    message: '消息已接收'
  };
};

module.exports = {
  handleMessage
};
