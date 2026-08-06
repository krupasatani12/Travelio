# Final force reload
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import os
import json
from .routing_engine import route_engine


@api_view(['POST'])
def refresh_index(request):
    """POST /api/refresh-index/ — Webhook to force CityIndex to reload."""
    try:
        from ml.city_index import city_index
        city_index.reload()
        return Response({
            'status': 'ok',
            'message': 'CityIndex reloaded successfully',
            'places': len(city_index.places_df),
            'cities': len(city_index._city_summary),
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def all_places(request):
    """GET /api/all-places/ — Full merged places list for Admin Dashboard."""
    try:
        from ml.city_index import city_index
        import numpy as np
        df = city_index.places_df.copy()
        # Replace NaN/None with safe defaults for JSON serialization
        df = df.fillna({'rating': 0, 'review_count_lakhs': 0, 'entrance_fee': 0,
                        'best_time': '', 'type': 'General', 'latitude': 0, 'longitude': 0})
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        records = df.to_dict(orient='records')
        return Response({'places': records, 'total': len(records)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def all_cities(request):
    """GET /api/all-cities/ — Full merged city summary for Admin Dashboard."""
    try:
        from ml.city_index import city_index
        import numpy as np
        df = city_index._city_summary.copy()
        df = df.replace({np.nan: None, np.inf: None, -np.inf: None})
        records = df.to_dict(orient='records')
        return Response({'cities': records, 'total': len(records)})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """Health check endpoint."""
    return Response({
        'status': 'ok',
        'service': 'TravelIO ML Service',
        'models_loaded': {
            'recommender': os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'knn_recommender.pkl')),
            'budget': os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'poly_budget.pkl')),
            'safety': os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'rf_safety.pkl')),
            'landmark': os.path.exists(os.path.join(os.path.dirname(__file__), '..', 'ml', 'models', 'wanderiq_landmark_cnn.h5')),
        },
    })


@api_view(['POST'])
def recommend(request):
    """
    POST /api/recommend/
    Body: { travel_style, budget_range, climate, duration }
    Returns: Top 5 recommended destinations via kNN
    """
    try:
        from ml.recommender import get_recommendations
        data = request.data
        results = get_recommendations(
            categories=data.get('categories', ['Historical']),
            vibes=data.get('vibes', ['Family Fun']),
            budget=data.get('budget_range', 'medium'),
            days=int(data.get('duration', 5)),
            group_size=int(data.get('group_size', 2)),
            top_n=5
        )
        return Response({'recommendations': results})
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Recommender model not yet trained. Run: python manage.py train_models'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['POST'])
def budget_predict(request):
    """
    POST /api/budget/predict/
    Body: { destination, duration_days, month }
    Returns: Cost breakdown prediction
    """
    try:
        from ml.budget_forecaster import predict_budget
        data = request.data
        result = predict_budget(
            destination=data.get('destination', ''),
            duration_days=int(data.get('duration_days', 5)),
            month=int(data.get('month', 1)),
            group_size=int(data.get('group_size', 2))
        )
        return Response({'prediction': result})
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Budget model not yet trained. Run: python manage.py train_models'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['POST'])
def package_budget_predict(request):
    """
    POST /api/budget/package-predict/
    Body: { package_type, nights, flight_stops, meals, start_city, ... }
    """
    try:
        from ml.package_budget import PackageBudgetForecaster
        data = request.data
        result = PackageBudgetForecaster.predict(
            package_type=data.get('package_type', 'Standard'),
            nights=int(data.get('nights', 3)),
            flight_stops=int(data.get('flight_stops', 0)),
            meals=int(data.get('meals', 2)),
            start_city=data.get('start_city', 'New Delhi'),
            airline=data.get('airline', 'Not Available'),
            avg_hotel_rating=float(data.get('avg_hotel_rating', 3.5)),
            sightseeing_stops=int(data.get('sightseeing_stops', 3))
        )
        return Response({'prediction': result})
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Package Budget model missing.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
@api_view(['GET'])
def full_text_search(request):
    """
    GET /api/search/?q=...
    Searches across city and place indices for matches.
    """
    try:
        from ml.city_index import city_index
        q = request.query_params.get('q', '').lower().strip()
        if not q:
            return Response({'cities': [], 'places': []})
            
        results = city_index.search(q)
        return Response(results)
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Failed to run full-text search.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
def semantic_search(request):
    """
    POST /api/search/semantic/
    Body: { query: "peaceful mountain temple town" }
    """
    try:
        from ml.embedding_index import semantic_index
        data = request.data
        query = data.get('query', '')
        if not query:
            return Response({'error': 'Query is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        results = semantic_index.search(query, top_k=5)
        return Response({'results': results})
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Failed to run semantic search.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def safety_score(request, city):
    """
    GET /api/safety/<city>/
    Returns: Safety classification (Low/Medium/High) + crime stats
    """
    try:
        from ml.safety_scorer import get_safety_score
        result = get_safety_score(city)
        return Response({'safety': result})
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Safety model not yet trained. Run: python manage.py train_models'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['GET'])
def cities_list(request):
    """
    GET /api/cities/?state=&sort=alpha|most_reviewed|highest_rated&page=1&limit=20
    Returns: Paginated list of cities grouped from places.csv + Top Indian Places.
    """
    try:
        from ml.city_index import city_index
        state = request.GET.get('state', None)
        sort = request.GET.get('sort', 'alpha')
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 20))
        result = city_index.get_cities(state=state, sort=sort, page=page, limit=limit)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def city_places(request, city_name):
    """
    GET /api/cities/<city_name>/places/?sort=alpha|most_reviewed|highest_rated&page=1&limit=10
    Returns: Paginated list of individual destinations within that city.
    """
    try:
        from ml.city_index import city_index
        sort = request.GET.get('sort', 'alpha')
        page = int(request.GET.get('page', 1))
        limit = int(request.GET.get('limit', 10))
        result = city_index.get_city_places(city=city_name, sort=sort, page=page, limit=limit)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



