import { docPlugin } from './plugin'
import { resolve } from 'path'
import { readdir, writeFile } from 'fs/promises'

async function generateDocument(targetDir: string, outputDir: string) {
  const files = await readdir(targetDir, {
    encoding: 'utf-8'
  })
  const components = files.filter((f) => /^[A-Z].*\.vue$/.test(f))
  const sidebar: string[] = ['[首页](/)']
  for (let filePath of components) {
    const info = await docPlugin(resolve(targetDir, filePath))
    const { name } = info.doc
    sidebar.push(`[${name}](${name})`)
    await writeFile(resolve(outputDir, `${name}.md`), info.markdown, {
      encoding: 'utf-8'
    })
  }
  await writeFile(resolve(outputDir, '_sidebar.md'), sidebar.map((item) => `* ${item}`).join('\n'), {
    encoding: 'utf-8'
  })
}

export {
  generateDocument
}
