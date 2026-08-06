"""
Seasonal Intelligence Data — month-by-month safety, crowd, and weather data
for Indian destinations. Used by the TripPlanner to warn users about bad
travel windows (monsoon, extreme heat, peak crowds).

Data source: Hardcoded expert knowledge (same approach as the prompt's
seed_seasonal_data command, but served directly from Python dict rather
than a Django ORM model, since this service has no SQL models).
"""

MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

# Each destination maps to 12 tuples:
# (weather_risk, crowd_level, price_multiplier, travel_advisory, ideal_for, avoid_because)
# weather_risk: 0=low risk, 1=high risk
# crowd_level:  0=empty, 1=packed
# price_multiplier: relative to average (1.0 = normal)

SEASONAL_MAP = {
    'Manali': [
        (1.0, 0.05, 0.5,  'Heavy snow - roads may close', None, 'Extreme cold, road closures likely'),
        (0.9, 0.1,  0.55, 'Snow still heavy', None, 'Very cold'),
        (0.6, 0.2,  0.7,  'Snow melting, roads opening', 'Early spring trekking', None),
        (0.3, 0.4,  0.85, None, 'Great weather, flowers bloom', None),
        (0.2, 0.6,  1.0,  None, 'Best month for trekking', None),
        (0.5, 0.8,  0.9,  'Monsoon begins', None, 'Landslide risk on highway'),
        (0.7, 0.7,  0.75, 'Monsoon - landslide risk high', None, 'Manali-Leh road closures common'),
        (0.7, 0.6,  0.75, 'Monsoon continues', None, 'Landslide risk'),
        (0.4, 0.5,  0.85, 'Post-monsoon clearing', 'Good photography weather', None),
        (0.3, 0.5,  1.0,  None, 'Autumn colours, pleasant', None),
        (0.7, 0.3,  0.9,  'Early snow', 'Skiing starts', None),
        (1.0, 0.4,  1.2,  'Peak winter - skiing season', 'Skiing, snowfall views', 'Extreme cold at night'),
    ],
    'Gokarna': [
        (0.1, 0.3, 1.1, None, 'Cool and dry, ideal beach weather', None),
        (0.1, 0.4, 1.1, None, 'Great beach weather', None),
        (0.1, 0.3, 1.0, None, 'Warm and pleasant', None),
        (0.2, 0.2, 0.9, None, 'Hot but good', None),
        (0.3, 0.2, 0.85, 'Getting hot', None, 'Very humid by end of month'),
        (0.8, 0.05, 0.6, 'Monsoon - beaches closed', None, 'Dangerous sea currents'),
        (0.9, 0.03, 0.5, 'Heavy monsoon', None, 'Beaches closed, dangerous'),
        (0.9, 0.03, 0.5, 'Monsoon continues', None, 'Avoid swimming'),
        (0.7, 0.1, 0.65, 'Monsoon tapering', None, 'Still some rough seas'),
        (0.2, 0.3, 0.9, 'Post-monsoon, lush green', 'Beautiful post-rain scenery', None),
        (0.1, 0.4, 1.0, None, 'Ideal beach season starts', None),
        (0.1, 0.6, 1.2, None, 'Peak season - best weather', 'Crowded and expensive'),
    ],
    'Jaipur': [
        (0.1, 0.5, 1.1, None, 'Pleasant winter weather, festivals', None),
        (0.1, 0.6, 1.2, None, 'Best month - perfect weather', None),
        (0.2, 0.4, 1.0, None, 'Warm but comfortable', None),
        (0.4, 0.2, 0.8, 'Getting very hot', None, 'Temperatures above 40C'),
        (0.7, 0.1, 0.6, 'Extreme heat', None, 'Dangerously hot, 45C+'),
        (0.6, 0.1, 0.6, 'Pre-monsoon heat', None, 'Very hot and humid'),
        (0.5, 0.15, 0.7, 'Monsoon rains begin', 'Lush green landscapes', 'Some flooding risk'),
        (0.5, 0.15, 0.7, 'Monsoon continues', None, 'Humidity very high'),
        (0.4, 0.2, 0.75, 'Post-monsoon', 'Green desert landscapes', None),
        (0.2, 0.5, 1.0, None, 'Pleasant weather returns', None),
        (0.1, 0.6, 1.1, None, 'Peak tourist season', None),
        (0.1, 0.7, 1.3, None, 'Peak season - festivals', 'Very crowded at monuments'),
    ],
    'Goa': [
        (0.1, 0.5, 1.2, None, 'Peak season - perfect beach weather', 'Expensive'),
        (0.1, 0.4, 1.1, None, 'Great beach weather, fewer crowds', None),
        (0.2, 0.3, 1.0, None, 'Warm, good for beaches', None),
        (0.3, 0.1, 0.8, 'Getting hot', None, 'Very humid'),
        (0.5, 0.05, 0.6, 'Pre-monsoon', None, 'Many shacks close'),
        (0.8, 0.03, 0.4, 'Monsoon hits hard', None, 'Beach activities shut down'),
        (0.9, 0.02, 0.35, 'Peak monsoon', None, 'Heavy rain, rough seas'),
        (0.8, 0.03, 0.4, 'Monsoon continues', None, 'Most tourism shuts down'),
        (0.6, 0.1, 0.6, 'Monsoon tapering', 'Lush green Goa, waterfalls', None),
        (0.3, 0.3, 0.9, None, 'Season reopening, good deals', None),
        (0.1, 0.5, 1.1, None, 'Peak season starts', None),
        (0.1, 0.8, 1.5, None, 'Christmas/NYE - best nightlife', 'Very expensive, very crowded'),
    ],
    'Kerala': [
        (0.1, 0.4, 1.1, None, 'Peak season - backwaters, beaches', None),
        (0.1, 0.5, 1.2, None, 'Best weather for houseboat stays', None),
        (0.2, 0.3, 1.0, None, 'Warm and pleasant', None),
        (0.3, 0.2, 0.85, None, 'Hot but manageable in hill stations', None),
        (0.5, 0.1, 0.7, 'Pre-monsoon showers', None, 'Getting humid'),
        (0.7, 0.05, 0.5, 'Southwest monsoon', 'Ayurveda season (monsoon treatments)', 'Heavy rain'),
        (0.8, 0.05, 0.5, 'Peak monsoon', 'Traditional Ayurveda', 'Flooding risk in low areas'),
        (0.7, 0.1, 0.55, 'Monsoon continues', None, 'Landslide risk in hills'),
        (0.5, 0.2, 0.7, 'Northeast monsoon begins', None, 'Unpredictable rain'),
        (0.4, 0.3, 0.85, None, 'Post-monsoon, lush green', None),
        (0.2, 0.4, 1.0, None, 'Season picks up again', None),
        (0.1, 0.5, 1.2, None, 'Peak season - Christmas tourism', None),
    ],
    'Varanasi': [
        (0.2, 0.4, 1.0, None, 'Pleasant winter, great for ghats', None),
        (0.1, 0.5, 1.1, None, 'Best month - Maha Shivaratri', None),
        (0.2, 0.3, 0.9, None, 'Holi celebrations', None),
        (0.5, 0.2, 0.7, 'Getting hot', None, 'Temperatures rising fast'),
        (0.8, 0.1, 0.5, 'Extreme heat', None, 'Dangerously hot, 45C+'),
        (0.7, 0.1, 0.5, 'Pre-monsoon', None, 'Very hot and humid'),
        (0.6, 0.15, 0.6, 'Monsoon', None, 'Ganges floods, some ghats underwater'),
        (0.6, 0.15, 0.6, 'Monsoon continues', None, 'High water levels'),
        (0.4, 0.2, 0.7, 'Post-monsoon', None, 'Humidity still high'),
        (0.2, 0.5, 1.0, None, 'Diwali/Dev Deepawali - spectacular', None),
        (0.1, 0.6, 1.1, None, 'Peak season - pleasant weather', None),
        (0.1, 0.5, 1.0, None, 'Winter, foggy mornings on ghats', None),
    ],
    'Delhi': [
        (0.3, 0.4, 0.9, 'Dense fog, flight delays common', None, 'Severe cold wave possible'),
        (0.2, 0.4, 0.9, None, 'Winter ending, pleasant', None),
        (0.2, 0.3, 0.85, None, 'Holi festival, good weather', None),
        (0.4, 0.2, 0.7, 'Getting hot', None, 'Temperatures above 38C'),
        (0.8, 0.1, 0.5, 'Extreme heat', None, 'Heat wave risk, 45C+'),
        (0.7, 0.1, 0.5, 'Pre-monsoon dust storms', None, 'Dust storms, extreme heat'),
        (0.6, 0.15, 0.6, 'Monsoon', None, 'Waterlogging, traffic chaos'),
        (0.6, 0.15, 0.6, 'Monsoon continues', None, 'Dengue risk, flooding'),
        (0.4, 0.2, 0.7, 'Post-monsoon', None, 'Humidity still high'),
        (0.2, 0.5, 1.0, None, 'Diwali, pleasant weather', 'Air quality deteriorates'),
        (0.5, 0.3, 0.8, 'Severe air pollution', None, 'AQI dangerous (300-500)'),
        (0.3, 0.4, 0.9, 'Cold + fog', 'Christmas markets, winter food', 'Flight delays from fog'),
    ],
    'Rishikesh': [
        (0.2, 0.3, 0.9, None, 'Cool, ideal for yoga retreats', None),
        (0.1, 0.4, 1.0, None, 'Best for rafting, pleasant weather', None),
        (0.1, 0.5, 1.1, None, 'International Yoga Festival', None),
        (0.2, 0.4, 1.0, None, 'Warm, great for water activities', None),
        (0.3, 0.3, 0.9, None, 'Good before monsoon hits', None),
        (0.7, 0.1, 0.5, 'Monsoon - rafting closed', None, 'Ganges flooding, all rafting stops'),
        (0.8, 0.05, 0.4, 'Peak monsoon', None, 'Landslides, river dangerous'),
        (0.7, 0.1, 0.5, 'Monsoon continues', None, 'Adventure activities closed'),
        (0.4, 0.3, 0.8, 'Post-monsoon', 'Rafting season reopens', None),
        (0.2, 0.5, 1.1, None, 'Peak season - rafting + yoga', None),
        (0.1, 0.4, 1.0, None, 'Pleasant, good for trekking', None),
        (0.2, 0.3, 0.9, None, 'Cool, spiritual retreats', None),
    ],
    'Darjeeling': [
        (0.3, 0.2, 0.8, None, 'Cold but clear views of Kanchenjunga', None),
        (0.2, 0.3, 0.9, None, 'Pre-spring, rhododendrons start', None),
        (0.1, 0.5, 1.1, None, 'Best month - flowers, clear skies', None),
        (0.1, 0.6, 1.2, None, 'Peak season - perfect weather', None),
        (0.3, 0.4, 1.0, None, 'Warm, pre-monsoon', None),
        (0.7, 0.1, 0.6, 'Monsoon begins', None, 'Landslide risk, cloudy'),
        (0.8, 0.05, 0.5, 'Heavy monsoon', None, 'Road closures, landslides'),
        (0.8, 0.05, 0.5, 'Monsoon continues', None, 'Very wet, foggy'),
        (0.5, 0.2, 0.7, 'Post-monsoon', 'Clear views return', None),
        (0.2, 0.5, 1.1, None, 'Autumn - best views, Durga Puja', None),
        (0.2, 0.4, 1.0, None, 'Pleasant, good for toy train', None),
        (0.3, 0.3, 0.9, None, 'Cold but festive', 'Very cold at night'),
    ],
    'Agra': [
        (0.2, 0.4, 1.0, 'Dense fog can obscure Taj', 'Pleasant winter', 'Morning fog'),
        (0.1, 0.5, 1.1, None, 'Best month for Taj Mahal visit', None),
        (0.2, 0.4, 1.0, None, 'Good weather, Holi festivities', None),
        (0.5, 0.2, 0.7, 'Getting hot', None, 'Temperatures rising above 38C'),
        (0.8, 0.1, 0.5, 'Extreme heat', None, 'Marble of Taj burns bare feet, 45C+'),
        (0.7, 0.1, 0.5, 'Pre-monsoon', None, 'Unbearable heat'),
        (0.5, 0.15, 0.6, 'Monsoon', 'Green backdrop for Taj photos', 'Humidity high'),
        (0.5, 0.15, 0.6, 'Monsoon continues', None, 'Muggy conditions'),
        (0.3, 0.2, 0.7, 'Post-monsoon', None, 'Still humid'),
        (0.1, 0.5, 1.1, None, 'Perfect weather, Taj Mahotsav festival', None),
        (0.1, 0.5, 1.1, None, 'Peak season returns', None),
        (0.2, 0.4, 1.0, None, 'Winter, pleasant days', 'Cold mornings'),
    ],
    'Udaipur': [
        (0.1, 0.5, 1.1, None, 'Pleasant, lake reflections at best', None),
        (0.1, 0.5, 1.1, None, 'Best month, Mewar Festival', None),
        (0.2, 0.4, 1.0, None, 'Holi in Udaipur is spectacular', None),
        (0.4, 0.2, 0.8, 'Getting hot', None, 'Very warm days'),
        (0.7, 0.1, 0.6, 'Extreme heat', None, 'Temperatures above 42C'),
        (0.6, 0.1, 0.6, 'Pre-monsoon', None, 'Very hot'),
        (0.5, 0.2, 0.7, 'Monsoon', 'Lakes fill up, green hills', None),
        (0.5, 0.2, 0.7, 'Monsoon continues', 'Lush green surroundings', None),
        (0.3, 0.3, 0.8, 'Post-monsoon', 'Full lakes, pleasant', None),
        (0.2, 0.5, 1.0, None, 'Great weather, full lakes', None),
        (0.1, 0.5, 1.1, None, 'Peak season', None),
        (0.1, 0.6, 1.2, None, 'Peak season, Christmas tourism', None),
    ],
    'Shimla': [
        (0.8, 0.3, 1.0, 'Heavy snowfall', 'Snow lovers, skiing nearby', 'Road closures'),
        (0.7, 0.3, 0.9, 'Snow continues', 'Scenic snow views', 'Very cold'),
        (0.4, 0.3, 0.85, None, 'Snow melting, spring arriving', None),
        (0.2, 0.5, 1.0, None, 'Best month - flowers, pleasant', None),
        (0.2, 0.7, 1.2, None, 'Peak summer escape from plains', 'Very crowded'),
        (0.3, 0.8, 1.3, None, 'Peak hill station season', 'Very crowded, hotel prices high'),
        (0.6, 0.4, 0.8, 'Monsoon', None, 'Landslide risk on highways'),
        (0.6, 0.3, 0.75, 'Monsoon continues', None, 'Road conditions poor'),
        (0.3, 0.4, 0.9, 'Post-monsoon', 'Clear views, pleasant', None),
        (0.2, 0.4, 1.0, None, 'Autumn colours, great weather', None),
        (0.4, 0.2, 0.8, 'Early winter', None, 'Getting cold'),
        (0.7, 0.4, 1.1, 'Winter snow begins', 'Christmas in snow', 'Very cold'),
    ],
    'Mumbai': [
        (0.1, 0.4, 1.0, None, 'Pleasant winter, festivals', None),
        (0.1, 0.4, 1.0, None, 'Good weather', None),
        (0.2, 0.3, 0.9, None, 'Warm, Holi celebrations', None),
        (0.3, 0.2, 0.8, 'Getting hot', None, 'Humidity rising'),
        (0.5, 0.2, 0.7, 'Hot and humid', None, 'Pre-monsoon discomfort'),
        (0.7, 0.1, 0.5, 'Monsoon arrives', None, 'Waterlogging, transport disrupted'),
        (0.9, 0.1, 0.4, 'Peak monsoon', None, 'Severe flooding possible'),
        (0.8, 0.1, 0.5, 'Monsoon continues', None, 'Heavy rain, cancelled trains'),
        (0.5, 0.2, 0.6, 'Monsoon tapering', 'Ganpati festival', None),
        (0.2, 0.4, 0.9, None, 'Navratri, pleasant weather', None),
        (0.1, 0.5, 1.0, None, 'Best weather, Diwali', None),
        (0.1, 0.5, 1.1, None, 'Christmas, winter tourism', None),
    ],
    'Mysore': [
        (0.1, 0.4, 1.0, None, 'Pleasant, ideal for palace visits', None),
        (0.1, 0.4, 1.0, None, 'Great weather', None),
        (0.2, 0.3, 0.9, None, 'Warm and comfortable', None),
        (0.3, 0.2, 0.8, None, 'Getting warm', None),
        (0.4, 0.2, 0.7, None, None, 'Hot days'),
        (0.5, 0.1, 0.6, 'Pre-monsoon', None, 'Humid'),
        (0.6, 0.1, 0.6, 'Monsoon', None, 'Regular rain'),
        (0.5, 0.1, 0.6, 'Monsoon continues', None, 'Wet conditions'),
        (0.4, 0.2, 0.7, 'Post-monsoon', None, 'Humidity high'),
        (0.1, 0.8, 1.3, None, 'Dasara/Dussehra - world famous', 'Very crowded during festival'),
        (0.1, 0.4, 1.0, None, 'Pleasant weather returns', None),
        (0.1, 0.5, 1.1, None, 'Peak season', None),
    ],
    'Kolkata': [
        (0.2, 0.4, 0.9, 'Cold fog', 'Pleasant winter', None),
        (0.1, 0.4, 1.0, None, 'Good weather, spring', None),
        (0.2, 0.3, 0.9, None, 'Holi, warming up', None),
        (0.4, 0.2, 0.7, 'Getting hot', None, 'Nor-westers (thunderstorms)'),
        (0.6, 0.1, 0.5, 'Pre-monsoon cyclone risk', None, 'Very hot and humid, cyclone season'),
        (0.7, 0.1, 0.5, 'Monsoon', None, 'Heavy rain, waterlogging'),
        (0.8, 0.1, 0.4, 'Peak monsoon', None, 'Flooding common'),
        (0.7, 0.1, 0.5, 'Monsoon continues', None, 'Very wet'),
        (0.5, 0.2, 0.6, 'Post-monsoon', None, 'Humidity still high'),
        (0.1, 0.9, 1.4, None, 'Durga Puja - unmissable cultural event', 'Extremely crowded'),
        (0.1, 0.5, 1.0, None, 'Pleasant weather', None),
        (0.1, 0.4, 1.0, None, 'Winter, pleasant days', None),
    ],
    'Amritsar': [
        (0.3, 0.4, 0.9, 'Dense fog', 'Golden Temple in winter mist', 'Very cold, fog delays'),
        (0.2, 0.4, 0.9, None, 'Cold but manageable', None),
        (0.1, 0.5, 1.0, None, 'Holi, pleasant weather', None),
        (0.1, 0.5, 1.1, None, 'Baisakhi festival - best time', None),
        (0.5, 0.2, 0.7, 'Getting hot', None, 'Very warm, 40C+'),
        (0.7, 0.1, 0.5, 'Extreme heat', None, 'Dangerously hot'),
        (0.6, 0.15, 0.6, 'Monsoon', None, 'Heavy rain, humid'),
        (0.5, 0.15, 0.6, 'Monsoon continues', None, 'Wet and humid'),
        (0.3, 0.2, 0.7, 'Post-monsoon', None, 'Humidity tapering'),
        (0.1, 0.5, 1.0, None, 'Diwali at Golden Temple - stunning', None),
        (0.1, 0.6, 1.1, None, 'Guru Nanak Jayanti - peak pilgrimage', None),
        (0.2, 0.5, 1.0, None, 'Winter vibes, langar culture', 'Cold nights'),
    ],
    'Coorg': [
        (0.1, 0.4, 1.0, None, 'Cool, coffee plantation walks', None),
        (0.1, 0.4, 1.0, None, 'Pleasant weather', None),
        (0.2, 0.5, 1.1, None, 'Great weather, flowers bloom', None),
        (0.2, 0.3, 0.9, None, 'Warm but nice', None),
        (0.3, 0.2, 0.8, None, None, 'Getting humid'),
        (0.6, 0.1, 0.6, 'Monsoon begins', 'Waterfalls at peak', 'Leeches on treks'),
        (0.7, 0.1, 0.5, 'Heavy monsoon', 'Abbey Falls at full flow', 'Heavy rain, leeches'),
        (0.7, 0.1, 0.5, 'Monsoon continues', None, 'Very wet'),
        (0.5, 0.2, 0.7, 'Post-monsoon', 'Lush green everywhere', None),
        (0.2, 0.4, 1.0, None, 'Great weather returns', None),
        (0.1, 0.5, 1.1, None, 'Peak season', None),
        (0.1, 0.5, 1.1, None, 'Peak season, Christmas visitors', None),
    ],
    'Sikkim': [
        (0.4, 0.2, 0.8, 'Heavy snow at higher altitudes', None, 'Many passes closed'),
        (0.3, 0.2, 0.8, None, 'Losar festival', 'Cold'),
        (0.2, 0.4, 1.0, None, 'Rhododendrons bloom, pleasant', None),
        (0.1, 0.5, 1.1, None, 'Best month - flowers, clear views', None),
        (0.2, 0.4, 1.0, None, 'Good before monsoon', None),
        (0.7, 0.1, 0.5, 'Monsoon', None, 'Landslides, roads blocked'),
        (0.8, 0.05, 0.4, 'Peak monsoon', None, 'Severe landslide risk'),
        (0.8, 0.05, 0.4, 'Monsoon continues', None, 'Roads impassable'),
        (0.5, 0.2, 0.7, 'Post-monsoon', 'Clear Himalayan views', None),
        (0.2, 0.5, 1.1, None, 'Best autumn views, pleasant', None),
        (0.3, 0.3, 0.9, None, 'Getting cold but scenic', None),
        (0.4, 0.2, 0.8, 'Snow returns', None, 'Nathula Pass may close'),
    ],
}


