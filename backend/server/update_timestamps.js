const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'models');
const files = fs.readdirSync(modelsDir);

for (const file of files) {
  if (file.endsWith('.js')) {
    const filePath = path.join(modelsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('timestamps: true')) {
      if (!content.includes('getISTTime')) {
        content = `const { getISTTime } = require('../utils/time');\n` + content;
        content = content.replace(/timestamps:\s*true/g, 'timestamps: { currentTime: getISTTime }');
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file);
      }
    }
  }
}
