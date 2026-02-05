/**
 * Survey Exporter
 * EVIDENRA Research - Scientific Questionnaire Development System
 *
 * Exports questionnaires to various survey platforms:
 * - DDI-XML (Data Documentation Initiative) - International standard
 * - LimeSurvey LSS - Open source survey platform
 * - Qualtrics QSF - Enterprise survey platform
 * - REDCap - Clinical research data capture
 * - CSV - Simple data dictionary format
 *
 * Also generates:
 * - Methods section for academic papers
 * - Adaptation documentation
 * - Psychometric tables
 */

import {
  Scale,
  ScaleItem,
  ResponseFormat,
  MethodsSectionData,
  AdaptationProcess,
  ReliabilityResult,
  FactorAnalysisResult,
} from './types'

import { EXPORT_FORMATS, LIKERT_SCALE_GUIDELINES } from './knowledge'

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'ddi-xml' | 'limesurvey-lss' | 'qualtrics-qsf' | 'redcap-csv' | 'csv'

export interface ExportOptions {
  format: ExportFormat
  language?: 'de' | 'en'
  includeMetadata?: boolean
  includeScoringInstructions?: boolean
}

export interface ExportResult {
  format: ExportFormat
  filename: string
  content: string
  mimeType: string
}

// ============================================================================
// DDI-XML EXPORTER
// ============================================================================

