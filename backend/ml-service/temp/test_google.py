import requests
import re
import urllib.parse

def test():
    query = "taj mahal"
    url = f"https://www.google.com/search?tbm=isch&q={urllib.parse.quote(query)}&gl=us&hl=en"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1"} # Old Firefox
    res = requests.get(url, headers=headers, timeout=5)
    
    # Check if there's any gstatic url
    thumb_urls = re.findall(r'(https://encrypted-tbn0\.gstatic\.com/images[^\'\"\s\\]+)', res.text)
    print("gstatic thumbnails:", len(thumb_urls))
    if thumb_urls:
        print(thumb_urls[:5])

if __name__ == '__main__':
    test()
