const path = require('path');
module.exports = {
  'api': {
    input: path.resolve(__dirname, 'openapi.yaml').replaceAll('\\', '/'),
    output: {
      target: './test-output.ts',
    }
  }
}
