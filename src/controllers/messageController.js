const messageService = require('../services/messageService');

// 接收消息钩子
const receiveMessage = async (req, res) => {
  try {
    const message = req.body;
    // console.log(message,);
    
    const result = await messageService.handleMessage(message);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  receiveMessage
};
