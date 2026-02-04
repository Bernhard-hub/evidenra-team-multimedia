import { useState } from 'react'
import { projectTemplates, templateIcons, type ProjectTemplate, type CodeTemplate } from '@/lib/templates'

interface TemplateSelectorProps {
  onSelect: (template: ProjectTemplate) => void
  onClose: () => void
}

export default function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 rounded-xl border border-surface-700 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-surface-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-surface-100">Projekt-Vorlage wählen</h2>
              <p className="text-sm text-surface-400 mt-1">
                Beginnen Sie mit einer vordefinierten Codestruktur für Ihre Forschungsmethode
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-800 text-surface-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template)
                  setShowPreview(true)
                }}
                className={`p-4 rounded-xl border text-left transition-all hover:border-primary-500/50 ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-surface-700 bg-surface-800/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-xl ${
                    template.id === 'empty'
                      ? 'bg-surface-700 text-surface-400'
                      : 'bg-primary-500/10 text-primary-400'
                  }`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={templateIcons[template.icon]} />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-surface-100">{template.name}</h3>
                    <p className="text-sm text-surface-400 mt-1 line-clamp-2">{template.description}</p>

                    {template.codes.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-surface-500">
                          {countTotalCodes(template.codes)} Codes
                        </span>
                        <span className="text-surface-600">•</span>
                        <span className="text-xs text-surface-500">
                          {template.codes.length} Kategorien
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedTemplate?.id === template.id && (
                    <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && selectedTemplate && (
          <div className="border-t border-surface-800 p-6 bg-surface-950/50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-medium text-surface-100">{selectedTemplate.name}</h3>
                <p className="text-sm text-surface-400">{selectedTemplate.methodology}</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-xs text-surface-500 hover:text-surface-300"
              >
                Vorschau schließen
              </button>
            </div>

            {selectedTemplate.codes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code Preview */}
                <div>
                  <h4 className="text-sm font-medium text-surface-300 mb-2">Code-Struktur</h4>
                  <div className="bg-surface-900 rounded-lg border border-surface-800 p-3 max-h-48 overflow-y-auto">
                    {selectedTemplate.codes.map((code, idx) => (
                      <CodePreview key={idx} code={code} level={0} />
                    ))}
                  </div>
                </div>

                {/* Workflow */}
                {selectedTemplate.suggestedWorkflow && (
                  <div>
                    <h4 className="text-sm font-medium text-surface-300 mb-2">Empfohlener Workflow</h4>
                    <div className="bg-surface-900 rounded-lg border border-surface-800 p-3 max-h-48 overflow-y-auto">
                      <ol className="space-y-2">
                        {selectedTemplate.suggestedWorkflow.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-surface-400">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-surface-500">
                Dieses Template enthält keine vordefinierten Codes. Sie können Ihre eigene Struktur erstellen.
              </p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-surface-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-surface-600 text-surface-300 hover:bg-surface-800 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSelect}
            disabled={!selectedTemplate}
            className="px-6 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Vorlage verwenden
          </button>
        </div>
      </div>
    </div>
  )
}

function CodePreview({ code, level }: { code: CodeTemplate; level: number }) {
  return (
    <div style={{ marginLeft: `${level * 16}px` }}>
      <div className="flex items-center gap-2 py-1">
        <span
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ backgroundColor: code.color }}
        />
        <span className="text-sm text-surface-200">{code.name}</span>
      </div>
      {code.children?.map((child, idx) => (
        <CodePreview key={idx} code={child} level={level + 1} />
      ))}
    </div>
  )
}

function countTotalCodes(codes: CodeTemplate[]): number {
  return codes.reduce((total, code) => {
    return total + 1 + (code.children ? countTotalCodes(code.children) : 0)
  }, 0)
}
