import numeral from 'numeral'

export interface CoverageInterface {
  total: number
  with_docs: number
  total_examples: number
  with_examples: number
}

export class CoverageDiff {
  docs: number
  examples: number

  constructor(docs: number, examples: number) {
    this.docs = docs
    this.examples = examples
  }
}

export class CoverageEntry {
  total: number
  with_docs: number
  total_examples: number
  with_examples: number

  constructor(e: CoverageInterface) {
    this.total = e.total
    this.with_docs = e.with_docs
    this.total_examples = e.total_examples
    this.with_examples = e.with_examples
  }

  get percentage_docs(): number {
    return this.with_docs / this.total
  }

  get percentage_examples(): number {
    return this.with_examples / this.total_examples
  }
}

export class CoverageData {
  data: {[key: string]: CoverageEntry}
  previous?: CoverageData

  numberFormatter = '0.[00]%'
  diffFormatter = '+0.[00]%'

  constructor(description: string, previous?: CoverageData) {
    this.previous = previous
    const parsedData: {[key: string]: CoverageInterface} =
      JSON.parse(description)
    this.data = {}
    for (const file of Object.keys(parsedData)) {
      this.data[file] = new CoverageEntry(parsedData[file])
    }
  }

  get totalDocs(): number {
    return Object.values(this.data).reduce((sum, data) => sum + data.total, 0)
  }
  get withDocs(): number {
    return Object.values(this.data).reduce(
      (sum, data) => sum + data.with_docs,
      0
    )
  }
  get totalExamples(): number {
    return Object.values(this.data).reduce(
      (sum, data) => sum + data.total_examples,
      0
    )
  }
  get withExamples(): number {
    return Object.values(this.data).reduce(
      (sum, data) => sum + data.with_examples,
      0
    )
  }

  get percentageDocs(): number {
    return this.withDocs / this.totalDocs
  }
  get percentageExamples(): number {
    return this.withExamples / this.totalExamples
  }

  get diffPercentageDocs(): number {
    if (this.previous === undefined) {
      return 0
    }
    return this.percentageDocs - this.previous.percentageDocs
  }

  get diffPercentageExamples(): number {
    if (this.previous === undefined) {
      return 0
    }
    return this.percentageExamples - this.previous.percentageExamples
  }

  diffData(key: string): CoverageDiff {
    if (this.previous === undefined) {
      return new CoverageDiff(0, 0)
    }
    const entry = this.data[key]
    const previousEntry =
      this.previous.data[key] ||
      new CoverageEntry({
        total: 1,
        with_docs: 0,
        total_examples: 1,
        with_examples: 0
      })
    return new CoverageDiff(
      entry.percentage_docs - previousEntry.percentage_docs,
      entry.percentage_examples - previousEntry.percentage_examples
    )
  }

  asTable(): string[][] {
    return [['File', 'Documented', 'Percentage', 'Examples', 'Percentage']]
      .concat(
        Object.keys(this.data).map(file => [
          file,
          this.data[file].with_docs.toString(),
          numeral(this.data[file].percentage_docs).format(
            this.numberFormatter
          ) +
            (this.previous === undefined
              ? ''
              : ` (${numeral(this.diffData(file).docs).format(
                  this.diffFormatter
                )})`),
          this.data[file].with_examples.toString(),
          numeral(this.data[file].percentage_examples).format(
            this.numberFormatter
          ) +
            (this.previous === undefined
              ? ''
              : ` (${numeral(this.diffData(file).examples).format(
                  this.diffFormatter
                )})`)
        ])
      )
      .concat([
        [
          '**Total**',
          this.withDocs.toString(),
          numeral(this.percentageDocs).format(this.numberFormatter) +
            (this.previous === undefined
              ? ''
              : ` (${numeral(this.diffPercentageDocs).format(
                  this.diffFormatter
                )})`),
          this.withExamples.toString(),
          numeral(this.percentageExamples).format(this.numberFormatter) +
            (this.previous === undefined
              ? ''
              : ` (${numeral(this.diffPercentageExamples).format(
                  this.diffFormatter
                )})`)
        ]
      ])
  }
}
