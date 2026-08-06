import networkx as nx

G = nx.MultiDiGraph()
G.add_edge('A', 'B', weight=10, type='train')
G.add_edge('A', 'B', weight=5, type='flight')

def weight_func(u, v, d):
    print("WEIGHT FUNC CALLED WITH d=", d)
    return d.get('weight', float('inf'))

try:
    path = nx.dijkstra_path(G, 'A', 'B', weight=weight_func)
    print("PATH", path)
except Exception as e:
    print("ERROR:", e)
