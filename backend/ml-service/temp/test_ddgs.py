import urllib.parse
from ddgs import DDGS

def test():
    query = "taj mahal"
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=5))
            urls = [r['image'] for r in results]
            print(urls)
    except Exception as e:
        print("DDGS Error:", e)

if __name__ == '__main__':
    test()
