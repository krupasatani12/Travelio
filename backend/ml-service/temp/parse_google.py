import re

text = open('temp/google_out.html', encoding='utf-8').read()
urls = re.findall(r'<img[^>]+src=\"(https?://[^\"]+)\"', text)
print(len(urls))
print(urls[:5])