export class DDIExporter {
  /**
   * Export scale to DDI-XML format
   * @see https://ddialliance.org
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    const xml = this.generateDDIXML(scale, options.language || 'de')

    return {
      format: 'ddi-xml',
      filename: `${this.sanitizeFilename(scale.name)}_DDI.xml`,
      content: xml,
      mimeType: 'application/xml',
    }
  }

  private static generateDDIXML(scale: Scale, language: string): string {
    const now = new Date().toISOString()
    const langCode = language === 'de' ? 'de-DE' : 'en-US'

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ddi:DDIInstance xmlns:ddi="ddi:instance:3_3"
                 xmlns:r="ddi:reusable:3_3"
                 xmlns:l="ddi:logicalproduct:3_3"
                 xmlns:d="ddi:datacollection:3_3"
                 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                 xsi:schemaLocation="ddi:instance:3_3 https://ddialliance.org/Specification/DDI-Lifecycle/3.3/XMLSchema/instance.xsd">

  <r:Agency>EVIDENRA Research</r:Agency>
  <r:ID>${scale.id}</r:ID>
  <r:Version>1.0.0</r:Version>
  <r:VersionDate>${now.split('T')[0]}</r:VersionDate>

  <!-- Study Unit -->
  <s:StudyUnit xmlns:s="ddi:studyunit:3_3">
    <r:Citation>
      <r:Title xml:lang="${langCode}">${this.escapeXml(scale.name)}</r:Title>
      <r:Creator>${scale.authors.join(', ')}</r:Creator>
      <r:PublicationDate>${scale.year}</r:PublicationDate>
    </r:Citation>

    <s:Abstract>
      <r:Content xml:lang="${langCode}">
        Messinstrument für: ${this.escapeXml(scale.construct)}
        Items: ${scale.items.length}
        ${scale.dimensions ? `Dimensionen: ${scale.dimensions.map(d => d.name).join(', ')}` : ''}
      </r:Content>
    </s:Abstract>

    <!-- Concept -->
    <c:ConceptualComponent xmlns:c="ddi:conceptualcomponent:3_3">
      <c:ConceptScheme>
        <r:Label xml:lang="${langCode}">${this.escapeXml(scale.construct)}</r:Label>
        ${scale.dimensions?.map((dim, i) => `
        <c:Concept>
          <r:ID>concept_${i + 1}</r:ID>
          <r:Label xml:lang="${langCode}">${this.escapeXml(dim.name)}</r:Label>
          <r:Description xml:lang="${langCode}">${this.escapeXml(dim.definition)}</r:Description>
        </c:Concept>`).join('') || ''}
      </c:ConceptScheme>
    </c:ConceptualComponent>

    <!-- Data Collection -->
    <d:DataCollection>
      <d:QuestionScheme>
        <r:Label xml:lang="${langCode}">${this.escapeXml(scale.name)}</r:Label>

        ${scale.items.map((item, i) => `
        <d:QuestionItem>
          <r:ID>${item.id}</r:ID>
          <d:QuestionItemName xml:lang="${langCode}">Item ${i + 1}</d:QuestionItemName>
          <d:QuestionText xml:lang="${langCode}">${this.escapeXml(item.text)}</d:QuestionText>
          ${item.isReverseCoded ? '<d:ResponseCardinality minimumResponses="1" maximumResponses="1" isReverseCoded="true"/>' : ''}
          <d:CodeDomain>
            <r:CodeSchemeReference>
              <r:ID>response_scale</r:ID>
            </r:CodeSchemeReference>
          </d:CodeDomain>
        </d:QuestionItem>`).join('')}

      </d:QuestionScheme>

      <!-- Response Scale -->
      <l:CodeScheme xmlns:l="ddi:logicalproduct:3_3">
        <r:ID>response_scale</r:ID>
        <r:Label xml:lang="${langCode}">${scale.responseFormat.type} (${scale.responseFormat.points} Punkte)</r:Label>
        ${(scale.responseFormat.anchors || LIKERT_SCALE_GUIDELINES.examples.agreement5).map((anchor, i) => `
        <l:Code>
          <r:Value>${i + 1}</r:Value>
          <r:CategoryReference>
            <r:Label xml:lang="${langCode}">${this.escapeXml(anchor)}</r:Label>
          </r:CategoryReference>
        </l:Code>`).join('')}
      </l:CodeScheme>

    </d:DataCollection>

  </s:StudyUnit>

</ddi:DDIInstance>`

    return xml
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').substring(0, 50)
  }
}

// ============================================================================
// LIMESURVEY EXPORTER
// ============================================================================

export class LimeSurveyExporter {
  /**
   * Export scale to LimeSurvey LSS format (XML)
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    const lss = this.generateLSS(scale, options.language || 'de')

    return {
      format: 'limesurvey-lss',
      filename: `${this.sanitizeFilename(scale.name)}.lss`,
      content: lss,
      mimeType: 'application/xml',
    }
  }

  private static generateLSS(scale: Scale, language: string): string {
    const surveyId = Date.now()
    const groupId = 1

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <LimeSurveyDocType>Survey</LimeSurveyDocType>
  <DBVersion>400</DBVersion>

  <surveys>
    <rows>
      <row>
        <sid>${surveyId}</sid>
        <gsid>1</gsid>
        <admin>EVIDENRA</admin>
        <adminemail>research@evidenra.com</adminemail>
        <anonymized>Y</anonymized>
        <language>${language}</language>
        <datestamp>Y</datestamp>
        <usecookie>N</usecookie>
        <allowregister>N</allowregister>
        <allowsave>Y</allowsave>
        <autonumber_start>0</autonumber_start>
        <autoredirect>N</autoredirect>
        <showwelcome>Y</showwelcome>
        <showprogress>Y</showprogress>
        <questionindex>0</questionindex>
        <navigationdelay>0</navigationdelay>
        <nokeyboard>N</nokeyboard>
        <alloweditaftercompletion>N</alloweditaftercompletion>
      </row>
    </rows>
  </surveys>

  <surveys_languagesettings>
    <rows>
      <row>
        <surveyls_survey_id>${surveyId}</surveyls_survey_id>
        <surveyls_language>${language}</surveyls_language>
        <surveyls_title><![CDATA[${scale.name}]]></surveyls_title>
        <surveyls_description><![CDATA[Messinstrument für: ${scale.construct}]]></surveyls_description>
        <surveyls_welcometext><![CDATA[Willkommen zu dieser Befragung. Bitte beantworten Sie alle Fragen ehrlich.]]></surveyls_welcometext>
        <surveyls_endtext><![CDATA[Vielen Dank für Ihre Teilnahme!]]></surveyls_endtext>
      </row>
    </rows>
  </surveys_languagesettings>

  <groups>
    <rows>
      <row>
        <gid>${groupId}</gid>
        <sid>${surveyId}</sid>
        <group_name><![CDATA[${scale.name}]]></group_name>
        <group_order>1</group_order>
        <description><![CDATA[${scale.construct}]]></description>
        <language>${language}</language>
        <randomization_group></randomization_group>
        <grelevance>1</grelevance>
      </row>
    </rows>
  </groups>

  <questions>
    <rows>
${scale.items.map((item, i) => `
      <row>
        <qid>${i + 1}</qid>
        <parent_qid>0</parent_qid>
        <sid>${surveyId}</sid>
        <gid>${groupId}</gid>
        <type>5</type>
        <title>Q${(i + 1).toString().padStart(2, '0')}</title>
        <question><![CDATA[${item.text}]]></question>
        <preg></preg>
        <help><![CDATA[${item.isReverseCoded ? '(Umgepolt)' : ''}]]></help>
        <other>N</other>
        <mandatory>Y</mandatory>
        <question_order>${i + 1}</question_order>
        <language>${language}</language>
        <scale_id>0</scale_id>
        <same_default>0</same_default>
        <relevance>1</relevance>
        <modulename></modulename>
      </row>`).join('')}
    </rows>
  </questions>

  <answers>
    <rows>
${scale.items.flatMap((item, qi) =>
  (scale.responseFormat.anchors || LIKERT_SCALE_GUIDELINES.examples.agreement5).map((anchor, ai) => `
      <row>
        <qid>${qi + 1}</qid>
        <code>${ai + 1}</code>
        <answer><![CDATA[${anchor}]]></answer>
        <sortorder>${ai + 1}</sortorder>
        <language>${language}</language>
        <assessment_value>${ai + 1}</assessment_value>
        <scale_id>0</scale_id>
      </row>`)).join('')}
    </rows>
  </answers>

</document>`

    return xml
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').substring(0, 50)
  }
}

// ============================================================================
// QUALTRICS EXPORTER
// ============================================================================

export class QualtricsExporter {
  /**
   * Export scale to Qualtrics QSF format (JSON)
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    const qsf = this.generateQSF(scale, options.language || 'de')

    return {
      format: 'qualtrics-qsf',
      filename: `${this.sanitizeFilename(scale.name)}.qsf`,
      content: JSON.stringify(qsf, null, 2),
      mimeType: 'application/json',
    }
  }

  private static generateQSF(scale: Scale, language: string): object {
    const surveyId = `SV_${Date.now().toString(36)}`.toUpperCase()
    const anchors = scale.responseFormat.anchors || LIKERT_SCALE_GUIDELINES.examples.agreement5

    const questions = scale.items.map((item, i) => ({
      SurveyID: surveyId,
      Element: 'SQ',
      PrimaryAttribute: `QID${i + 1}`,
      SecondaryAttribute: `Q${(i + 1).toString().padStart(2, '0')}`,
      TertiaryAttribute: null,
      Payload: {
        QuestionText: item.text,
        QuestionType: 'MC',
        Selector: 'SAVR',
        SubSelector: 'TX',
        Configuration: {
          QuestionDescriptionOption: 'UseText',
        },
        QuestionDescription: `Item ${i + 1}${item.isReverseCoded ? ' (R)' : ''}`,
        Choices: Object.fromEntries(
          anchors.map((anchor, ai) => [ai + 1, { Display: anchor }])
        ),
        ChoiceOrder: anchors.map((_, ai) => ai + 1),
        Validation: {
          Settings: {
            ForceResponse: 'ON',
            Type: 'None',
          },
        },
        Language: [],
        NextChoiceId: anchors.length + 1,
        NextAnswerId: 1,
        DataExportTag: `Q${i + 1}`,
      },
    }))

    return {
      SurveyEntry: {
        SurveyID: surveyId,
        SurveyName: scale.name,
        SurveyDescription: `Messinstrument für: ${scale.construct}`,
        SurveyOwnerID: 'EVIDENRA',
        SurveyBrandID: 'evidenra',
        DivisionID: null,
        SurveyLanguage: language === 'de' ? 'DE' : 'EN',
        SurveyActiveResponseSet: 'RS_default',
        SurveyStatus: 'Inactive',
        SurveyStartDate: null,
        SurveyExpirationDate: null,
        SurveyCreationDate: new Date().toISOString(),
        CreatorID: 'EVIDENRA',
        LastModified: new Date().toISOString(),
        LastAccessed: null,
        LastActivated: null,
        Deleted: null,
      },
      SurveyElements: [
        {
          SurveyID: surveyId,
          Element: 'BL',
          PrimaryAttribute: 'Survey Blocks',
          SecondaryAttribute: null,
          TertiaryAttribute: null,
          Payload: {
            '0': {
              Type: 'Default',
              Description: scale.name,
              ID: 'BL_default',
              BlockElements: scale.items.map((_, i) => ({
                Type: 'Question',
                QuestionID: `QID${i + 1}`,
              })),
            },
          },
        },
        {
          SurveyID: surveyId,
          Element: 'FL',
          PrimaryAttribute: 'Survey Flow',
          SecondaryAttribute: null,
          TertiaryAttribute: null,
          Payload: {
            Flow: [
              { ID: 'BL_default', Type: 'Standard', FlowID: 'FL_1' },
            ],
            Properties: { Count: 1 },
            Type: 'Root',
            FlowID: 'FL_0',
          },
        },
        ...questions,
      ],
    }
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50)
  }
}

// ============================================================================
// REDCAP EXPORTER
// ============================================================================

export class REDCapExporter {
  /**
   * Export scale to REDCap Data Dictionary format (CSV)
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    const csv = this.generateDataDictionary(scale, options.language || 'de')

    return {
      format: 'redcap-csv',
      filename: `${this.sanitizeFilename(scale.name)}_REDCap.csv`,
      content: csv,
      mimeType: 'text/csv',
    }
  }

  private static generateDataDictionary(scale: Scale, language: string): string {
    const headers = [
      'Variable / Field Name',
      'Form Name',
      'Section Header',
      'Field Type',
      'Field Label',
      'Choices, Calculations, OR Slider Labels',
      'Field Note',
      'Text Validation Type OR Show Slider Number',
      'Text Validation Min',
      'Text Validation Max',
      'Identifier?',
      'Branching Logic (Show field only if...)',
      'Required Field?',
      'Custom Alignment',
      'Question Number (surveys only)',
      'Matrix Group Name',
      'Matrix Ranking?',
      'Field Annotation',
    ]

    const formName = this.sanitizeFilename(scale.name).toLowerCase()
    const anchors = scale.responseFormat.anchors || LIKERT_SCALE_GUIDELINES.examples.agreement5
    const choicesStr = anchors.map((anchor, i) => `${i + 1}, ${anchor}`).join(' | ')

    const rows = scale.items.map((item, i) => {
      const fieldName = `${formName}_q${(i + 1).toString().padStart(2, '0')}`
      const sectionHeader = i === 0 ? scale.name : ''

      return [
        fieldName,
        formName,
        sectionHeader,
        'radio',
        item.text,
        choicesStr,
        item.isReverseCoded ? 'Umgepoltes Item' : '',
        '',
        '',
        '',
        '',
        '',
        'y',
        '',
        (i + 1).toString(),
        '',
        '',
        item.isReverseCoded ? '@REVERSE' : '',
      ]
    })

    // Build CSV
    const csvRows = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ]

    return csvRows.join('\n')
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 30).toLowerCase()
  }
}

// ============================================================================
// CSV EXPORTER (SIMPLE)
// ============================================================================

export class CSVExporter {
  /**
   * Export scale to simple CSV format
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    const csv = this.generateCSV(scale, options)

    return {
      format: 'csv',
      filename: `${this.sanitizeFilename(scale.name)}.csv`,
      content: csv,
      mimeType: 'text/csv',
    }
  }

  private static generateCSV(scale: Scale, options: ExportOptions): string {
    const headers = [
      'Item_ID',
      'Item_Number',
      'Item_Text',
      'Dimension',
      'Reverse_Coded',
      'Response_Format',
      'Response_Points',
    ]

    if (options.includeScoringInstructions) {
      headers.push('Scoring_Instructions')
    }

    const rows = scale.items.map(item => {
      const row = [
        item.id,
        item.itemNumber.toString(),
        `"${item.text.replace(/"/g, '""')}"`,
        item.dimensionId || '',
        item.isReverseCoded ? 'Yes' : 'No',
        scale.responseFormat.type,
        scale.responseFormat.points?.toString() || '',
      ]

      if (options.includeScoringInstructions) {
        row.push(item.isReverseCoded
          ? `Reverse: ${scale.responseFormat.points} - Score + 1`
          : 'Direct scoring')
      }

      return row
    })

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  private static sanitizeFilename(name: string): string {
    return name.replace(/[^a-zA-Z0-9äöüÄÖÜß_-]/g, '_').substring(0, 50)
  }
}

// ============================================================================
// METHODS SECTION GENERATOR
// ============================================================================

export class MethodsSectionGenerator {
  /**
   * Generate methods section for academic papers
   */
  static generate(
    data: MethodsSectionData,
    language: 'de' | 'en' = 'de'
  ): string {
    if (language === 'de') {
      return this.generateGerman(data)
    }
    return this.generateEnglish(data)
  }

