import pandas as pd
import networkx as nx
import os
import json


class RoutingEngine:
    def __init__(self):
        self.graph = nx.MultiDiGraph()
        self.load_data()

    def load_data(self):
        base_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'dataset')
        csv_path = os.path.join(base_dir, 'airlines', 'airlines_flights_data.csv')
        trains_path = os.path.join(base_dir, 'train', 'trains.json')

        # Load flights data
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            agg_df = df.groupby(['source_city', 'destination_city']).agg(
                min_price=('price', 'min'),
                avg_price=('price', 'mean'),
                min_duration=('duration', 'min')
            ).reset_index()

            for _, row in agg_df.iterrows():
                src = row['source_city']
                dst = row['destination_city']
                self.graph.add_edge(
                    src,
                    dst,
                    price=round(row['min_price'], 2),
                    duration=round(row['min_duration'], 2),
                    type='Flight'
                )

        # Load trains data
        if os.path.exists(trains_path):
            with open(trains_path, 'r') as f:
                train_data = json.load(f)

            # Get unique cities already added by flights to use for dynamic matching
            supported_cities = set(self.graph.nodes())
            
            # Fallback dictionary for stations that don't contain the city name
            STATION_TO_CITY = {
                'HAZRAT NIZAMUDDIN': 'Delhi', 'ANAND VIHAR TRM': 'Delhi',
                'LOKMANYATILAK T': 'Mumbai', 'DADAR': 'Mumbai',
                'KSR BENGALURU': 'Bangalore', 'YESVANTPUR JN': 'Bangalore', 'BENGALURU CANT': 'Bangalore',
                'HOWRAH JN': 'Kolkata', 'SEALDAH': 'Kolkata', 'SHALIMAR': 'Kolkata',
                'CHENNAI CENTRAL': 'Chennai', 'CHENNAI EGMORE': 'Chennai',
                'HYDERABAD DECAN': 'Hyderabad', 'SECUNDERABAD JN': 'Hyderabad', 'KACHEGUDA': 'Hyderabad',
                'JAIPUR': 'Jaipur', 'JAIPUR JN': 'Jaipur',
                'AHMEDABAD JN': 'Ahmedabad', 'AHMEDABAD': 'Ahmedabad',
                'LUCKNOW NR': 'Lucknow', 'LUCKNOW': 'Lucknow',
                'PUNE JN': 'Pune', 'PUNE': 'Pune',
            }

            def get_city_for_station(station_name):
                if not station_name:
                    return None
                station_upper = station_name.upper()
                
                # Check dynamic substring match first (e.g., "MUMBAI BANDRA TERMINUS" -> "Mumbai")
                for city in supported_cities:
                    if city.upper() in station_upper:
                        return city
                        
                # Fallback to hardcoded aliases
                if station_upper in STATION_TO_CITY:
                    return STATION_TO_CITY[station_upper]
                
                # Final fallback for cities only present in train data (e.g., "SURAT")
                clean_name = station_upper.replace(' JN', '').replace(' TERMINUS', '').replace(' CANTT', '').replace(' TRM', '').strip()
                return clean_name.title()

            train_edges = []
            for feature in train_data.get('features', []):
                props = feature.get('properties', {})
                src_st = props.get('from_station_name')
                dst_st = props.get('to_station_name')

                src_city = get_city_for_station(src_st)
                dst_city = get_city_for_station(dst_st)

                if src_city and dst_city and src_city != dst_city:
                    duration_h = props.get('duration_h') or 0
                    duration_m = props.get('duration_m') or 0
                    dist = props.get('distance') or 0
                    if dist > 0 and (duration_h > 0 or duration_m > 0):
                        train_edges.append({
                            'source_city': src_city,
                            'destination_city': dst_city,
                            'duration': duration_h + (duration_m / 60.0),
                            'price': dist * 1.5  # Rough estimate ~1.5 INR per km
                        })

            if train_edges:
                tdf = pd.DataFrame(train_edges)
                tagg_df = tdf.groupby(['source_city', 'destination_city']).agg(
                    min_price=('price', 'min'),
                    min_duration=('duration', 'min')
                ).reset_index()

                for _, row in tagg_df.iterrows():
                    src = row['source_city']
                    dst = row['destination_city']
                    self.graph.add_edge(
                        src,
                        dst,
                        price=round(row['min_price'], 2),
                        duration=round(row['min_duration'], 2),
                        type='Train'
                    )
        print(f"[TravelIO] Graph loaded with {self.graph.number_of_nodes()} nodes and {self.graph.number_of_edges()} edges.")

    def find_best_route(self, source, destination, optimize='price', mode='all'):
        """Finds the best route between source and destination."""
        try:
            if optimize not in ['price', 'duration']:
                optimize = 'price'
                
            mode = mode.lower()

            # Resolve case-insensitive source and destination
            src_node, dst_node = None, None
            for node in self.graph.nodes():
                if str(node).lower() == str(source).lower():
                    src_node = node
                if str(node).lower() == str(destination).lower():
                    dst_node = node
                    
            if not src_node or not dst_node:
                raise nx.NodeNotFound("One or both cities not found in our network.")
                
            source, destination = src_node, dst_node

            def weight_func(u, v, edges):
                valid_weights = []
                for edge_data in edges.values():
                    if mode == 'all' or edge_data.get('type', '').lower() == mode:
                        valid_weights.append(edge_data.get(optimize, float('inf')))
                return min(valid_weights) if valid_weights else float('inf')

            path = nx.dijkstra_path(self.graph, source, destination, weight=weight_func)

            # Reconstruct route details
            route_details = []
            total_price = 0
            total_duration = 0

            for i in range(len(path) - 1):
                u = path[i]
                v = path[i + 1]
                edges = self.graph[u][v]

                # Find the best edge between u and v that matches the mode
                valid_edges = [e for e in edges.values() if mode == 'all' or e.get('type', '').lower() == mode]
                if not valid_edges:
                    raise nx.NetworkXNoPath("No valid edge found for the requested mode.")
                    
                best_edge = min(valid_edges, key=lambda e: e[optimize])

                total_price += best_edge['price']
                total_duration += best_edge['duration']

                route_details.append({
                    'from': u,
                    'to': v,
                    'price': best_edge['price'],
                    'duration': round(best_edge['duration'], 2),
                    'type': best_edge['type']
                })

            return {
                'status': 'success',
                'path': path,
                'total_price': round(total_price, 2),
                'total_duration': round(total_duration, 2),
                'legs': route_details
            }
        except nx.NetworkXNoPath:
            return {'status': 'error', 'message': f'No {mode} route found between these cities.'}
        except nx.NodeNotFound:
            return {'status': 'error', 'message': 'One or both cities not found in our network.'}


# Initialize singleton
route_engine = RoutingEngine()
