#!/usr/bin/env python3
"""
Fetch latest cricket matches from external APIs with multi-level fallback
and update api/cricket.json for the live streaming platform.
Designed for automated execution via GitHub Actions.
"""

import urllib.request
import json
import os
import ssl
from datetime import datetime

# API Sources in priority order
API_SOURCES = [
    ("Primary", "https://allrounderlive.com/api/cricket.json"),
    ("Fallback", "https://sonujson-v5.pages.dev/Data/willow.json"),
    ("Tertiary", "https://dilzzy-all-sports.pages.dev/data/matches.json"),
]

API_DIR = "api"
CRICKET_FILE = os.path.join(API_DIR, "cricket.json")


def get_ssl_context(unverified=False):
    """Create appropriate SSL context for cross-platform compatibility."""
    if unverified:
        ctx = ssl._create_unverified_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    try:
        return ssl.create_default_context()
    except Exception:
        return ssl._create_unverified_context()


def fetch_json(url, timeout=20):
    """
    Robust HTTP GET with realistic browser headers and SSL fallback.
    Returns parsed JSON object/list or None on failure.
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    req = urllib.request.Request(url, headers=headers)

    for try_unverified in (False, True):
        try:
            ctx = get_ssl_context(unverified=try_unverified)
            with urllib.request.urlopen(req, timeout=timeout, context=ctx) as response:
                if response.status == 200:
                    raw = response.read().decode('utf-8')
                    return json.loads(raw)
        except Exception as e:
            if try_unverified:
                print(f"❌ Failed to fetch from {url}: {e}")
    return None


NON_CRICKET_SPORTS = {
    'football', 'soccer', 'basketball', 'nba', 'tennis', 'hockey', 'baseball', 'mlb',
    'nfl', 'rugby', 'volleyball', 'handball', 'badminton', 'table tennis', 'mma', 'ufc',
    'wwe', 'wrestling', 'boxing', 'f1', 'formula 1', 'formula1', 'motogp', 'motorsport',
    'kabaddi', 'golf', 'darts', 'snooker', 'swimming', 'athletics'
}

NON_CRICKET_LEAGUES = {
    'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1', 'champions league',
    'europa league', 'mls', 'isl', 'fifa', 'copa', 'fa cup', 'carabao',
    'euroleague', 'atp', 'wta', 'grand slam', 'wimbledon', 'us open', 'french open',
    'australian open', 'formula 1', 'motogp', 'nascar', 'ufc', 'wwe'
}

CRICKET_INDICATORS = {
    'cricket', 't20', 'odi', 'test match', 'test (', 'test(', 'day 1', 'day 2', 'day 3', 'day 4', 'day 5',
    'ipl', 'bbl', 'psl', 'cpl', 'wpl', 'bpl', 'hundred', 'ranji', 'super smash',
    'willow', 'cricbuzz', 'star sports', 'icc', 'bcci', 'asia cup', 'world cup', 't10',
    'ashes', 'trophy'
}


def is_cricket_match(item):
    """
    Strictly verifies whether a match item is cricket.
    Rejects any non-cricket sports (football, basketball, tennis, combat, etc.).
    """
    if not isinstance(item, dict):
        return False

    # Check explicit sport property (common in multi-sport APIs like dilzzy)
    sport = str(item.get('sport') or '').strip().lower()
    if sport:
        return 'cricket' in sport

    # Check category property
    category = str(item.get('category') or '').strip().lower()
    if category:
        if 'cricket' in category:
            return True
        if any(ns in category for ns in NON_CRICKET_SPORTS):
            return False

    # Check event_type / sport_type
    event_type = str(item.get('event_type') or item.get('sport_type') or '').strip().lower()
    if event_type:
        if 'cricket' in event_type:
            return True
        if any(ns in event_type for ns in NON_CRICKET_SPORTS):
            return False

    # Check league / tournament name
    league = str(item.get('league') or item.get('tournament') or '').strip().lower()
    if league:
        if any(nl in league for nl in NON_CRICKET_LEAGUES):
            return False
        if any(ci in league for ci in CRICKET_INDICATORS):
            return True

    # Check title / event_name / match teams text
    text = f"{item.get('title', '')} {item.get('event_name', '')} {item.get('name', '')} {item.get('teams', '')}".lower()
    if any(nl in text for nl in NON_CRICKET_LEAGUES):
        return False
    if any(ns in text for ns in ('ufc ', 'wwe ', 'formula 1', 'grand prix', 'motogp', 'nba ', 'nhl ', 'nfl ')):
        return False

    return True


def normalize_matches(raw_data):
    """
    Normalizes cricket match data from different API schemas into the
    standard array format expected by the frontend (with id, title,
    status, event details, and dashStreams).
    Strictly filters to include only cricket matches.
    """
    if isinstance(raw_data, list):
        raw_list = raw_data
    elif isinstance(raw_data, dict):
        raw_list = raw_data.get('matches') or raw_data.get('Matches') or []
    else:
        return []

    if not raw_list:
        return []

    # Strictly filter for cricket matches only
    raw_list = [m for m in raw_list if is_cricket_match(m)]
    if not raw_list:
        return []

    normalized = []
    for idx, m in enumerate(raw_list):
        if not isinstance(m, dict):
            continue
        item = dict(m)

        # Ensure match has id
        if 'id' not in item and 'match_id' in item:
            item['id'] = item['match_id']
        elif 'id' not in item:
            item['id'] = idx + 1

        # Ensure title
        if 'title' not in item and 'event_name' in item:
            item['title'] = item['event_name']

        # Ensure event object with teams, flags, and logos
        if 'event' not in item and ('teams' in item or 'title' in item):
            teams_str = str(item.get('teams') or item.get('title') or '')
            parts = teams_str.split(' vs ') if ' vs ' in teams_str else [teams_str, '']
            thumb = item.get('thumbnail') or item.get('logo') or '/public/favicon.png'
            item['event'] = {
                'name': item.get('league') or item.get('title') or 'Cricket Match',
                'teamA': parts[0].strip(),
                'teamB': parts[1].strip() if len(parts) > 1 else '',
                'logo': thumb,
                'teamAFlag': item.get('teamAFlag') or thumb,
                'teamBFlag': item.get('teamBFlag') or thumb,
                'startTimeIST': item.get('time') or item.get('startTimeIST') or 'Live Now'
            }

        # Normalize dashStreams from server_urls / streams if not already present
        if 'dashStreams' not in item or not item['dashStreams']:
            servers = item.get('server_urls') or item.get('streams') or item.get('servers') or []
            if isinstance(servers, list) and servers:
                dash_streams = []
                for s_idx, s in enumerate(servers):
                    url = s if isinstance(s, str) else (s.get('url') or s.get('stream') or s.get('src') or '')
                    if not url:
                        continue
                    label = (s.get('title') or s.get('name')) if isinstance(s, dict) else f"Server {s_idx + 1}"
                    key = s.get('key') if isinstance(s, dict) else item.get('drm_key') or item.get('key')
                    dash_streams.append({
                        'title': label,
                        'type': 'dash' if '.mpd' in url else ('hls' if '.m3u8' in url else 'embed'),
                        'url': url,
                        'key': key
                    })
                if dash_streams:
                    item['dashStreams'] = dash_streams

        normalized.append(item)

    return normalized


def update_cricket_json():
    """
    Tries each configured API source in priority order.
    Normalizes the matches and safely updates api/cricket.json.
    """
    os.makedirs(API_DIR, exist_ok=True)
    fresh_matches = None
    successful_source = None

    for label, url in API_SOURCES:
        print(f"📡 Fetching from {label}: {url}")
        raw = fetch_json(url)
        if raw is not None:
            matches = normalize_matches(raw)
            if matches and len(matches) > 0:
                fresh_matches = matches
                successful_source = label
                print(f"✅ Received {len(fresh_matches)} valid cricket matches from {label}")
                break
            else:
                print(f"⚠️ {label} returned empty match list.")
        else:
            print(f"⚠️ {label} request failed.")

    if not fresh_matches:
        print("⚠️ All API sources failed or returned empty. Preserving existing api/cricket.json.")
        return False

    # Check if data actually changed to avoid empty git commits
    if os.path.exists(CRICKET_FILE):
        try:
            with open(CRICKET_FILE, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            if existing_data == fresh_matches:
                print(f"ℹ️ {CRICKET_FILE} is already up to date with {successful_source} (no changes).")
                return True
        except Exception:
            pass

    # Save to api/cricket.json
    with open(CRICKET_FILE, 'w', encoding='utf-8') as f:
        json.dump(fresh_matches, f, indent=2, ensure_ascii=False)

    print(f"💾 Updated {CRICKET_FILE} with {len(fresh_matches)} matches from {successful_source}.")
    return True


def main():
    print("\n" + "=" * 60)
    print("🏏 CRICKET MATCHES DATA SYNC")
    print(f"⏰ Run timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    success = update_cricket_json()

    print("=" * 60)
    print(f"Status: {'✅ Completed successfully' if success else '⚠️ Preserved existing data'}")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