  private static generateGerman(data: MethodsSectionData): string {
    const { scaleInfo, validationResults, adaptationProcess } = data

    let text = `## Messinstrument

Zur Erfassung von ${scaleInfo.construct} wurde ${adaptationProcess ? 'eine adaptierte Version der' : 'die'} ${scaleInfo.name} (${scaleInfo.authors.join(' & ')}, ${scaleInfo.year}) eingesetzt. `

    text += `Das Instrument umfasst ${scaleInfo.items.length} Items`

    if (scaleInfo.dimensions && scaleInfo.dimensions.length > 1) {
      text += `, die sich auf ${scaleInfo.dimensions.length} Dimensionen verteilen: ${scaleInfo.dimensions.map(d => d.name).join(', ')}`
    }

    text += `. Die Beantwortung erfolgte auf einer ${scaleInfo.responseFormat.points}-stufigen Likert-Skala`

    if (scaleInfo.responseFormat.anchors) {
      text += ` von "${scaleInfo.responseFormat.anchors[0]}" bis "${scaleInfo.responseFormat.anchors[scaleInfo.responseFormat.anchors.length - 1]}"`
    }

    text += '.\n\n'

    // Adaptation process
    if (adaptationProcess) {
      text += `### Adaption

Die Adaption folgte den internationalen Richtlinien für Fragebogenadaption. `
      text += `${adaptationProcess.changes.length} Änderungen wurden vorgenommen. `
      text += `Die adaptierte Version wurde von ${adaptationProcess.expertPanel.length} Experten geprüft.\n\n`
    }

    // Validation results
    if (validationResults) {
      text += `### Psychometrische Eigenschaften

Die interne Konsistenz der Skala war ${this.interpretAlpha(validationResults.reliability.cronbachAlpha, 'de')} (Cronbach's α = ${validationResults.reliability.cronbachAlpha.toFixed(2)}). `

      if (validationResults.factorAnalysis) {
        text += `Eine ${validationResults.factorAnalysis.type === 'efa' ? 'exploratorische' : 'konfirmatorische'} Faktorenanalyse bestätigte die ${validationResults.factorAnalysis.factorCount}-faktorielle Struktur. `
      }
    }

    return text
  }

