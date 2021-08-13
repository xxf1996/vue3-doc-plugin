const { generateDocument } = require('./dist/index')
const { writeFile } = require('fs/promises')
const { resolve } = require('path')

generateDocument('/Users/xuefengxie/Desktop/self/onewiki-fe/src/components/', resolve(__dirname, 'docs'))
