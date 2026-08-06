import pandas as pd
import numpy as np
import ast
import os

os.environ["USE_TF"] = "0"
os.environ["USE_TORCH"] = "1"

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(os.path.dirname(BASE_DIR), 'dataset', 'destinations', 'locations_rows.csv')

class SemanticSearchIndex:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SemanticSearchIndex, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        print("Initializing Semantic Search Index... (This might take a moment)")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embeddings = None
        self.ids = []
        self.metadata = {}
        
        if not os.path.exists(CSV_PATH):
            print(f"Warning: locations_rows.csv not found at {CSV_PATH}")
            return
            
        try:
            # We use on_bad_lines='skip' to avoid CSV formatting errors in scraped data
            df = pd.read_csv(CSV_PATH, on_bad_lines='skip', low_memory=False)
            
            # Filter rows with valid vector_embedding
            if 'vector_embedding' in df.columns:
                df_valid = df.dropna(subset=['vector_embedding'])
            elif 'embedding' in df.columns:
                df_valid = df.dropna(subset=['embedding'])
                # Rename to vector_embedding for consistency
                df_valid['vector_embedding'] = df_valid['embedding']
            else:
                print("Warning: No embedding column found in locations_rows.csv")
                return

            print(f"Found {len(df_valid)} valid embeddings out of {len(df)} rows. Parsing...")
            
            matrix = []
            valid_ids = []
            
            import json
            for _, row in df_valid.iterrows():
                try:
                    vec = json.loads(row['vector_embedding'])
                    if len(vec) == 384:
                        matrix.append(vec)
                        valid_ids.append(row['id'])
                        
                        # Extract Image
                        hero_image = ''
                        try:
                            if not pd.isna(row.get('unsplash_images')):
                                urls = json.loads(row['unsplash_images'].replace("'", '"'))
                                if urls and len(urls) > 0:
                                    hero_image = urls[0]
                        except Exception:
                            pass
                        
                        if not hero_image:
                            try:
                                if not pd.isna(row.get('images')):
                                    urls = json.loads(row['images'].replace("'", '"'))
                                    if urls and len(urls) > 0:
                                        hero_image = urls[0]
                            except Exception:
                                pass

                        # Extract Teaser
                        teaser = 'A beautiful destination matching your description.'
                        try:
                            if not pd.isna(row.get('wikipedia_content')):
                                teaser = str(row['wikipedia_content'])[:300] + '...'
                        except Exception:
                            pass

                        self.metadata[row['id']] = {
                            'name': str(row.get('name', row['id'])),
                            'state': str(row.get('state', 'India')),
                            'heroImage': hero_image,
                            'teaserText': teaser,
                        }

                except Exception:
                    continue
            
            self.embeddings = np.array(matrix)
            self.ids = valid_ids
            print(f"Success: Loaded {len(self.embeddings)} location embeddings into memory.")
            
        except Exception as e:
            print(f"Error loading embeddings: {e}")

    def search(self, query, top_k=5):
        if self.embeddings is None or len(self.embeddings) == 0:
            return []
            
        # Encode the query
        query_vec = self.model.encode([query])
        
        # Calculate cosine similarity
        similarities = cosine_similarity(query_vec, self.embeddings)[0]
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            loc_id = self.ids[idx]
            meta = self.metadata.get(loc_id, {})
            hero = meta.get('heroImage', '')
            
            if not hero:
                from ml.image_scraper import get_google_images
                try:
                    photos = get_google_images(f"{meta.get('name', loc_id)} {meta.get('state', 'India')} tourism", 2, fast_mode=True)
                    if photos and len(photos) > 1:
                        hero = photos[1] # Use 2nd image
                    elif photos:
                        hero = photos[0]
                    meta['heroImage'] = hero # Cache it for next time
                except:
                    pass
                    
            results.append({
                'id': loc_id,
                'score': float(similarities[idx]),
                'name': meta.get('name', loc_id),
                'state': meta.get('state', 'India'),
                'heroImage': hero,
                'teaserText': meta.get('teaserText', ''),
            })
            
        return results

# Expose a singleton instance for easy import
semantic_index = SemanticSearchIndex()