  private static generateEnglish(data: MethodsSectionData): string {
    const { scaleInfo, validationResults, adaptationProcess } = data

    let text = `## Measures

${scaleInfo.construct} was assessed using ${adaptationProcess ? 'an adapted version of' : ''} the ${scaleInfo.name} (${scaleInfo.authors.join(' & ')}, ${scaleInfo.year}). `

    text += `The instrument comprises ${scaleInfo.items.length} items`

    if (scaleInfo.dimensions && scaleInfo.dimensions.length > 1) {
      text += ` across ${scaleInfo.dimensions.length} dimensions: ${scaleInfo.dimensions.map(d => d.name).join(', ')}`
    }

    text += `. Responses were recorded on a ${scaleInfo.responseFormat.points}-point Likert scale`

    if (scaleInfo.responseFormat.anchors) {
      text += ` ranging from "${scaleInfo.responseFormat.anchors[0]}" to "${scaleInfo.responseFormat.anchors[scaleInfo.responseFormat.anchors.length - 1]}"`
    }

    text += '.\n\n'

    // Validation results
    if (validationResults) {
      text += `### Psychometric Properties

Internal consistency was ${this.interpretAlpha(validationResults.reliability.cronbachAlpha, 'en')} (Cronbach's α = ${validationResults.reliability.cronbachAlpha.toFixed(2)}). `

      if (validationResults.factorAnalysis) {
        text += `${validationResults.factorAnalysis.type === 'efa' ? 'Exploratory' : 'Confirmatory'} factor analysis supported the ${validationResults.factorAnalysis.factorCount}-factor structure. `
      }
    }

    return text
  }