def get_seasonal_data(destination, month):
    """
    Returns seasonal intelligence for a destination + month combo.
    month: 1-12 integer.
    """
    month = max(1, min(12, int(month)))
    month_idx = month - 1

    # Try exact match first, then case-insensitive partial match
    data = SEASONAL_MAP.get(destination)
    if not data:
        dest_lower = destination.strip().lower()
        for key, val in SEASONAL_MAP.items():
            if key.lower() == dest_lower or dest_lower in key.lower():
                data = val
                destination = key
                break

    if not data:
        return None

    wr, cl, pm, ta, ideal, avoid = data[month_idx]

    # Determine recommendation
    if wr < 0.3 and cl < 0.6:
        recommendation = 'ideal'
    elif wr < 0.6:
        recommendation = 'caution'
    else:
        recommendation = 'avoid'

    return {
        'destination': destination,
        'month': MONTHS[month_idx],
        'month_number': month,
        'weather_risk': wr,
        'crowd_level': cl,
        'price_multiplier': pm,
        'travel_advisory': ta or '',
        'ideal_for': ideal or '',
        'avoid_because': avoid or '',
        'recommendation': recommendation,
    }


def get_best_months(destination):
    """Returns the top 3 best months to visit a destination."""
    data = SEASONAL_MAP.get(destination)
    if not data:
        dest_lower = destination.strip().lower()
        for key, val in SEASONAL_MAP.items():
            if key.lower() == dest_lower:
                data = val
                destination = key
                break
    if not data:
        return []

    scored = []
    for i, (wr, cl, pm, ta, ideal, avoid) in enumerate(data):
        # Lower weather risk + lower crowds + lower price = better score
        score = (1 - wr) * 0.5 + (1 - cl) * 0.2 + (1 / max(pm, 0.1)) * 0.3
        scored.append((score, i))

    scored.sort(reverse=True)
    return [MONTHS[idx] for _, idx in scored[:3]]
