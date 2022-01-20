import * as core from '@actions/core'
import {Cargo, Cross, input} from '@actions-rs/core'
import {existsSync, readFileSync, writeFileSync} from 'fs'
import {CoverageData} from './coverage-data'
import {join} from 'path'
import {markdownTable} from 'markdown-table'
import numeral from 'numeral'

async function run(): Promise<void> {
  try {
    const useCross = input.getInputBool('use-cross')
    const workingDirectory = core.getInput('working-directory', {})
    const storeReport = input.getInputBool('store-report')
    const calculateDiff = input.getInputBool('calculate-diff')
    const coverageReportFile = join(
      workingDirectory,
      'rustdoc-coverage-report.json'
    )

    let previous: CoverageData | undefined = undefined
    if (calculateDiff && existsSync(coverageReportFile)) {
      const report = readFileSync(coverageReportFile).toString()
      previous = new CoverageData(report)
    }

    //eslint-disable-next-line no-console
    console.log('previous', previous)

    const cargoOutput = await executeRustdoc(useCross, workingDirectory)
    const coverageData = new CoverageData(cargoOutput, previous)
    //eslint-disable-next-line no-console
    console.log('coverageData', coverageData)

    const numberFormatter = '0.[00]%'
    const diffFormatter = '+0.[00]%'

    core.setOutput(
      'documented',
      numeral(coverageData.percentageDocs).format(numberFormatter)
    )
    core.setOutput(
      'diff-documented',
      numeral(coverageData.diffPercentageDocs).format(diffFormatter)
    )
    core.setOutput(
      'examples',
      numeral(coverageData.percentageExamples).format(numberFormatter)
    )
    core.setOutput(
      'diff-examples',
      numeral(coverageData.diffPercentageExamples).format(diffFormatter)
    )
    core.setOutput('json', cargoOutput)
    core.setOutput('table', markdownTable(coverageData.asTable()))

    if (storeReport) {
      writeFileSync(coverageReportFile, cargoOutput)
    }
  } catch (error: unknown) {
    if (typeof error === 'string') {
      core.setFailed(error.toUpperCase())
    } else if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('Unknown error')
    }
  }
}

async function executeRustdoc(
  useCross: boolean,
  workingDirectory: string
): Promise<string> {
  let program
  if (useCross) {
    program = await Cross.getOrInstall()
  } else {
    program = await Cargo.get()
  }

  const args = []
  args.push('+nightly')
  args.push('rustdoc')
  args.push('--')
  args.push('-Z')
  args.push('unstable-options')
  args.push('--show-coverage')
  args.push('--output-format')
  args.push('json')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const options: any = {}

  let cargoOutput = ''
  options.listeners = {
    stdout: (data: string) => {
      cargoOutput += data.toString()
    }
  }

  if (workingDirectory !== '') {
    options.cwd = workingDirectory
  }

  if ((await program.call(args, options)) !== 0) {
    throw new Error('Cargo terminated with non-zero exit code')
  }

  return cargoOutput
}

run()
