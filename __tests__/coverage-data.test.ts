import {expect, test} from '@jest/globals'
import {CoverageData} from '../src/coverage-data'

const cargoOutput =
  '{"src/foo.rs":{"total":2,"with_docs":2,"total_examples":2,"with_examples":0},"src/lib.rs":{"total":3,"with_docs":2,"total_examples":3,"with_examples":1}}'
const previousCargoOutput =
  '{"src/foo.rs":{"total":1,"with_docs":0,"total_examples":1,"with_examples":0},"src/lib.rs":{"total":2,"with_docs":2,"total_examples":4,"with_examples":1}}'

test('calculate total docs', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedTotalDocs = 5
  expect(coverageData.totalDocs).toEqual(expectedTotalDocs)
})

test('calculate total examples', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedTotalExamples = 5
  expect(coverageData.totalExamples).toEqual(expectedTotalExamples)
})

test('calculate with docs', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedWithDocs = 4
  expect(coverageData.withDocs).toEqual(expectedWithDocs)
})

test('calculate with examples', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedWithExamples = 1
  expect(coverageData.withExamples).toEqual(expectedWithExamples)
})

test('calculate percentage docs', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedPercentageDocs = 0.8
  expect(coverageData.percentageDocs).toBeCloseTo(expectedPercentageDocs)
})

test('calculate percentage examples', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedPercentageExamples = 0.2
  expect(coverageData.percentageExamples).toBeCloseTo(
    expectedPercentageExamples
  )
})

test('build markdown table', async () => {
  const coverageData = new CoverageData(cargoOutput)
  const expectedTable = [
    ['File', 'Documented', 'Percentage', 'Examples', 'Percentage'],
    ['src/foo.rs', '2', '100%', '0', '0%'],
    ['src/lib.rs', '2', '66.67%', '1', '33.33%'],
    ['**Total**', '4', '80%', '1', '20%']
  ]
  expect(coverageData.asTable()).toEqual(expectedTable)
})

test('calculate diff data', async () => {
  const previousData = new CoverageData(previousCargoOutput)
  const coverageData = new CoverageData(cargoOutput, previousData)
  const expectedDiffData = {docs: -0.3333, examples: 0.0833}
  expect(coverageData.diffData('src/lib.rs').docs).toBeCloseTo(
    expectedDiffData.docs
  )
  expect(coverageData.diffData('src/lib.rs').examples).toBeCloseTo(
    expectedDiffData.examples
  )
})

test('calculate diff percentage docs', async () => {
  const previousData = new CoverageData(previousCargoOutput)
  const coverageData = new CoverageData(cargoOutput, previousData)
  const expectedDiffPercentageDocs = 0.1333
  expect(coverageData.diffPercentageDocs).toBeCloseTo(
    expectedDiffPercentageDocs
  )
})

test('calculate diff percentage examples', async () => {
  const previousData = new CoverageData(previousCargoOutput)
  const coverageData = new CoverageData(cargoOutput, previousData)
  const expectedDiffPercentageExamples = 0
  expect(coverageData.diffPercentageExamples).toBeCloseTo(
    expectedDiffPercentageExamples
  )
})

test('build markdown table with diff', async () => {
  const previousData = new CoverageData(previousCargoOutput)
  const coverageData = new CoverageData(cargoOutput, previousData)
  const expectedTable = [
    ['File', 'Documented', 'Percentage', 'Examples', 'Percentage'],
    ['src/foo.rs', '2', '100% (+100%)', '0', '0% (+0%)'],
    ['src/lib.rs', '2', '66.67% (-33.33%)', '1', '33.33% (+8.33%)'],
    ['**Total**', '4', '80% (+13.33%)', '1', '20% (+0%)']
  ]
  expect(coverageData.asTable()).toEqual(expectedTable)
})
