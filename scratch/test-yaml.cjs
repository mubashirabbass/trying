const fs = require('fs');
const path = require('path');

try {
  const content = fs.readFileSync(path.resolve(__dirname, '../shared/api-spec/openapi.yaml'), 'utf8');
  console.log("File loaded. Length:", content.length);
  
  // Try default search
  const yaml = require('js-yaml');
  const parsed = yaml.load(content);
  console.log("Successfully parsed YAML! API Title:", parsed.info && parsed.info.title);
} catch (err) {
  console.error("Error occurred:", err);
}
