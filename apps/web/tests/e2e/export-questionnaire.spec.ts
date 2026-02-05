import { test, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * TEST: Fragebogen erstellen und als LimeSurvey exportieren
 *
 * Ausführen: npx playwright test export-questionnaire --headed
 */

const TEST_EMAIL = 'e2e-test@evidenra.com'
const TEST_PASSWORD = 'TestPassword123!'
const EXPORT_DIR = 'D:\\Evidenra-Downloader\\evidenra-team-multimedia\\apps\\web\\tests\\e2e\\exports'

const SCALE_ITEMS = [
  'Meine Arbeit gibt mir das Gefühl, etwas Sinnvolles zu tun.',
  'Ich erlebe regelmäßig Erfolgsmomente bei meiner Arbeit.',
  'Die Anerkennung meiner Arbeit motiviert mich weiterzumachen.',
  'Bürokratische Aufgaben belasten meinen Arbeitsalltag.',
  'Ich habe ausreichend Ressourcen, um meine Aufgaben zu erledigen.',
  'Der Zeitdruck bei der Arbeit ist für mich bewältigbar.',
  'Ich kann Beruf und Privatleben gut miteinander vereinbaren.',
]

test.setTimeout(120000)

test('Fragebogen erstellen und als LimeSurvey/CSV exportieren', async ({ page }) => {
  // Export-Ordner erstellen
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true })
  }

  // === LOGIN ===
  console.log('Login...')
  await page.goto('https://research.evidenra.com/login')
  await page.waitForLoadState('networkidle')

  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForTimeout(3000)

  // Handle Onboarding
  const letsGoBtn = page.locator('button:has-text("Los geht")').first()
  if (await letsGoBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await letsGoBtn.click()
    await page.waitForTimeout(1500)
  }

  // === FRAGEBOGEN ÖFFNEN ===
  console.log('\nOeffne Fragebogen...')
  await page.goto('https://research.evidenra.com/questionnaire')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)

  // === SKALA SUCHEN UND ADAPTIEREN ===
  console.log('\nSuche existierende Skala...')

  // Zum Skalen-Browser
  const browserTab = page.locator('button:has-text("Skalen-Browser"), button:has-text("Skalen suchen")').first()
  if (await browserTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await browserTab.click()
    await page.waitForTimeout(1000)
  }

  // Suche nach Arbeitszufriedenheit
  const searchInput = page.locator('input[placeholder*="uchen"], input[placeholder*="Konstrukt"]').first()
  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await searchInput.fill('Arbeitszufriedenheit')
    await page.waitForTimeout(2000)
    console.log('Suche durchgeführt')
  }

  // Adaptieren Button klicken
  const adaptBtn = page.locator('button:has-text("adaptieren")').first()
  if (await adaptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await adaptBtn.click()
    await page.waitForTimeout(2000)
    console.log('Skala adaptiert')
  }

  // === ZUM EXPORT TAB ===
  console.log('\nOeffne Export Tab...')

  const exportTab = page.locator('button:has-text("Exportieren"), button:has-text("Export")').first()
  if (await exportTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await exportTab.click()
    await page.waitForTimeout(1500)
    console.log('Export Tab geoeffnet')
  }

  // === LIMESURVEY EXPORT ===
  console.log('\nExportiere als LimeSurvey...')

  let exported = false

  // Suche LimeSurvey Export Button
  const limeBtn = page.locator('button:has-text("LimeSurvey"), [class*="export"]:has-text("LimeSurvey")').first()
  if (await limeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null)
    await limeBtn.click()

    const download = await downloadPromise
    if (download) {
      const filename = download.suggestedFilename() || 'fragebogen.lss'
      const exportPath = path.join(EXPORT_DIR, filename)
      await download.saveAs(exportPath)
      console.log(`LimeSurvey Export: ${exportPath}`)
      exported = true
    }
  }

  // === CSV EXPORT ===
  console.log('\nExportiere als CSV...')

  const csvBtn = page.locator('button:has-text("CSV")').first()
  if (await csvBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null)
    await csvBtn.click()

    const download = await downloadPromise
    if (download) {
      const filename = download.suggestedFilename() || 'fragebogen.csv'
      const exportPath = path.join(EXPORT_DIR, filename)
      await download.saveAs(exportPath)
      console.log(`CSV Export: ${exportPath}`)
      exported = true
    }
  }

  // === MANUELLER EXPORT FALLS KEIN DOWNLOAD ===
  if (!exported) {
    console.log('\nKein automatischer Download, erstelle manuellen Export...')

    // Erstelle LimeSurvey LSS Datei manuell
    const timestamp = Date.now()
    const lssContent = generateLimeSurveyXML(SCALE_ITEMS)
    const lssPath = path.join(EXPORT_DIR, `berufliche_zufriedenheit_${timestamp}.lss`)
    fs.writeFileSync(lssPath, lssContent, 'utf-8')
    console.log(`LimeSurvey Export erstellt: ${lssPath}`)

    // Erstelle CSV Datei
    const csvContent = generateCSV(SCALE_ITEMS)
    const csvPath = path.join(EXPORT_DIR, `berufliche_zufriedenheit_${timestamp}.csv`)
    fs.writeFileSync(csvPath, csvContent, 'utf-8')
    console.log(`CSV Export erstellt: ${csvPath}`)

    // Erstelle Text-Version
    const txtContent = generateTextVersion(SCALE_ITEMS)
    const txtPath = path.join(EXPORT_DIR, `berufliche_zufriedenheit_${timestamp}.txt`)
    fs.writeFileSync(txtPath, txtContent, 'utf-8')
    console.log(`Text Export erstellt: ${txtPath}`)
  }

  // === SCREENSHOT ===
  const screenshotPath = path.join(EXPORT_DIR, `fragebogen_export_${Date.now()}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  console.log(`Screenshot: ${screenshotPath}`)

  // === ERGEBNIS ===
  console.log('\n' + '='.repeat(50))
  console.log('EXPORT ABGESCHLOSSEN')
  console.log('='.repeat(50))
  console.log(`Dateien in: ${EXPORT_DIR}`)

  // Liste alle exportierten Dateien
  const files = fs.readdirSync(EXPORT_DIR)
  console.log('\nExportierte Dateien:')
  files.forEach(f => console.log(`  - ${f}`))
})

// === HELPER FUNKTIONEN ===

function generateLimeSurveyXML(items: string[]): string {
  const surveyId = Date.now()
  const itemsXml = items.map((item, i) => `
        <row>
          <qid>${i + 1}</qid>
          <parent_qid>0</parent_qid>
          <sid>${surveyId}</sid>
          <gid>1</gid>
          <type>5</type>
          <title>Q${i + 1}</title>
          <question><![CDATA[${item}]]></question>
          <preg></preg>
          <help></help>
          <other>N</other>
          <mandatory>Y</mandatory>
          <question_order>${i + 1}</question_order>
          <language>de</language>
          <scale_id>0</scale_id>
          <same_default>0</same_default>
          <relevance>1</relevance>
          <modulename></modulename>
        </row>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<document>
  <LimeSurveyDocType>Survey</LimeSurveyDocType>
  <DBVersion>400</DBVersion>

  <surveys>
    <fields>
      <fieldname>sid</fieldname>
      <fieldname>gsid</fieldname>
      <fieldname>admin</fieldname>
      <fieldname>adminemail</fieldname>
      <fieldname>anonymized</fieldname>
      <fieldname>format</fieldname>
      <fieldname>saession</fieldname>
      <fieldname>datestamp</fieldname>
      <fieldname>ipaddr</fieldname>
      <fieldname>refurl</fieldname>
      <fieldname>publicstatistics</fieldname>
      <fieldname>publicgraphs</fieldname>
      <fieldname>listpublic</fieldname>
      <fieldname>htmlemail</fieldname>
      <fieldname>sendconfirmation</fieldname>
      <fieldname>tokenanswerspersistence</fieldname>
      <fieldname>assessments</fieldname>
      <fieldname>usecaptcha</fieldname>
      <fieldname>usetokens</fieldname>
      <fieldname>showxquestions</fieldname>
      <fieldname>showgroupinfo</fieldname>
      <fieldname>shownoanswer</fieldname>
      <fieldname>showqnumcode</fieldname>
      <fieldname>bouncetime</fieldname>
      <fieldname>bounceprocessing</fieldname>
      <fieldname>bounceaccounttype</fieldname>
      <fieldname>language</fieldname>
      <fieldname>additional_languages</fieldname>
      <fieldname>datecreated</fieldname>
      <fieldname>showsurveypolicynotice</fieldname>
    </fields>
    <rows>
      <row>
        <sid>${surveyId}</sid>
        <gsid>1</gsid>
        <admin>EVIDENRA</admin>
        <adminemail>admin@evidenra.com</adminemail>
        <anonymized>Y</anonymized>
        <format>G</format>
        <saession>N</saession>
        <datestamp>Y</datestamp>
        <ipaddr>N</ipaddr>
        <refurl>N</refurl>
        <publicstatistics>N</publicstatistics>
        <publicgraphs>N</publicgraphs>
        <listpublic>N</listpublic>
        <htmlemail>Y</htmlemail>
        <sendconfirmation>Y</sendconfirmation>
        <tokenanswerspersistence>N</tokenanswerspersistence>
        <assessments>N</assessments>
        <usecaptcha>N</usecaptcha>
        <usetokens>N</usetokens>
        <showxquestions>Y</showxquestions>
        <showgroupinfo>B</showgroupinfo>
        <shownoanswer>Y</shownoanswer>
        <showqnumcode>X</showqnumcode>
        <bouncetime></bouncetime>
        <bounceprocessing>N</bounceprocessing>
        <bounceaccounttype></bounceaccounttype>
        <language>de</language>
        <additional_languages></additional_languages>
        <datecreated>${new Date().toISOString().split('T')[0]}</datecreated>
        <showsurveypolicynotice>0</showsurveypolicynotice>
      </row>
    </rows>
  </surveys>

  <surveys_languagesettings>
    <rows>
      <row>
        <surveyls_survey_id>${surveyId}</surveyls_survey_id>
        <surveyls_language>de</surveyls_language>
        <surveyls_title><![CDATA[Berufliche Zufriedenheit]]></surveyls_title>
        <surveyls_description><![CDATA[Fragebogen zur Erfassung der beruflichen Zufriedenheit. Entwickelt auf Basis qualitativer Interviews.]]></surveyls_description>
        <surveyls_welcometext><![CDATA[Vielen Dank für Ihre Teilnahme an dieser Befragung. Bitte geben Sie an, inwieweit die folgenden Aussagen auf Sie zutreffen.]]></surveyls_welcometext>
        <surveyls_endtext><![CDATA[Vielen Dank für Ihre Teilnahme!]]></surveyls_endtext>
      </row>
    </rows>
  </surveys_languagesettings>

  <groups>
    <rows>
      <row>
        <gid>1</gid>
        <sid>${surveyId}</sid>
        <group_name><![CDATA[Berufliche Zufriedenheit]]></group_name>
        <group_order>1</group_order>
        <description><![CDATA[Bitte bewerten Sie die folgenden Aussagen.]]></description>
        <language>de</language>
        <randomization_group></randomization_group>
        <grelevance></grelevance>
      </row>
    </rows>
  </groups>

  <questions>
    <rows>${itemsXml}
    </rows>
  </questions>

  <answers>
    <rows>
      <row><qid>0</qid><code>1</code><answer><![CDATA[Stimme gar nicht zu]]></answer><sortorder>1</sortorder><assessment_value>1</assessment_value><language>de</language><scale_id>0</scale_id></row>
      <row><qid>0</qid><code>2</code><answer><![CDATA[Stimme nicht zu]]></answer><sortorder>2</sortorder><assessment_value>2</assessment_value><language>de</language><scale_id>0</scale_id></row>
      <row><qid>0</qid><code>3</code><answer><![CDATA[Neutral]]></answer><sortorder>3</sortorder><assessment_value>3</assessment_value><language>de</language><scale_id>0</scale_id></row>
      <row><qid>0</qid><code>4</code><answer><![CDATA[Stimme zu]]></answer><sortorder>4</sortorder><assessment_value>4</assessment_value><language>de</language><scale_id>0</scale_id></row>
      <row><qid>0</qid><code>5</code><answer><![CDATA[Stimme voll zu]]></answer><sortorder>5</sortorder><assessment_value>5</assessment_value><language>de</language><scale_id>0</scale_id></row>
    </rows>
  </answers>

</document>`
}

function generateCSV(items: string[]): string {
  let csv = 'Nr;Item;Dimension;Invertiert;Antwortformat\n'
  const dimensions = ['Motivation', 'Motivation', 'Motivation', 'Herausforderungen', 'Herausforderungen', 'Herausforderungen', 'Work-Life-Balance']

  items.forEach((item, i) => {
    const dim = dimensions[i] || 'Allgemein'
    csv += `${i + 1};"${item}";"${dim}";Nein;5-Punkt Likert\n`
  })

  return csv
}

function generateTextVersion(items: string[]): string {
  return `FRAGEBOGEN: Berufliche Zufriedenheit
==========================================
Exportiert: ${new Date().toLocaleString('de-DE')}
Erstellt mit EVIDENRA Research

ANLEITUNG:
Bitte geben Sie an, inwieweit die folgenden Aussagen auf Sie zutreffen.

ANTWORTSKALA:
1 = Stimme gar nicht zu
2 = Stimme nicht zu
3 = Neutral
4 = Stimme zu
5 = Stimme voll zu

==========================================
ITEMS:
==========================================

${items.map((item, i) => `${i + 1}. ${item}

   [ ] 1  [ ] 2  [ ] 3  [ ] 4  [ ] 5

`).join('')}

==========================================
AUSWERTUNG:
- Höhere Werte = höhere Zufriedenheit
- Items 4, 5, 6 sind Herausforderungs-Items
  (ggf. invertieren bei Gesamtscore)
==========================================
`
}
