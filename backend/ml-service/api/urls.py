from django.urls import path
from . import views

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('refresh-index/', views.refresh_index, name='refresh-index'),
    path('all-places/', views.all_places, name='all-places'),
    path('all-cities/', views.all_cities, name='all-cities'),
    path('search/', views.full_text_search, name='full-text-search'),
    path('search/semantic/', views.semantic_search, name='semantic-search'),
    path('recommend/', views.recommend, name='recommend'),
    path('budget/predict/', views.budget_predict, name='budget-predict'),
    path('budget/package-predict/', views.package_budget_predict, name='package-budget-predict'),
    path('safety/<str:city>/', views.safety_score, name='safety-score'),
    path('landmark/predict/', views.predict_landmark, name='predict-landmark'),
    path('cities/', views.cities_list, name='cities-list'),
    path('cities/<str:city_name>/places/', views.city_places, name='city-places'),
    path('cities/<str:city_slug>/detail/', views.city_detail, name='city-detail'),
    path('cities/<str:city_slug>/nearby/', views.city_nearby, name='city-nearby'),
    path('cities/<str:city_slug>/places/<str:place_slug>/detail/', views.place_detail, name='place-detail'),
    path('places/autocomplete/', views.places_autocomplete, name='places-autocomplete'),
    path('news/alerts/', views.news_alerts, name='news-alerts'),
    path('route/', views.route, name='route'),
    path('seasonal/', views.seasonal_info, name='seasonal-info'),
    
    # Phase 7 Chart Routes
    path('charts/city-comparison/', views.chart_city_comparison, name='chart-city-comparison'),
    path('charts/safety-heatmap/', views.chart_safety_heatmap, name='chart-safety-heatmap'),
    path('charts/budget-trends/', views.chart_budget_trends, name='chart-budget-trends'),
    path('charts/vibes-donut/', views.chart_vibes_donut, name='chart-vibes-donut'),
    path('charts/system-health/', views.chart_system_health, name='chart-system-health'),
]

