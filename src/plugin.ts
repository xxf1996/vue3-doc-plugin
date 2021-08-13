import { readFile } from 'fs/promises'
import { parse } from '@vue/compiler-sfc'
import { createFullAnalyzer, EmitInfo } from '@vuedx/analyze'
import { parser } from '@vuese/parser'
import { forEachChild, Visitor, createSourceFile, ScriptTarget, isJSDoc, JSDoc, Node, isPropertyAssignment, Identifier, PropertyAssignment, SourceFile, isObjectLiteralExpression, ObjectLiteralExpression, ObjectLiteralElementLike, isStringLiteral, StringLiteral } from 'typescript'
import { DocumentInfo, DocumentPropInfo } from './type'
import { toMarkdown } from './output'

let doc: DocumentInfo = {
  props: [],
  name: '',
  desc: '',
  emits: {},
  slots: {}
}

type HasJsDoc<T> = T & {
  jsDoc: JSDoc[];
}

function initData () {
  doc = {
    props: [],
    name: '',
    desc: '',
    emits: {},
    slots: {}
  }
}

function hasJsDoc<T> (node: T): node is HasJsDoc<T> {
  return 'jsDoc' in node
}

function isSomeProp (node: Node, name: string): node is PropertyAssignment {
  return isPropertyAssignment(node) && (node.name as Identifier).escapedText === name
}

function handleSingleProp (node: ObjectLiteralElementLike) {
  const info: DocumentPropInfo = {
    name: (node.name as Identifier).escapedText as string,
    type: 'unknown'
  }
  if (hasJsDoc(node)) {
    const comment = node.jsDoc[0]
    info.desc = comment.comment as string
    comment.tags?.forEach((tag) => {
      switch (tag.tagName.escapedText) {
        case 'default':
          info.default = tag.comment as string
          break
        case 't':
          info.type = tag.comment as string
          break
        default:
          break
      }
    })
  }
  doc.props.push(info)
}

function handleProps (node: PropertyAssignment, source: SourceFile) {
  const obj = node.getChildren(source).find((n) => isObjectLiteralExpression(n)) as (ObjectLiteralExpression | undefined)
  if (!obj) {
    return
  }
  obj.properties.forEach((prop) => handleSingleProp(prop))
}

function handleName (node: PropertyAssignment, source: SourceFile) {
  const val = node.getChildren(source).find((n) => isStringLiteral(n)) as (StringLiteral | undefined)
  if (!val) {
    return
  }
  doc.name = val.text
}

function handleEmit (emitInfo: EmitInfo[], node: PropertyAssignment) {
  if (!hasJsDoc(node) ||  emitInfo.length === 0) {
    return
  }
  const emits: string[] = emitInfo.map((emit) => emit.name)
  const comment = node.jsDoc[0]
  comment.tags?.forEach((tag) => {
    if (tag.tagName.escapedText === 'property') {
      const emitDesc = (tag.comment as string || '').split(':')
      if (emits.includes(emitDesc[0])) {
        doc.emits[emitDesc[0]] = emitDesc[1]
      }
    }
  })
}

export async function docPlugin(filePath: string) {
  initData()
  const file = await readFile(filePath, {
    encoding: 'utf-8'
  })
  const info = parse(file, {
    filename: 'Doc.vue'
  })
  const analyzer = createFullAnalyzer([])
  const info2 = analyzer.analyze(file, 'Doc.vue')
  // console.log(info2.emits)
  parser(file, {
    onDesc(res) {
      doc.desc = res.default.join('\n')
    },
    onSlot(res) {
      doc.slots[res.name] = res.describe
    }
  })

  const source = createSourceFile('doc.ts', info.descriptor.script?.content || '', ScriptTarget.ES2015)
  const visitor: Visitor = (node) => {
    if (isSomeProp(node, 'props')) {
      handleProps(node, source)
    } else if (isSomeProp(node, 'name')) {
      handleName(node, source)
    } else if (isSomeProp(node, 'emits')) {
      handleEmit(info2.emits, node)
    } else if (node.getChildCount(source)) {
      forEachChild(node, visitor)
    }
    return undefined
  }
  forEachChild(source, visitor)
  const markdown = toMarkdown(doc)
  return {
    markdown,
    doc
  }
}
