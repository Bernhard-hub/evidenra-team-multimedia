/**
 * Category Network Graph
 * Sprint 2 - Visualization Roadmap
 *
 * Features:
 * - Hierarchical layout (Core -> Categories -> Subcategories)
 * - Interactive zoom/pan
 * - Nodes = Categories/Codes with count
 * - Edges = Parent-child relationships
 * - Drag & Drop reorganization
 * - Cluster detection
 * - Export functionality
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Network, DataSet, Options } from 'vis-network/standalone'
import {
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
  IconDownload,
  IconFilter,
  IconInfoCircle,
  IconHierarchy,
  IconLayoutDistributeVertical,
} from '@tabler/icons-react'
import type { Code, Coding } from '@/stores/projectStore'

interface CategoryNetworkGraphProps {
  codes: Code[]
  codings: Coding[]
  onNodeClick?: (codeId: string, codeName: string) => void
  showExport?: boolean
  title?: string
}

type LayoutType = 'hierarchical' | 'force'

interface NetworkNode {
  id: string
  label: string
  color: string
  size: number
  level?: number
  title?: string
  font?: { color: string; size: number }
  borderWidth?: number
  shape?: string
}

interface NetworkEdge {
  from: string
  to: string
  arrows?: string
  color?: { color: string; opacity: number }
  width?: number
  smooth?: { type: string; roundness: number }
}

export default function CategoryNetworkGraph({
  codes,
  codings,
  onNodeClick,
  showExport = true,
  title = 'Code-Netzwerk',
}: CategoryNetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<Network | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [layoutType, setLayoutType] = useState<LayoutType>('hierarchical')
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null)

  // Build network data from codes
  const { nodes, edges, stats } = useMemo(() => {
    const nodeMap = new Map<string, NetworkNode>()
    const edgeList: NetworkEdge[] = []

    // Calculate code frequencies
    const codeFrequencies = new Map<string, number>()
    codings.forEach((coding) => {
      const count = codeFrequencies.get(coding.codeId) || 0
      codeFrequencies.set(coding.codeId, count + 1)
    })

    // Find max frequency for sizing
    const maxFreq = Math.max(...Array.from(codeFrequencies.values()), 1)

    // Create nodes for each code
    codes.forEach((code) => {
      const frequency = codeFrequencies.get(code.id) || 0
      const baseSize = 20
      const maxSize = 60
      const size = baseSize + ((frequency / maxFreq) * (maxSize - baseSize))

      // Determine level based on parentId chain
      let level = 0
      let currentCode: Code | undefined = code
      while (currentCode?.parentId) {
        level++
        currentCode = codes.find((c) => c.id === currentCode?.parentId)
      }

      nodeMap.set(code.id, {
        id: code.id,
        label: code.name.length > 20 ? code.name.slice(0, 18) + '...' : code.name,
        color: code.color,
        size,
        level,
        title: `${code.name}\n${frequency} Kodierung${frequency !== 1 ? 'en' : ''}`,
        font: {
          color: '#e2e8f0',
          size: 12,
        },
        borderWidth: 2,
        shape: level === 0 ? 'dot' : 'dot',
      })

      // Create edge to parent
      if (code.parentId) {
        edgeList.push({
          from: code.parentId,
          to: code.id,
          arrows: 'to',
          color: { color: '#475569', opacity: 0.6 },
          width: 1.5,
          smooth: { type: 'cubicBezier', roundness: 0.5 },
        })
      }
    })

    // Calculate stats
    const rootNodes = codes.filter((c) => !c.parentId).length
    const totalCodings = codings.length
    const avgCodingsPerCode = codes.length > 0 ? (totalCodings / codes.length).toFixed(1) : '0'

    return {
      nodes: Array.from(nodeMap.values()),
      edges: edgeList,
      stats: { rootNodes, totalCodings, avgCodingsPerCode },
    }
  }, [codes, codings])

  // Network options based on layout type
  const getNetworkOptions = useCallback(
    (layout: LayoutType): Options => {
      const baseOptions: Options = {
        nodes: {
          shape: 'dot',
          font: {
            color: '#e2e8f0',
            size: 12,
            face: 'system-ui',
          },
          borderWidth: 2,
          shadow: {
            enabled: true,
            color: 'rgba(0,0,0,0.3)',
            size: 5,
            x: 2,
            y: 2,
          },
        },
        edges: {
          color: { color: '#475569', opacity: 0.6 },
          width: 1.5,
          smooth: {
            enabled: true,
            type: 'cubicBezier',
            roundness: 0.5,
          },
        },
        interaction: {
          hover: true,
          hoverConnectedEdges: true,
          selectConnectedEdges: true,
          tooltipDelay: 100,
          zoomView: true,
          dragView: true,
          dragNodes: true,
        },
        physics: {
          enabled: layout === 'force',
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -50,
            centralGravity: 0.01,
            springLength: 100,
            springConstant: 0.08,
            damping: 0.4,
          },
          stabilization: {
            enabled: true,
            iterations: 200,
            updateInterval: 25,
          },
        },
      }

      if (layout === 'hierarchical') {
        return {
          ...baseOptions,
          layout: {
            hierarchical: {
              enabled: true,
              direction: 'UD', // Up-Down
              sortMethod: 'directed',
              levelSeparation: 100,
              nodeSpacing: 150,
              treeSpacing: 200,
              blockShifting: true,
              edgeMinimization: true,
              parentCentralization: true,
            },
          },
          physics: {
            enabled: false,
          },
        }
      }

      return baseOptions
    },
    []
  )

  // Initialize network
  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    const nodesDataSet = new DataSet(nodes)
    const edgesDataSet = new DataSet(edges)

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      getNetworkOptions(layoutType)
    )

    networkRef.current = network

    // Event handlers
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string
        const code = codes.find((c) => c.id === nodeId)
        setSelectedNode(nodeId)
        if (code && onNodeClick) {
          onNodeClick(code.id, code.name)
        }
      } else {
        setSelectedNode(null)
      }
    })

    network.on('hoverNode', (params) => {
      const node = nodes.find((n) => n.id === params.node)
      setHoveredNode(node || null)
    })

    network.on('blurNode', () => {
      setHoveredNode(null)
    })

    // Fit network to view after stabilization
    network.once('stabilizationIterationsDone', () => {
      network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } })
    })

    return () => {
      network.destroy()
      networkRef.current = null
    }
  }, [nodes, edges, layoutType, codes, onNodeClick, getNetworkOptions])

  // Zoom controls
  const handleZoomIn = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale()
      networkRef.current.moveTo({ scale: scale * 1.3 })
    }
  }

  const handleZoomOut = () => {
    if (networkRef.current) {
      const scale = networkRef.current.getScale()
      networkRef.current.moveTo({ scale: scale / 1.3 })
    }
  }

  const handleFit = () => {
    if (networkRef.current) {
      networkRef.current.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } })
    }
  }

  // Toggle layout
  const toggleLayout = () => {
    setLayoutType((prev) => (prev === 'hierarchical' ? 'force' : 'hierarchical'))
  }

  // Export as PNG
  const handleExport = useCallback(async () => {
    if (!containerRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
      })

      const link = document.createElement('a')
      link.download = `code_network_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Export failed:', err)
      alert('Export fehlgeschlagen. Bitte verwenden Sie die Screenshot-Funktion Ihres Browsers.')
    }
  }, [])

  if (codes.length === 0) {
    return (
      <div className="text-center py-12 text-surface-500">
        <IconFilter size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-sm">Keine Codes vorhanden</p>
        <p className="text-xs mt-1">Erstellen Sie Codes, um das Netzwerk zu sehen</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
          <div className="group relative">
            <IconInfoCircle size={16} className="text-surface-500 cursor-help" />
            <div className="absolute left-0 top-6 w-72 p-3 bg-surface-800 border border-surface-700 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <p className="text-xs text-surface-300">
                Interaktives Netzwerk-Diagramm des Code-Systems. Groessere Knoten = mehr
                Kodierungen. Ziehen Sie Knoten zum Neuanordnen. Scrollen zum Zoomen.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Layout toggle */}
          <button
            onClick={toggleLayout}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors ${
              layoutType === 'hierarchical'
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
            title={layoutType === 'hierarchical' ? 'Hierarchisch' : 'Kraft-basiert'}
          >
            {layoutType === 'hierarchical' ? (
              <IconHierarchy size={14} />
            ) : (
              <IconLayoutDistributeVertical size={14} />
            )}
            <span>{layoutType === 'hierarchical' ? 'Hierarchisch' : 'Kraft'}</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-surface-800 rounded-lg p-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-surface-400 hover:text-surface-200 transition-colors"
              title="Hineinzoomen"
            >
              <IconZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-surface-400 hover:text-surface-200 transition-colors"
              title="Herauszoomen"
            >
              <IconZoomOut size={16} />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-surface-400 hover:text-surface-200 transition-colors"
              title="Einpassen"
            >
              <IconFocusCentered size={16} />
            </button>
          </div>

          {/* Export */}
          {showExport && (
            <button
              onClick={handleExport}
              className="p-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-surface-400 hover:text-surface-200 transition-colors"
              title="Als PNG exportieren"
            >
              <IconDownload size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-xs text-surface-500">
        <span>
          <strong className="text-surface-300">{codes.length}</strong> Codes
        </span>
        <span>
          <strong className="text-surface-300">{stats.rootNodes}</strong> Hauptkategorien
        </span>
        <span>
          <strong className="text-surface-300">{stats.totalCodings}</strong> Kodierungen
        </span>
        <span>
          <strong className="text-surface-300">{stats.avgCodingsPerCode}</strong> Ø pro Code
        </span>
      </div>

      {/* Network container */}
      <div className="relative bg-surface-900 rounded-xl border border-surface-800 overflow-hidden">
        <div ref={containerRef} className="w-full h-[500px]" />

        {/* Hover tooltip */}
        {hoveredNode && (
          <div className="absolute top-4 left-4 bg-surface-800 border border-surface-700 rounded-lg p-3 shadow-xl pointer-events-none">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hoveredNode.color }}
              />
              <span className="font-medium text-surface-100">
                {codes.find((c) => c.id === hoveredNode.id)?.name || hoveredNode.label}
              </span>
            </div>
            <p className="text-xs text-surface-400">
              {codings.filter((c) => c.codeId === hoveredNode.id).length} Kodierungen
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-surface-500 px-2">
        <div className="flex items-center gap-4">
          <span>Knotengroesse = Kodierungshaeufigkeit</span>
          <span>Pfeile = Eltern-Kind-Beziehung</span>
        </div>
        <span>Ziehen zum Verschieben, Scrollen zum Zoomen</span>
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="bg-surface-800 border border-surface-700 rounded-lg p-3">
          {(() => {
            const code = codes.find((c) => c.id === selectedNode)
            if (!code) return null

            const frequency = codings.filter((c) => c.codeId === selectedNode).length
            const children = codes.filter((c) => c.parentId === selectedNode)
            const parent = code.parentId ? codes.find((c) => c.id === code.parentId) : null

            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-4 h-4 rounded" style={{ backgroundColor: code.color }} />
                  <span className="font-medium text-surface-100">{code.name}</span>
                </div>
                {code.description && (
                  <p className="text-sm text-surface-400 mb-2">{code.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm text-surface-400">
                  <span>{frequency} Kodierungen</span>
                  {parent && <span>Eltern: {parent.name}</span>}
                  {children.length > 0 && <span>{children.length} Untercodes</span>}
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