@api_view(['GET'])
def news_alerts(request):
    """
    GET /api/news/alerts/?destinations=city1,city2
    Returns: Latest scraped news for given destinations
    """
    destinations = request.query_params.get('destinations', '')
    dest_list = [d.strip() for d in destinations.split(',') if d.strip()]

    if not dest_list:
        return Response(
            {'message': 'Please provide destinations as query param: ?destinations=Mumbai,Delhi'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        from scraper.rss_reader import fetch_travel_news
        articles = fetch_travel_news(dest_list)
        return Response({
            'destinations': dest_list,
            'articles_count': len(articles),
            'articles': articles,
        })
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def predict_landmark(request):
    """
    POST /api/landmark/predict/
    Accepts multipart/form-data with 'image' file
    Returns Gemini Vision landmark recognition
    """
    if 'image' not in request.FILES:
        return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)

    image_file = request.FILES['image']

    from django.core.files.storage import FileSystemStorage
    from django.conf import settings

    fs = FileSystemStorage(location=os.path.join(settings.MEDIA_ROOT, 'landmarks'))
    filename = fs.save(image_file.name, image_file)
    saved_file_path = fs.path(filename)

    try:
        from ml.landmark_detector import LandmarkDetector
        detector = LandmarkDetector()

        result = detector.predict(saved_file_path)
        result['image_url'] = f"{settings.MEDIA_URL}landmarks/{filename}"

        return Response(result)
    except Exception as e:
        return Response(
            {'error': str(e), 'message': 'Failed to process image with Gemini Vision.'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def route(request):
    """
    GET /api/route/?source=Delhi&destination=Mumbai&optimize=price&mode=compare
    Returns the optimal route using the routing engine.
    """
    source = request.GET.get('source')
    destination = request.GET.get('destination')
    optimize = request.GET.get('optimize', 'price')
    mode = request.GET.get('mode', 'all')

    if not source or not destination:
        return Response(
            {'status': 'error', 'message': 'Source and destination are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if mode == 'compare':
        flight_result = route_engine.find_best_route(source, destination, optimize, mode='flight')
        train_result = route_engine.find_best_route(source, destination, optimize, mode='train')
        return Response({
            'status': 'success',
            'compare': True,
            'flight': flight_result,
            'train': train_result
        })

    result = route_engine.find_best_route(source, destination, optimize, mode)

    if result.get('status') == 'error':
        return Response(result, status=status.HTTP_404_NOT_FOUND)

    return Response(result)


@api_view(['GET'])
def seasonal_info(request):
    """
    GET /api/seasonal/?destination=Manali&month=7
    Returns: Seasonal intelligence — weather risk, crowd level, price multiplier,
    travel advisory, and recommendation (ideal/caution/avoid).
    """
    destination = request.GET.get('destination', '')
    month = request.GET.get('month', 1)

    if not destination:
        return Response({'error': 'destination parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        from ml.seasonal_data import get_seasonal_data, get_best_months
        result = get_seasonal_data(destination, int(month))
        if result is None:
            return Response({'error': f'No seasonal data for {destination}'}, status=status.HTTP_404_NOT_FOUND)
        result['best_months'] = get_best_months(destination)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def city_detail(request, city_slug):
    """
    GET /api/cities/<city_slug>/detail/
    Returns: City metadata for the dedicated city page.
    """
    try:
        from ml.city_index import city_index
        result = city_index.get_city_detail(city_slug)
        if result is None:
            return Response({'error': f'City "{city_slug}" not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def city_nearby(request, city_slug):
    """
    GET /api/cities/<city_slug>/nearby/
    Returns: List of nearby cities (same state).
    """
    try:
        from ml.city_index import city_index
        limit = int(request.GET.get('limit', 6))
        result = city_index.get_nearby_cities(city_slug, limit=limit)
        return Response({'nearby': result})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def place_detail(request, city_slug, place_slug):
    """
    GET /api/cities/<city_slug>/places/<place_slug>/
    Returns: Full detail for a single place.
    """
    try:
        from ml.city_index import city_index
        result = city_index.get_place_detail(city_slug, place_slug)
        if result is None:
            return Response({'error': f'Place "{place_slug}" not found in "{city_slug}"'}, status=status.HTTP_404_NOT_FOUND)
        return Response(result)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def places_autocomplete(request):
    """
    GET /api/places/autocomplete/?q=goa
    Returns: Matching place names for search autocomplete.
    """
    try:
        from ml.city_index import city_index
        query = request.GET.get('q', '')
        limit = int(request.GET.get('limit', 10))
        results = city_index.autocomplete_places(query, limit=limit)
        return Response({'results': results})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .charts import (
    get_city_budget_safety_data,
    get_safety_by_state_data,
    get_budget_distribution_data,
    get_vibes_donut_data,
    get_system_health_data
)

@api_view(['GET'])
def chart_city_comparison(request):
    theme = request.GET.get('theme', 'dark')
    data = get_city_budget_safety_data(theme)
    return Response(data)

@api_view(['GET'])
def chart_safety_heatmap(request):
    theme = request.GET.get('theme', 'dark')
    data = get_safety_by_state_data(theme)
    return Response(data or {'error': 'No data available'})

@api_view(['GET'])
def chart_budget_trends(request):
    theme = request.GET.get('theme', 'dark')
    data = get_budget_distribution_data(theme)
    return Response(data or {'error': 'No data available'})

@api_view(['GET'])
def chart_vibes_donut(request):
    theme = request.GET.get('theme', 'dark')
    data = get_vibes_donut_data(theme)
    return Response(data or {'error': 'No data available'})

@api_view(['GET', 'POST'])
def chart_system_health(request):
    theme = request.GET.get('theme', 'dark')
    hits = None
    if request.method == 'POST':
        hits = request.data.get('hits')
    data = get_system_health_data(hits, theme)
    return Response(data)

