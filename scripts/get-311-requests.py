#!/usr/bin/env python3
import requests
import json
import time

requests_addr = "https://webapi.citizenservices.org/rvaone/api/v1/requests"

HEADERS = {
    "accept": "application/json,text/plain,*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json; charset=UTF-8",
    "languagecode": "1033",
    "origin": "https://www.rva311.com",
    "referer": "https://www.rva311.com/",
    "timezoneoffset": "240",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
}

PAGES = 100
DAYS_BACK = 360


"""
Gets the first 10 pages of 311 service requests, ordered by requestDate descending.
Uses a rolling date window of the past 90 days ending now.

Example usage from repo root: `python3 ./scripts/get-311-requests.py >> ./server/data/requests-311.json`
"""


def get_311_requests():
    end_ms = int(time.time() * 1000)
    start_ms = end_ms - (DAYS_BACK * 24 * 60 * 60 * 1000)

    all_requests = []
    for page_number in range(1, PAGES + 1):
        payload = {
            "end": end_ms,
            "start": start_ms,
            "orderBy": "requestDate",
            "orderDirection": "desc",
            "pageNumber": page_number,
        }
        response = requests.post(requests_addr, headers=HEADERS, json=payload)
        response.raise_for_status()
        data = response.json().get("data", [])
        if not data:
            break
        all_requests.extend(data)
    return all_requests


if __name__ == "__main__":
    data = get_311_requests()
    print(json.dumps(data, indent=2))
    ## save to data/311-requests.json
    with open("./data/311-requests.json", "w") as f:
        json.dump(data, f, indent=2)    
