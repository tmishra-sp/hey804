#!/usr/bin/env python3
import requests
import json

service_group_addr = "https://webapi.citizenservices.org/rvaone/api/v1/servicegroups"


"""
Gets a list of service groups and their associated services. 
Supplements data with source links to rva311.com for each group and service.
Services with `category: 0` allow service request submission, `category: 1` only provides links or contact information.

Example usage from repo root: `python3 ./scripts/get-311-service-links.py >> ./server/data/data-311.json`
"""


def get_311_data():
    # Get all top level service group categories
    service_groups = requests.get(service_group_addr).json()
    for service_group in service_groups:
        services_addr = service_group_addr + "/" + service_group["id"] + "/services"
        # Add source link for service group, links to 311 showing category expanded where user can select specific services
        service_group["source"] = (
            "https://www.rva311.com/rvaone#/request/new?gid=" + service_group["id"]
        )
        # Get all services for the service group category
        services = requests.get(services_addr).json()
        # Add source link for each service, links to creating a new service request in 311
        for service in services:
            service["source"] = (
                "https://www.rva311.com/rvaone#/request/new/"
                + service["id"]
                + "?gid="
                + service_group["id"]
            )
        service_group["services"] = services
    return service_groups


if __name__ == "__main__":
    data = get_311_data()
    print(json.dumps(data, indent=2))
