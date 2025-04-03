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
        
        // 准备争吵数据用于分析
        const category = categories.find(c => c.id === argument.category);
        const categoryName = category ? category.name : argument.category;
        const severityLabel = ['轻微', '中等', '严重'][argument.severity - 1];
        const status = argument.status === 'ongoing' ? '进行中' : '已解决';
        
        // 构建提示文本
        const prompt = `作为关系心理学专家，分析以下争吵信息并提供建议：
争吵日期：${new Date(argument.date).toLocaleDateString()}
争吵类型：${categoryName}
严重程度：${severityLabel}
当前状态：${status}
争吵内容：${argument.content || '未记录'}
解决方案：${argument.resolution || '尚未记录'}
个人反思：${argument.reflection || '尚未记录'}

请提供以下分 析：
1. 这次争吵的可能根本原因
2. 改善沟通的建议
3. 预防类似争吵的策略
4. 如何从这次经历中成长`;

        // 使用 messages 数组
        const messages = [
          { role: 'system', content: '你是一位专业的关系心理学家，擅长分析伴侣间的争吵并提供有建设性的建议。' },
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
