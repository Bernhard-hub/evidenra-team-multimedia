/**
 * Semantic Analysis Service
 * Provides real NLP and semantic understanding instead of primitive text processing
 * Uses TF-IDF and cosine similarity for semantic analysis
 * Ported from EVIDENRA Ultimate for Team Multimedia
 */

export interface SemanticResult {
  text: string
  embedding?: number[]
  topics?: string[]
  sentiment?: {
    score: number
    label: 'positive' | 'neutral' | 'negative'
  }
  entities?: string[]
  keywords?: string[]
}

export interface SimilarityResult {
  text1: string
  text2: string
  similarity: number
}

export class SemanticAnalysisService {
  private static stopWords = new Set([
    'der', 'die', 'das', 'und', 'oder', 'aber', 'ist', 'sind', 'war', 'waren',
    'ein', 'eine', 'einer', 'eines', 'von', 'zu', 'auf', 'mit', 'für', 'durch',
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'of', 'to', 'in', 'on', 'with', 'for', 'by', 'at', 'from'
  ])

  /**
   * Create text embedding using TF-IDF approach
   */
  static createTextEmbedding(text: string, vocabulary?: string[]): number[] {
    const tokens = this.tokenize(text)

    if (!vocabulary) {
      vocabulary = Array.from(new Set(tokens))
    }

    const tf: Map<string, number> = new Map()
    tokens.forEach(token => {
      tf.set(token, (tf.get(token) || 0) + 1)
    })

    const maxFreq = Math.max(...Array.from(tf.values()), 1)
    tf.forEach((value, key) => {
      tf.set(key, value / maxFreq)
    })

    const embedding = vocabulary.map(word => tf.get(word) || 0)
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => norm > 0 ? val / norm : 0)
  }

  /**
   * Calculate cosine similarity between two text embeddings
   */
  static cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      const maxLen = Math.max(embedding1.length, embedding2.length)
      while (embedding1.length < maxLen) embedding1.push(0)
      while (embedding2.length < maxLen) embedding2.push(0)
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0)
    const norm1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0))
    const norm2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0))

    if (norm1 === 0 || norm2 === 0) return 0
    return dotProduct / (norm1 * norm2)
  }

  /**
   * Calculate semantic similarity between two texts
   */
  static calculateSimilarity(text1: string, text2: string): number {
    const tokens1 = this.tokenize(text1)
    const tokens2 = this.tokenize(text2)
    const vocabulary = Array.from(new Set([...tokens1, ...tokens2]))

    const embedding1 = this.createTextEmbedding(text1, vocabulary)
    const embedding2 = this.createTextEmbedding(text2, vocabulary)

    return this.cosineSimilarity(embedding1, embedding2)
  }

  /**
   * Extract topics using LDA-inspired approach
   */
  static extractTopics(texts: string[], numTopics: number = 5): string[][] {
    const allTokens = texts.flatMap(text => this.tokenize(text))
    const vocabulary = Array.from(new Set(allTokens))

    const docTermMatrix = texts.map(text =>
      this.createTextEmbedding(text, vocabulary)
    )

    const termScores: Map<string, number> = new Map()
    vocabulary.forEach((term, idx) => {
      const score = docTermMatrix.reduce((sum, doc) => sum + doc[idx], 0)
      termScores.set(term, score)
    })

    const sortedTerms = Array.from(termScores.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([term]) => term)

    const topics: string[][] = []
    const termsPerTopic = Math.ceil(sortedTerms.length / numTopics)

    for (let i = 0; i < numTopics; i++) {
      const start = i * termsPerTopic
      const end = Math.min(start + termsPerTopic, sortedTerms.length)
      topics.push(sortedTerms.slice(start, end).slice(0, 10))
    }

    return topics.filter(topic => topic.length > 0)
  }

  /**
   * Perform sentiment analysis
   */
  static analyzeSentiment(text: string): { score: number; label: 'positive' | 'neutral' | 'negative' } {
    const positiveWords = new Set([
      'gut', 'besser', 'beste', 'positiv', 'erfolg', 'vorteil', 'wichtig', 'effektiv',
      'good', 'better', 'best', 'positive', 'success', 'advantage', 'important', 'effective',
      'excellent', 'great', 'beneficial', 'valuable', 'significant'
    ])

    const negativeWords = new Set([
      'schlecht', 'schlechter', 'schlechteste', 'negativ', 'problem', 'nachteil', 'fehler',
      'bad', 'worse', 'worst', 'negative', 'problem', 'disadvantage', 'error',
      'poor', 'weak', 'difficult', 'limited', 'insufficient'
    ])

    const tokens = this.tokenize(text)
    let score = 0

    tokens.forEach(token => {
      if (positiveWords.has(token)) score += 1
      if (negativeWords.has(token)) score -= 1
    })

    const normalizedScore = Math.max(-1, Math.min(1, score / Math.sqrt(tokens.length + 1)))

    let label: 'positive' | 'neutral' | 'negative'
    if (normalizedScore > 0.1) label = 'positive'
    else if (normalizedScore < -0.1) label = 'negative'
    else label = 'neutral'

    return { score: normalizedScore, label }
  }

  /**
   * Extract named entities
   */
  static extractEntities(text: string): string[] {
    const entityPattern = /\b[A-ZÄÖÜ][a-zäöüß]*(?:\s+[A-ZÄÖÜ][a-zäöüß]*)*\b/g
    const matches = text.match(entityPattern) || []

    const filtered = matches.filter(entity => {
      const words = entity.split(/\s+/)
      return words.length > 1 || !this.stopWords.has(entity.toLowerCase())
    })

    return Array.from(new Set(filtered))
      .sort((a, b) => b.length - a.length)
      .slice(0, 20)
  }

  /**
   * Extract keywords using TextRank-inspired algorithm
   */
  static extractKeywords(text: string, numKeywords: number = 10): string[] {
    const tokens = this.tokenize(text)
    const uniqueTokens = Array.from(new Set(tokens))

    const cooccurrence: Map<string, Map<string, number>> = new Map()
    const windowSize = 5

    for (let i = 0; i < tokens.length; i++) {
      const word = tokens[i]
      if (!cooccurrence.has(word)) {
        cooccurrence.set(word, new Map())
      }

      for (let j = Math.max(0, i - windowSize); j < Math.min(tokens.length, i + windowSize + 1); j++) {
        if (i !== j) {
          const neighbor = tokens[j]
          const neighbors = cooccurrence.get(word)!
          neighbors.set(neighbor, (neighbors.get(neighbor) || 0) + 1)
        }
      }
    }

    const scores: Map<string, number> = new Map()
    uniqueTokens.forEach(word => scores.set(word, 1.0))

    const iterations = 30
    const dampingFactor = 0.85

    for (let iter = 0; iter < iterations; iter++) {
      const newScores: Map<string, number> = new Map()

      uniqueTokens.forEach(word => {
        let score = 1 - dampingFactor
        const neighbors = cooccurrence.get(word)

        if (neighbors) {
          neighbors.forEach((weight, neighbor) => {
            const neighborScore = scores.get(neighbor) || 1.0
            const neighborDegree = cooccurrence.get(neighbor)?.size || 1
            score += dampingFactor * (weight * neighborScore / neighborDegree)
          })
        }

        newScores.set(word, score)
      })

      scores.clear()
      newScores.forEach((score, word) => scores.set(word, score))
    }

    return Array.from(scores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, numKeywords)
      .map(([word]) => word)
  }

  /**
   * Find semantic clusters in texts
   */
  static findClusters(texts: string[], threshold: number = 0.5): string[][] {
    const clusters: string[][] = []
    const used = new Set<number>()

    for (let i = 0; i < texts.length; i++) {
      if (used.has(i)) continue

      const cluster = [texts[i]]
      used.add(i)

      for (let j = i + 1; j < texts.length; j++) {
        if (used.has(j)) continue

        const similarity = this.calculateSimilarity(texts[i], texts[j])
        if (similarity >= threshold) {
          cluster.push(texts[j])
          used.add(j)
        }
      }

      if (cluster.length > 0) {
        clusters.push(cluster)
      }
    }

    return clusters
  }

  /**
   * Tokenize text
   */
  private static tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\säöüß]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
  }

  /**
   * Calculate TF-IDF scores for a corpus
   */
  static calculateTFIDF(documents: string[]): Map<string, number[]> {
    const allTokens = documents.map(doc => this.tokenize(doc))
    const vocabulary = Array.from(new Set(allTokens.flat()))

    const idf: Map<string, number> = new Map()
    vocabulary.forEach(term => {
      const docsWithTerm = allTokens.filter(tokens => tokens.includes(term)).length
      idf.set(term, Math.log(documents.length / (docsWithTerm + 1)))
    })

    const tfidf: Map<string, number[]> = new Map()

    allTokens.forEach((tokens, docIdx) => {
      const tf: Map<string, number> = new Map()
      tokens.forEach(token => {
        tf.set(token, (tf.get(token) || 0) + 1)
      })

      vocabulary.forEach(term => {
        const termTF = tf.get(term) || 0
        const termIDF = idf.get(term) || 0

        if (!tfidf.has(term)) {
          tfidf.set(term, new Array(documents.length).fill(0))
        }
        tfidf.get(term)![docIdx] = termTF * termIDF
      })
    })

    return tfidf
  }

  /**
   * Summarize text using extractive summarization
   */
  static summarizeText(text: string, numSentences: number = 3): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)

    if (sentences.length <= numSentences) {
      return sentences
    }

    const keywords = this.extractKeywords(text, 20)
    const scores = sentences.map(sentence => {
      const tokens = this.tokenize(sentence)
      return keywords.filter(kw => tokens.includes(kw)).length / tokens.length
    })

    const indexedScores = scores.map((score, idx) => ({ score, idx }))
    indexedScores.sort((a, b) => b.score - a.score)

    const topIndices = indexedScores
      .slice(0, numSentences)
      .map(item => item.idx)
      .sort((a, b) => a - b)

    return topIndices.map(idx => sentences[idx].trim())
  }
}

export default SemanticAnalysisService