  private static interpretAlpha(alpha: number, language: 'de' | 'en'): string {
    if (language === 'de') {
      if (alpha >= 0.9) return 'exzellent'
      if (alpha >= 0.8) return 'gut'
      if (alpha >= 0.7) return 'akzeptabel'
      return 'fragwürdig'
    } else {
      if (alpha >= 0.9) return 'excellent'
      if (alpha >= 0.8) return 'good'
      if (alpha >= 0.7) return 'acceptable'
      return 'questionable'
    }
  }
}

// ============================================================================
// MAIN EXPORTER SERVICE
// ============================================================================

export class SurveyExporter {
  /**
   * Export scale to specified format
   */
  static export(scale: Scale, options: ExportOptions): ExportResult {
    switch (options.format) {
      case 'ddi-xml':
        return DDIExporter.export(scale, options)
      case 'limesurvey-lss':
        return LimeSurveyExporter.export(scale, options)
      case 'qualtrics-qsf':
        return QualtricsExporter.export(scale, options)
      case 'redcap-csv':
        return REDCapExporter.export(scale, options)
      case 'csv':
        return CSVExporter.export(scale, options)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * Export to all formats at once
   */
  static exportAll(scale: Scale, options: Omit<ExportOptions, 'format'>): ExportResult[] {
    const formats: ExportFormat[] = ['ddi-xml', 'limesurvey-lss', 'qualtrics-qsf', 'redcap-csv', 'csv']
    return formats.map(format => this.export(scale, { ...options, format }))
  }

  /**
   * Generate methods section
   */
  static generateMethodsSection = MethodsSectionGenerator.generate

  /**
   * Get available export formats
   */
  static getAvailableFormats(): { format: ExportFormat; name: string; description: string }[] {
    return [
      { format: 'ddi-xml', name: 'DDI-XML', description: 'Data Documentation Initiative - Internationaler Standard' },
      { format: 'limesurvey-lss', name: 'LimeSurvey', description: 'Open-Source Survey-Plattform' },
      { format: 'qualtrics-qsf', name: 'Qualtrics', description: 'Enterprise Survey-Plattform' },
      { format: 'redcap-csv', name: 'REDCap', description: 'Clinical Research Data Capture' },
      { format: 'csv', name: 'CSV', description: 'Einfaches Tabellenformat' },
    ]
  }
}

export default SurveyExporter
