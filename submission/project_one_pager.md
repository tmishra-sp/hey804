# Project One-Pager

## Project name
- Hey804

## Team name
- Team Mad_Hamilton

## Pillar
Thriving City Hall

## User
The primary user is richmond residents, but the functionality is applicaple to 311 operators assiting residents as well.

## Problem
Users experience difficulty navigating rva.gov and rva311, which hinders their ability to locate the information needed to accomplish their goals.

## Why it matters
This is important because it frustrates users, makes it harder to complete basic tasks such as reporting potholes, and increases the likelihood of misclassified requests.

## Alignment
This aligns with the theme of "Helping Residents Find the Right City Service".

## Proposed solution 
We are building a service to help residents find public city of Richmond information and service using plain text. We are exposing this service through a reusable web widget, text line, and other sources.

## Core user flow
1. User messages the service with a plain text query about city services.
2. The Service replies with a response that includes pertinent information and direct links to existing rva sources.

## Data or document sources
- rva.gov
- rva 311

## MVP scope
-  A widget that can be added to other pages, and a backend service to respond to queries coming from the widget.

## What this project does not do
- The project does not submit tickets to 311
- The project does not act as a source of truth for queries, but instead attempts to direct users to the correct source of truth.

## Risks and limitations
- Responses can be over confident
    - To mitigate this we grade confidence and if the confidence is too low we do not return information but instead ask the user to be more specific.
- Timeline challenges
- The data we use can get stale and outdated
    - We have update scripts to mitigate this risk

## Demo plan
What will you show in the live demo?

## Longer-term potential
After the hackathon we will have a usable service and widget that can be added to any rva based web sites. We will also have scripts that can run to refresh the underlying data.
