const fs = require('node:fs')
const path = require('node:path')

// 检查uTools版本是否支持AI功能
const checkUToolsAISupport = () => {
  try {
    return typeof utools.ai === 'function';
  } catch (error) {
    return false;
  }
};

// 通过 window 对象向渲染进程注入 nodejs 能力
window.services = {
  // 读文件
  readFile (file) {
    return fs.readFileSync(file, { encoding: 'utf-8' })
  },
  // 文本写入到下载目录
  writeTextFile (text) {
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.txt')
    fs.writeFileSync(filePath, text, { encoding: 'utf-8' })
    return filePath
  },
  // 图片写入到下载目录
  writeImageFile (base64Url) {
    const matchs = /^data:image\/([a-z]{1,20});base64,/i.exec(base64Url)
    if (!matchs) return
    const filePath = path.join(window.utools.getPath('downloads'), Date.now().toString() + '.' + matchs[1])
    fs.writeFileSync(filePath, base64Url.substring(matchs[0].length), { encoding: 'base64' })
    return filePath
  },
  // 获取应用数据目录
  getAppDataPath() {
    return utools.getPath('userData')
  },
  // 保存数据到本地
  saveData(name, data) {
    try {
      const dataPath = path.join(this.getAppDataPath(), `${name}.json`)
      fs.writeFileSync(dataPath, JSON.stringify(data), { encoding: 'utf-8' })
      return true
    } catch (error) {
      console.error(`保存数据失败: ${error.message}`)
      return false
    }
  },
  // 从本地读取数据
  loadData(name) {
    try {
      const dataPath = path.join(this.getAppDataPath(), `${name}.json`)
      if (fs.existsSync(dataPath)) {
        const data = fs.readFileSync(dataPath, { encoding: 'utf-8' })
        return JSON.parse(data)
      }
      return null
    } catch (error) {
      console.error(`读取数据失败: ${error.message}`)
      return null
    }
  },
  // 检查是否支持AI功能
  checkAISupport() {
    return checkUToolsAISupport();
  },
  // AI分析争吵数据
  analyzeArgumentWithAI(argument, categories) {
    return new Promise((resolve, reject) => {
      try {
        // 检查AI功能支持
        if (!checkUToolsAISupport()) {
          reject(new Error('当前uTools版本不支持AI功能，请更新到uTools 7.0.0或以上版本'));
          return;
        }
        
        // 准备数据用于分析
        const category = categories.find(c => c.id === argument.category);
        const categoryName = category ? category.name : argument.category;
        const intensityLabel = argument.moodType === 'positive' 
          ? ['微小', '温馨', '难忘'][argument.intensity - 1]
          : ['轻微', '中等', '强烈'][argument.intensity - 1];
        
        // 构建提示文本
        let prompt = '';
        
        if (argument.moodType === 'positive') {
          prompt = `作为情感智能顾问，请分析以下积极情绪记录。根据这段美好时光，提供积极的强化和建议，帮助情侣更好地保持和增强这种积极情绪。
分析应该包括：
1. 这种积极情绪的价值和意义
2. 如何将这种美好时刻的体验延续到日常生活中
3. 建议如何记录和珍藏这种情感，使其成为关系中的宝贵财富
4. 如何从中获得成长，加深彼此的连接

日期: ${new Date(argument.date).toLocaleDateString()}
分类: ${categoryName}
情绪类型: 积极情绪
强度: ${intensityLabel} (${argument.intensity}/3)
内容: ${argument.content || '无内容'}
${argument.reflection ? `心得体会: ${argument.reflection}` : ''}

请用温暖、鼓励的语气，提供具体且实用的建议。`;
        } else {
          prompt = `作为情感智能顾问，请分析以下情绪记录。根据记录的情绪状况，提供中立、客观的分析和建议，帮助情侣更好地理解和处理这种情绪。
分析应该包括：
1. 可能引起这种情绪的根本原因
2. 双方可以采取哪些具体沟通策略来有效处理
3. 如何将这种情绪转化为关系成长的机会
4. 预防类似情绪再次发生的建议

日期: ${new Date(argument.date).toLocaleDateString()}
分类: ${categoryName}
情绪类型: 消极情绪
强度: ${intensityLabel} (${argument.intensity}/3)
状态: ${argument.resolved ? '已解决' : '未解决'}
内容: ${argument.content || '无内容'}
${argument.resolution ? `解决方案: ${argument.resolution}` : ''}
${argument.reflection ? `感想与反思: ${argument.reflection}` : ''}

请用平和、支持的语气，不要指责任何一方，而是关注解决方案和成长机会。`;
        }

        // 使用 messages 数组
        const messages = [
          { role: 'system', content: '你是一位专业的关系心理学家，擅长分析伴侣间的情绪并提供有建设性的建议。' },
          { role: 'user', content: prompt }
        ];

        // 使用正确的 utools.ai API
        let response = '';
        
        try {
          const aiPromise = utools.ai({ 
            messages,
          }, (chunk) => {
            // 流式处理返回结果
            if (chunk.content) {
              response += chunk.content;
            }
          });

          // 处理结果
          aiPromise
            .then(() => {
              resolve(response);
            })
            .catch(err => {
              reject(err);
            });
        } catch (aiError) {
          // 捕获API调用错误
          console.error('AI API调用错误:', aiError);
          reject(new Error(`AI API调用错误: ${aiError.message || '未知错误'}`));
        }
      } catch (error) {
        console.error('准备AI分析数据出错:', error);
        reject(error);
      }
    });
  }
}
