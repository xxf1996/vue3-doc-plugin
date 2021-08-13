import { Plugin } from 'esbuild'
import { parse, compileTemplate } from '@vue/compiler-sfc'
import { readFile } from 'fs/promises'

async function getVueInfo(url: string): Promise<string> {
  const origin = await readFile(url, {
    encoding: 'utf-8'
  })
  const info = parse(origin, {
    filename: 'Test.vue'
  })
  console.log(compileTemplate({
    filename: 'Test.vue',
    source: info.descriptor.template?.content || '',
    id: 'test'
  }))
  return info.descriptor.script?.content || ''
}

export const testPlugin: Plugin = {
  name: 'test',
  setup(build) {
    console.log('setup')
    build.onResolve({
      filter: /^vue3\:(.+)/
    }, (args) => {
      // console.log(args)
      return {
        path: args.path,
        namespace: 'vue3-ns'
      }
    })

    build.onLoad({
      filter: /.*/,
      namespace: 'vue3-ns'
    }, async (args) => {
      const res = /^vue3\:(.+)$/.exec(args.path) || []
      const filePath = res[1] || ''
      const text = await getVueInfo(filePath)
      return {
        contents: text,
        loader: 'ts',
        resolveDir: filePath.split('src')[0],
      }
    })
  }
}
