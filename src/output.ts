import { DocumentInfo, DocumentPropInfo } from './type'

function defaultVal(val?: string) {
  return val?.replace('|', '\\|') || '——'
}

function table(headers: string[], content: string): string {
  const header = headers.join(' | ')
  const line = new Array(headers.length).fill('---').join(' | ')
  return [header, line, content].join('\n')
}

function getPropRow(prop: DocumentPropInfo): string {
  const info: (string | undefined)[] = [
    `\`${prop.name}\``,
    prop.desc,
    `\`${prop.type}\``,
    prop.options,
    prop.default
  ].map(defaultVal)
  return info.join(' | ')
}

function getSimpleRows(info: Record<string, string>): string {
  const rows: string[] = []
  for (let name in info) {
    rows.push(`\`${name}\` | ${defaultVal(info[name])}`)
  }
  return rows.join('\n')
}

export function toMarkdown(doc: DocumentInfo): string {
  const propsTable = table([
    '名称',
    '描述',
    '类型',
    '可选值',
    '默认值'
  ], doc.props.map(getPropRow).join('\n'));
  const eventsTable = table([
    '事件名称',
    '描述'
  ], getSimpleRows(doc.emits))
  const slotsTable = table([
    '插槽名称',
    '描述'
  ], getSimpleRows(doc.slots))

  return [
    `# ${doc.name}`,
    defaultVal(doc.desc),
    '## Props',
    propsTable,
    '## Events',
    eventsTable,
    '## Slots',
    slotsTable
  ].join('\n')
}
