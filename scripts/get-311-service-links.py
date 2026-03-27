#!/usr/bin/env python3
import requests

service_group_addr = "https://webapi.citizenservices.org/rvaone/api/v1/servicegroups"
example_service_group_services = "https://webapi.citizenservices.org/rvaone/api/v1/servicegroups/31cd796e-e824-41c0-b770-18b0ed86c93a/services"


def get_311_data():
    service_groups = requests.get(service_group_addr).json()
    for service_group in service_groups:
        services_addr = service_group_addr + "/" + service_group["id"] + "/services"
        service_group["source"] = (
            "https://www.rva311.com/rvaone#/request/new?gid=" + service_group["id"]
        )
        services = requests.get(services_addr).json()
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
