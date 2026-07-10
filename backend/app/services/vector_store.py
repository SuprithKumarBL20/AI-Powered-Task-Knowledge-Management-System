import os
import math
import re
from pathlib import Path
from sqlalchemy.orm import Session
from app.config import FAISS_INDEX_PATH
from app.models import DocumentChunk, Document

# Flags for AI availability
HAS_AI = False
model = None
faiss_index = None

try:
    import numpy as np
    import faiss
    from sentence_transformers import SentenceTransformer
    
    # We will initialize the model lazily when needed to avoid blocking startup
    HAS_AI = True
except ImportError:
    HAS_AI = False

class TFIDFEngine:
    """
    A pure-Python TF-IDF Vector Space search engine.
    Used as a 100% reliable fallback if FAISS or Sentence-Transformers are not available.
    """
    @staticmethod
    def tokenize(text: str) -> list[str]:
        # Simple word tokenization, lowercased
        return re.findall(r'[a-zA-Z0-9_]+', text.lower())

    @classmethod
    def search(cls, db: Session, query: str, k: int = 5) -> list[dict]:
        # 1. Get all chunks from the database
        chunks = db.query(DocumentChunk).all()
        if not chunks:
            return []

        # 2. Tokenize docs and compute TF
        doc_tfs = []  # list of dicts: term -> count
        doc_lengths = []  # list of float lengths of vectors
        vocab = set()
        
        for chunk in chunks:
            tokens = cls.tokenize(chunk.chunk_text)
            tf = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
                vocab.add(t)
            doc_tfs.append((chunk, tf))

        # 3. Compute IDF
        N = len(chunks)
        idf = {}
        for term in vocab:
            doc_count = sum(1 for _, tf in doc_tfs if term in tf)
            idf[term] = math.log((1 + N) / (1 + doc_count)) + 1 # smooth IDF

        # 4. Vectorize docs (TF * IDF) and normalize
        doc_vectors = []
        for chunk, tf in doc_tfs:
            vec = {}
            length_sq = 0.0
            for term, count in tf.items():
                val = count * idf[term]
                vec[term] = val
                length_sq += val * val
            length = math.sqrt(length_sq)
            doc_vectors.append((chunk, vec, length))

        # 5. Vectorize Query
        query_tokens = cls.tokenize(query)
        query_tf = {}
        for t in query_tokens:
            query_tf[t] = query_tf.get(t, 0) + 1
        
        query_vec = {}
        query_len_sq = 0.0
        for term, count in query_tf.items():
            if term in idf:
                val = count * idf[term]
                query_vec[term] = val
                query_len_sq += val * val
        query_len = math.sqrt(query_len_sq)

        if query_len == 0:
            return []

        # 6. Calculate Cosine Similarity
        results = []
        for chunk, vec, length in doc_vectors:
            if length == 0:
                continue
            # Dot product
            dot = sum(query_vec[t] * vec[t] for t in query_tf if t in vec)
            sim = dot / (query_len * length)
            if sim > 0:
                results.append((chunk, sim))

        # Sort by similarity score descending
        results.sort(key=lambda x: x[1], reverse=True)
        
        # Format results
        output = []
        for chunk, score in results[:k]:
            doc = db.query(Document).filter(Document.id == chunk.document_id).first()
            output.append({
                "document_id": chunk.document_id,
                "document_title": doc.title if doc else "Unknown",
                "chunk_text": chunk.chunk_text,
                "chunk_index": chunk.chunk_index,
                "score": float(score)
            })
        return output

