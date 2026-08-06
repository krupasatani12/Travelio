import sys
import traceback
sys.path.append('.')
from ml.embedding_index import SemanticSearchIndex

try:
    print("Initializing...")
    idx = SemanticSearchIndex()
    print("Init done. Searching...")
    res = idx.search('mountains')
    print("Search success:", len(res))
except Exception as e:
    print("CRASHED")
    traceback.print_exc()