class AISearchEngine:
    """
    AI-powered semantic search using SentenceTransformers and FAISS.
    """
    def __init__(self):
        self.model_name = "all-MiniLM-L6-v2"
        self.dimension = 384 # Dimension of all-MiniLM-L6-v2 embeddings
        self.model = None
        self.index = None
        self.index_file = FAISS_INDEX_PATH / "index.faiss"

    def _lazy_init(self):
        # Initialize model
        if self.model is None:
            print("Initializing SentenceTransformer model...")
            self.model = SentenceTransformer(self.model_name)
        
        # Initialize or load FAISS index
        if self.index is None:
            if self.index_file.exists():
                print(f"Loading existing FAISS index from {self.index_file}...")
                try:
                    self.index = faiss.read_index(str(self.index_file))
                except Exception as e:
                    print(f"Error reading index file: {e}. Creating a new one.")
                    self._create_new_index()
            else:
                self._create_new_index()

    def _create_new_index(self):
        print("Creating a new FAISS IndexIDMap...")
        quantizer = faiss.IndexFlatIP(self.dimension) # Inner Product for Cosine Similarity
        self.index = faiss.IndexIDMap(quantizer)
        self.save_index()

    def save_index(self):
        if self.index is not None:
            faiss.write_index(self.index, str(self.index_file))
            print(f"FAISS index saved to {self.index_file}")

    def add_chunks(self, chunks: list[DocumentChunk]):
        """
        Embed and index new document chunks.
        """
        self._lazy_init()
        if not chunks:
            return
            
        texts = [c.chunk_text for c in chunks]
        ids = np.array([c.id for c in chunks], dtype=np.int64)
        
        # Generate embeddings
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        embeddings = embeddings.astype(np.float32)
        
        # Normalize for Cosine Similarity
        faiss.normalize_L2(embeddings)
        
        # Add to index
        self.index.add_with_ids(embeddings, ids)
        self.save_index()

    def delete_chunks(self, chunk_ids: list[int]):
        """
        Remove chunks from FAISS index.
        """
        self._lazy_init()
        if not chunk_ids:
            return
        ids_to_remove = np.array(chunk_ids, dtype=np.int64)
        # FAISS IndexIDMap supports removing by ID
        self.index.remove_ids(ids_to_remove)
        self.save_index()

    def search(self, db: Session, query: str, k: int = 5) -> list[dict]:
        self._lazy_init()
        if self.index.ntotal == 0:
            return []
            
        # Embed query
        query_emb = self.model.encode([query], convert_to_numpy=True)
        query_emb = query_emb.astype(np.float32)
        faiss.normalize_L2(query_emb)
        
        # Search index
        scores, ids = self.index.search(query_emb, k)
        
        # Parse results
        results = []
        # scores and ids are 2D arrays
        for score, cid in zip(scores[0], ids[0]):
            if cid == -1: # Padding value when index doesn't have enough entries
                continue
                
            chunk = db.query(DocumentChunk).filter(DocumentChunk.id == int(cid)).first()
            if chunk:
                doc = db.query(Document).filter(Document.id == chunk.document_id).first()
                results.append({
                    "document_id": chunk.document_id,
                    "document_title": doc.title if doc else "Unknown",
                    "chunk_text": chunk.chunk_text,
                    "chunk_index": chunk.chunk_index,
                    "score": float(score) # For normalized inner product, this is Cosine Similarity
                })
        return results

# Initialize AI Search Engine instance if AI is available
ai_engine = None
if HAS_AI:
    try:
        ai_engine = AISearchEngine()
    except Exception as e:
        print(f"Failed to initialize AI search engine: {e}. Falling back to TF-IDF.")
        HAS_AI = False

def index_document_chunks(db: Session, chunks: list[DocumentChunk]):
    """
    Indexes document chunks in the active search engine.
    """
    global HAS_AI, ai_engine
    if HAS_AI and ai_engine:
        try:
            ai_engine.add_chunks(chunks)
        except Exception as e:
            print(f"AI Indexing failed: {e}. Deactivating AI mode for this session.")
            HAS_AI = False

def search_documents(db: Session, query: str, k: int = 5) -> list[dict]:
    """
    Search document chunks semantically (AI) or using TF-IDF fallback.
    """
    global HAS_AI, ai_engine
    if HAS_AI and ai_engine:
        try:
            return ai_engine.search(db, query, k)
        except Exception as e:
            print(f"AI Search failed: {e}. Falling back to TF-IDF engine.")
            return TFIDFEngine.search(db, query, k)
    else:
        return TFIDFEngine.search(db, query, k)
